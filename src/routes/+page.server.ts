import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { supabaseClient } from '$lib/supabase';
import type { RequestEvent } from '@sveltejs/kit';

export async function load({ locals, url }: RequestEvent) {
	const { data: userData } = await locals.supabase.auth.getUser();
	const userEmail = userData?.user?.email;

	if (!userEmail) throw redirect(303, '/auth/login');

	const { data: accountData } = await supabaseClient
		.from('accounts')
		.select('username')
		.eq('email', userEmail)
		.single();

	const username = accountData?.username;

	// Fetch users the current user has exchanged messages with
	const { data: messagedUsernamesData, error: convoError } = await supabaseClient
		.from('messages')
		.select('sender, receiver')
		.or(`sender.eq.${username},receiver.eq.${username}`);

	if (convoError) {
		console.error('Error fetching conversation users:', convoError);
	}

	// Extract unique usernames (excluding self)
	const messagedUsernamesSet = new Set<string>();
	messagedUsernamesData?.forEach((msg) => {
		if (msg.sender !== username) messagedUsernamesSet.add(msg.sender);
		if (msg.receiver !== username) messagedUsernamesSet.add(msg.receiver);
	});
	const messagedUsernames = Array.from(messagedUsernamesSet);
	// Map to hold latest message per conversation
const latestMessagesMap = new Map<string, { content: string; created_at: string }>();

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

	// Fetch the actual user accounts for those usernames
	let accountsdata = [];
	if (messagedUsernames.length > 0) {
		const { data: filteredAccounts, error } = await supabaseClient
			.from('accounts')
			.select()
			.in('username', messagedUsernames);

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

	// Optional: load messages if a chat is selected
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
	
		// Validate
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
	
		// Fetch old username
		const { data: accountData, error: accountError } = await supabaseClient
			.from('accounts')
			.select('username')
			.eq('email', userEmail)
			.single();
	
		if (accountError || !accountData?.username) {
			console.error('Error fetching account data', accountError);
			return { success: false, message: 'Failed to fetch current username.' };
		}
	
		const oldUsername = accountData.username;
		const { data: existingUser, error: checkError } = await supabaseClient
		.from('accounts')
		.select('username')
		.eq('username', newUsername)
		.single();

	if (checkError && checkError.code !== 'PGRST116') { // Ignore "no rows" error
		console.error('Error checking for existing username', checkError);
		return { success: false, message: 'Failed to validate username.' };
	}

	if (existingUser && existingUser.username !== oldUsername) {
		// Username exists and is NOT owned by current user
		return { success: false, message: 'Username is already taken.' };
	}

		// 1. Update 'accounts' table
		const { error: updateAccountError } = await supabaseClient
			.from('accounts')
			.update({ username: newUsername })
			.eq('email', userEmail);
	
		if (updateAccountError) {
			console.error('Error updating account username:', updateAccountError);
			return { success: false, message: 'Failed to update username.' };
		}
	
		// 2. Update 'messages' sender field
		const { error: updateSenderError } = await supabaseClient
			.from('messages')
			.update({ sender: newUsername })
			.eq('sender', oldUsername);
	
		if (updateSenderError) {
			console.error('Error updating messages sender:', updateSenderError);
			return { success: false, message: 'Failed to update messages sender.' };
		}
	
		// 3. Update 'messages' receiver field
		const { error: updateReceiverError } = await supabaseClient
			.from('messages')
			.update({ receiver: newUsername })
			.eq('receiver', oldUsername);
	
		if (updateReceiverError) {
			console.error('Error updating messages receiver:', updateReceiverError);
			return { success: false, message: 'Failed to update messages receiver.' };
		}
	
		console.log('Username and message references updated successfully.');
		return { success: true, message: 'Username updated successfully!' };
	}
	};

