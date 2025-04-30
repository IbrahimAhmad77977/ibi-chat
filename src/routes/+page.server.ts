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

	const currentUserId = accountData.id;
	const username = accountData.username;

	const { data: messagedIdsData, error: convoError } = await supabaseClient
		.from('messages')
		.select('sender_id, receiver_id')
		.or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

	if (convoError) {
		console.error('Error fetching conversation user IDs:', convoError);
	}

	const otherUserIdSet = new Set<string>();
	messagedIdsData?.forEach((msg) => {
		if (msg.sender_id !== currentUserId) otherUserIdSet.add(msg.sender_id);
		if (msg.receiver_id !== currentUserId) otherUserIdSet.add(msg.receiver_id);
	});
	const otherUserIds = Array.from(otherUserIdSet);

	const latestMessagesMap = new Map<string, Message>();

	for (const otherUserId of otherUserIds) {
		const { data: latestMessage } = await supabaseClient
			.from('messages')
			.select('content, created_at')
			.or(
				`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
			)
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		if (latestMessage) {
			latestMessagesMap.set(otherUserId, latestMessage);
		}
	}

	let accountsdata: Account[] = [];

	if (otherUserIds.length > 0) {
		const { data: filteredAccounts, error } = await supabaseClient
			.from('accounts')
			.select('id, username')
			.in('id', otherUserIds);

		if (error) {
			console.error('Error fetching filtered accounts:', error);
		} else {
			accountsdata = (filteredAccounts ?? []).map((acc) => ({
				...acc,
				latestMessage: latestMessagesMap.get(acc.id)?.content ?? '',
				latestTime: latestMessagesMap.get(acc.id)?.created_at ?? ''
			}));
		}
	}

	const receiverId = url.searchParams.get('receiver');
	let messagesdata = [];

	if (receiverId) {
		const { data: messageList, error } = await supabaseClient
			.from('messages')
			.select()
			.or(
				`and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId})`
			)
			.order('created_at', { ascending: true });

		if (error) {
			console.error('Error fetching messages:', error);
		} else {
			messagesdata = messageList ?? [];
		}
	}

	return {
		user: { id: currentUserId, username },
		accounts: accountsdata,
		messages: messagesdata,
		receiver: receiverId
	};
}

export const actions: Actions = {
	logout: async ({ locals: { supabase }, cookies }) => {
		// Sign out the user
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error(error);
			// Redirect to an error page if sign out fails
			throw redirect(303, '/auth/error');
		}

		// Optional: Clear any session-related cookies (if applicable)
		cookies.delete('session', { path: '/' });

		// Redirect to the login page after successful logout
		throw redirect(303, '/auth/login');
	},
	
  sendMessage: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const message = formData.get('message') as string;
    const receiverUsername = formData.get('receiver') as string;
  
    const { data: userData } = await supabase.auth.getUser();
    const userEmail = userData?.user?.email;
  
    if (!message || !receiverUsername || !userEmail) {
      console.error('Missing fields in sendMessage');
      return;
    }
  
    // Fetch sender account info
    const { data: senderData, error: senderError } = await supabase
      .from('accounts')
      .select('id, username')
      .eq('email', userEmail)
      .single();
  
    if (senderError || !senderData) {
      console.error('Could not find sender account:', senderError);
      return;
    }
  
    // Fetch receiver account info
    const { data: receiverData, error: receiverError } = await supabase
      .from('accounts')
      .select('id')
      .eq('username', receiverUsername)
      .single();
  
    if (receiverError || !receiverData) {
      console.error('Could not find receiver account:', receiverError);
      return;
    }
  
    const { error } = await supabase
      .from('messages')
      .insert({
        content: message,
        sender_id: senderData.id,
        receiver_id: receiverData.id
      });
  
    if (error) {
      console.error('Send message error:', error);
    } else {
      console.log('Message sent successfully');
    }
  },
    
  updateUsername: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const newUsername = formData.get('username') as string;

    // Validate input
    if (!newUsername || newUsername.trim() === '') {
      console.error('Invalid username');
      return { success: false, message: 'Username cannot be empty.' };
    }

    // Get current user email
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user?.email) {
      console.error('Error fetching user from auth');
      return { success: false, message: 'Authentication error.' };
    }
    const userEmail = userData.user.email;

    // Get user account by email
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

    // Check if the new username is already taken by another user
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

    // ✅ Update accounts table with new username
    const { error: updateAccountError } = await supabase
      .from('accounts')
      .update({ username: newUsername })
      .eq('id', userId);

    if (updateAccountError) {
      console.error('Error updating account username:', updateAccountError);
      return { success: false, message: 'Failed to update account username.' };
    }

    // ✅ Update messages table where sender_id = userId
    const { error: updateSenderError } = await supabase
      .from('messages')
      .update({ sender_id: userId }) // Fix: sender_id should remain the same for the user.
      .eq('sender_id', userId);

    if (updateSenderError) {
      console.error('Error updating messages sender:', updateSenderError);
      return { success: false, message: 'Failed to update messages sender.' };
    }

    // ✅ Update messages table where receiver_id = userId
    const { error: updateReceiverError } = await supabase
      .from('messages')
      .update({ receiver_id: userId }) // Fix: receiver_id should be updated if needed
      .eq('receiver_id', userId);

    if (updateReceiverError) {
      console.error('Error updating messages receiver:', updateReceiverError);
      return { success: false, message: 'Failed to update messages receiver.' };
    }

    console.log('Username and related messages updated successfully.');
    return { success: true, message: 'Username updated successfully!' };
}
  
}