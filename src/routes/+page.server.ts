import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { supabaseClient } from '$lib/supabase';
import type { RequestEvent } from '@sveltejs/kit';

type Message = {
  content: string;
  created_at: string;
};

type Account = {
  id: string;
  username: string;
  latestMessage?: string;
  latestTime?: string;
};

export async function load({ locals, url }: RequestEvent) {
  const { data: userData } = await locals.supabase.auth.getUser();
  const userEmail = userData?.user?.email;

  if (!userEmail) throw redirect(303, '/auth/login');

  const { data: accountData } = await supabaseClient
    .from('accounts')
    .select('id, username')
    .eq('email', userEmail)
    .single();

  if (!accountData) {
    throw redirect(303, '/auth/login');
  }

	const username = accountData?.username;

  const { data: messagedUsernamesData, error: convoError } = await supabaseClient
  .from('messages')
  .select('sender, receiver')
  .or(`sender.eq.${username},receiver.eq.${username}`);
  if (convoError) {
    console.error('Error fetching conversation user IDs:', convoError);
  }

  const messagedUsernamesSet = new Set<string>();
  messagedUsernamesData?.forEach((msg) => {
    if (msg.sender !== username) messagedUsernamesSet.add(msg.sender);
    if (msg.receiver !== username) messagedUsernamesSet.add(msg.receiver);
  });
  const messagedUsernames = Array.from(messagedUsernamesSet);

  const latestMessagesMap = new Map<string, Message>();

  for (const otherUser of messagedUsernames) {
    const { data: latestMessage } = await supabaseClient
      .from('messages')
      .select('content, created_at')
      .or(`and(sender.eq.${username},receiver.eq.${otherUser}),and(sender.eq.${otherUser},receiver.eq.${username})`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
  
    if (latestMessage) {
      latestMessagesMap.set(otherUser, latestMessage);
    }
  }

  let accountsdata: Account[] = [];

  if (messagedUsernames.length > 0) {
    const { data: filteredAccounts, error } = await supabaseClient
      .from('accounts')
      .select('id, username')
      .in('id', messagedUsernames);

    if (error) {
      console.error('Error fetching filtered accounts:', error);
    } else {
      accountsdata = (filteredAccounts ?? []).map((acc) => ({
        ...acc,
        latestMessage: latestMessagesMap.get(acc.username)?.content ?? '',
        latestTime: latestMessagesMap.get(acc.username)?.created_at ?? ''
      }));
    }
  }

  const receiver = url.searchParams.get('receiver');
  let messagesdata = [];

  if (receiver) {
    const { data: messageList, error } = await supabaseClient
      .from('messages')
      .select()
      .or(`and(sender.eq.${username},receiver.eq.${receiver}),and(sender.eq.${receiver},receiver.eq.${username})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      messagesdata = messageList ?? [];
    }
  }

  return {
    user: { username },
    accounts: accountsdata,
    messages: messagesdata,
    receiver
  };
}

export const actions: Actions = {
  logout: async ({ locals: { supabase }, cookies }) => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
      throw redirect(303, '/auth/error');
    }
    cookies.delete('session', { path: '/' });
    throw redirect(303, '/auth/login');
  },
  
  sendMessage: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const message = formData.get('message') as string;
    const receiver = formData.get('receiver') as string;

    const { data: userData } = await supabase.auth.getUser();
    const userEmail = userData?.user?.email;

    const { data: accountData } = await supabaseClient
      .from('accounts')
      .select('username')
      .eq('email', userEmail)
      .single();

    const sender = accountData?.username;

    if (!message || !receiver || !sender) {
      console.error('Missing fields in sendMessage');
      return;
    }

    const { error } = await supabase
      .from('messages')
      .insert({ content: message, sender, receiver });

    if (error) {
      console.error('Send message error:', error);
    } else {
      console.log('Message sent successfully');
    }
  },

  updateUsername: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const newUsername = formData.get('username') as string;

    if (!newUsername || newUsername.trim() === '') {
      console.error('Invalid username');
      return { success: false, message: 'Username cannot be empty.' };
    }

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user?.email) {
      console.error('Error fetching user from auth');
      return { success: false, message: 'Authentication error.' };
    }
    const userEmail = userData.user.email;

    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .select('id, username')
      .eq('email', userEmail)
      .single();

    if (accountError || !accountData) {
      console.error('Error fetching account data', accountError);
      return { success: false, message: 'Failed to fetch account.' };
    }

    const { id: userId, username: oldUsername } = accountData;

    const { data: existingUser, error: checkError } = await supabase
      .from('accounts')
      .select('id')
      .eq('username', newUsername)
      .neq('id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing username', checkError);
      return { success: false, message: 'Failed to validate username.' };
    }

    if (existingUser) {
      return { success: false, message: 'Username is already taken.' };
    }

    const { error: updateAccountError } = await supabase
      .from('accounts')
      .update({ username: newUsername })
      .eq('id', userId);

    if (updateAccountError) {
      console.error('Error updating account username:', updateAccountError);
      return { success: false, message: 'Failed to update account username.' };
    }

    const { error: updateSenderError } = await supabase
      .from('messages')
      .update({ sender_id: userId })
      .eq('sender_id', userId);

    if (updateSenderError) {
      console.error('Error updating messages sender:', updateSenderError);
      return { success: false, message: 'Failed to update messages sender.' };
    }

    const { error: updateReceiverError } = await supabase
      .from('messages')
      .update({ receiver_id: userId })
      .eq('receiver_id', userId);

    if (updateReceiverError) {
      console.error('Error updating messages receiver:', updateReceiverError);
      return { success: false, message: 'Failed to update messages receiver.' };
    }

    console.log('Username and related messages updated successfully.');
    return { success: true, message: 'Username updated successfully!' };
  }
};
