import { supabaseClient } from '$lib/supabase';
import { json, type RequestEvent } from '@sveltejs/kit';

export async function GET({ url, locals }: RequestEvent) {
	const currentUser = locals.user;
	const otherUsername = url.searchParams.get('other');

	if (!currentUser || !otherUsername) {
		return json({ error: 'Missing parameters' }, { status: 400 });
	}

	// Get current user's account (id and username)
	const { data: currentAccount, error: userError } = await supabaseClient
		.from('accounts')
		.select('id, username')
		.eq('email', currentUser.email)
		.single();

	if (userError || !currentAccount) {
		console.error('User lookup failed', userError);
		return json({ error: 'User not found in accounts table' }, { status: 500 });
	}

	const currentUserId = currentAccount.id;

	// Get other user's account (id and username)
	const { data: otherAccount, error: otherError } = await supabaseClient
		.from('accounts')
		.select('id, username')
		.eq('username', otherUsername)
		.single();

	if (otherError || !otherAccount) {
		console.error('Other user lookup failed', otherError);
		return json({ error: 'Other user not found in accounts table' }, { status: 500 });
	}

	const otherUserId = otherAccount.id;

	// Fetch messages between the two users
	const { data: rawMessages, error } = await supabaseClient
		.from('messages')
		.select('id, content, created_at, sender_id, receiver_id')
		.or(
			`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
		)
		.order('created_at', { ascending: true });

	if (error) {
		console.error('Message fetch failed', error);
		return json({ error: 'Failed to fetch messages' }, { status: 500 });
	}

	// Enrich messages with usernames (for display purposes)
	const messages = rawMessages.map((msg) => ({
		...msg,
		sender: msg.sender_id === currentUserId ? currentAccount.username : otherAccount.username,
		receiver: msg.receiver_id === currentUserId ? currentAccount.username : otherAccount.username
	}));

	return json({ messages });
}
