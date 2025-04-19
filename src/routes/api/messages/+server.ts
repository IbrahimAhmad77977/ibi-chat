import { supabaseClient } from '$lib/supabase';
import { json, type RequestEvent } from '@sveltejs/kit';

export async function GET({ url, locals }: RequestEvent) {
	const currentUser = locals.user;
	const otherUsername = url.searchParams.get('other');

	if (!currentUser || !otherUsername) {
		return json({ error: 'Missing parameters' }, { status: 400 });
	}

	const username = currentUser.username;

	const { data, error } = await supabaseClient
  .from('messages')
  .select('*')
  .order('created_at', { ascending: true });


	if (error) {
		console.error(error);
		return json({ error: 'Failed to fetch messages' }, { status: 500 });
	}

	return json({ messages: data });
}
