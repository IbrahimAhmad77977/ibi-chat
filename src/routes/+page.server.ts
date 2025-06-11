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

	// ✅ Fetch all accounts except the current user
	const { data: allAccounts, error: allError } = await supabaseClient
		.from('accounts')
		.select('id, username')
		.neq('id', currentUserId);

	if (allError) {
		console.error('Error fetching all accounts:', allError);
	}

	// ✅ For each account, optionally fetch latest message
	const accountsdata = await Promise.all(
		(allAccounts ?? []).map(async (acc) => {
			const { data: latestMessage } = await supabaseClient
				.from('messages')
				.select('content, created_at')
				.or(
					`and(sender_id.eq.${currentUserId},receiver_id.eq.${acc.id}),and(sender_id.eq.${acc.id},receiver_id.eq.${currentUserId})`
				)
				.order('created_at', { ascending: false })
				.limit(1)
				.single();

			return {
				...acc,
				latestMessage: latestMessage?.content ?? '',
				latestTime: latestMessage?.created_at ?? ''
			};
		})
	);

	// ✅ Get messages with selected receiver (if any)
	const receiverId = url.searchParams.get('receiver_id');
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
		accounts: accountsdata,       // ✅ Now includes all users except self
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
    const receiverIdFromForm = formData.get('receiver_id') as string;
  
    const { data: userData } = await supabase.auth.getUser();
    const userEmail = userData?.user?.email;
  
    if (!message || !userEmail || (!receiverUsername && !receiverIdFromForm)) {
      console.error('Missing fields in sendMessage');
      return;
    }
  
    // Get sender account info
    const { data: senderData, error: senderError } = await supabase
      .from('accounts')
      .select('id, username')
      .eq('email', userEmail)
      .single();
  
    if (senderError || !senderData) {
      console.error('Could not find sender account:', senderError);
      return;
    }
  
    let receiverId: string | undefined;
  
    if (receiverIdFromForm) {
      // Use receiver ID directly if provided
      receiverId = receiverIdFromForm;
    } else {
      // Otherwise resolve receiver ID from username
      const { data: receiverData, error: receiverError } = await supabase
        .from('accounts')
        .select('id')
        .eq('username', receiverUsername)
        .single();
  
      if (receiverError || !receiverData) {
        console.error('Could not find receiver account:', receiverError);
        return;
      }
  
      receiverId = receiverData.id;
    }
  
    const { error } = await supabase
      .from('messages')
      .insert({
        content: message,
        sender_id: senderData.id,
        receiver_id: receiverId
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

  
    console.log('Username and related messages updated successfully.');
    return { success: true, message: 'Username updated successfully!' };
  }
  
}