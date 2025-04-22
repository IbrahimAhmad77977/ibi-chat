import { supabaseClient } from '$lib/supabase';
import { json, type RequestEvent } from '@sveltejs/kit';

export async function GET({ url, locals }: RequestEvent) {
	const currentUser = locals.user;
	const otherUsername = url.searchParams.get('other');

	if (!currentUser || !otherUsername) {
		return json({ error: 'Missing parameters' }, { status: 400 });
	}

	// Get the username from the accounts table using currentUser.email
	const { data: userData, error: userError } = await supabaseClient
		.from('accounts')
		.select('username')
		.eq('email', currentUser.email)
		.single();

	if (userError || !userData) {
		console.error('User lookup failed', userError);
		return json({ error: 'User not found in accounts table' }, { status: 500 });
	}

	const username = userData.username;

	// Get all messages where either participant is the current user or the other user
	const { data, error } = await supabaseClient
		.from('messages')
		.select('*')
		.or(`sender.eq.${username},receiver.eq.${username}`)
		.or(`sender.eq.${otherUsername},receiver.eq.${otherUsername}`)
		.order('created_at', { ascending: true });

	if (error) {
		console.error(error);
		return json({ error: 'Failed to fetch messages' }, { status: 500 });
	}

	// Only return messages between the current user and the other user
	const filtered = data?.filter(
		(msg) =>
			(msg.sender === username && msg.receiver === otherUsername) ||
			(msg.sender === otherUsername && msg.receiver === username)
	);

	return json({ messages: filtered });
}
