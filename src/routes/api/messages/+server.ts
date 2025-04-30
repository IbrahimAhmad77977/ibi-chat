import { supabaseClient } from '$lib/supabase';
import { json, type RequestEvent } from '@sveltejs/kit';

export async function GET({ url, locals }: RequestEvent) {
	const currentUser = locals.user;
	const otherUsername = url.searchParams.get('other');

	if (!currentUser || !otherUsername) {
		return json({ error: 'Missing parameters' }, { status: 400 });
	}

	// Get current user's account ID
	const { data: userData, error: userError } = await supabaseClient
		.from('accounts')
		.select('id')
		.eq('email', currentUser.email)
		.single();

	if (userError || !userData) {
		console.error('User lookup failed', userError);
		return json({ error: 'User not found in accounts table' }, { status: 500 });
	}

	const currentUserId = userData.id;

	// Get other user's account ID by username
	const { data: otherData, error: otherError } = await supabaseClient
		.from('accounts')
		.select('id')
		.eq('username', otherUsername)
		.single();

	if (otherError || !otherData) {
		console.error('Other user lookup failed', otherError);
		return json({ error: 'Other user not found in accounts table' }, { status: 500 });
	}

	const otherUserId = otherData.id;

	// Get messages where sender/receiver match current and other user
	const { data, error } = await supabaseClient
		.from('messages')
		.select('*')
		.or(
			`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
		)
		.order('created_at', { ascending: true });

	if (error) {
		console.error('Message fetch failed', error);
		return json({ error: 'Failed to fetch messages' }, { status: 500 });
	}

	return json({ messages: data });
}
