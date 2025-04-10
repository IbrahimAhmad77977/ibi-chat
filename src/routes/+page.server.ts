import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { supabaseClient } from '$lib/supabase';
import type { RequestEvent } from '@sveltejs/kit';

// You can define the type for 'locals' as per your application's needs
interface Locals {
    user?: {
        username: string;
        email: string;
    };
}



export async function load({ locals, url }: RequestEvent) {
	const user = locals.user;
    const pathname = url.pathname;

	const { data: userData } = await locals.supabase.auth.getUser();
	const userEmail = userData?.user?.email;

	if (!userEmail) throw redirect(303, '/auth/login');

	const { data: accountData } = await supabaseClient
		.from('accounts')
		.select('username')
		.eq('email', userEmail)
		.single();

	const username = accountData?.username;

	const { data: accountsdata, error: accountsError } = await supabaseClient
		.from('accounts')
		.select();

	if (accountsError) {
		console.error('Error fetching accounts:', accountsError);
	}

	// Get the selected receiver from the URL query parameters
	const receiver = url.searchParams.get('receiver');

	let messagesdata = [];
	if (receiver) {
		// Fetch messages between the current user and the selected receiver
		const { data, error } = await supabaseClient
			.from('messages')
			.select()
			.or(`sender.eq.${username},receiver.eq.${username}`)
			.or(`sender.eq.${receiver},receiver.eq.${receiver}`)
			.order('created_at', { ascending: true }); // Ensure messages are ordered by time

		if (error) {
			console.error('Error fetching messages:', error);
		} else {
			messagesdata = data ?? []; // Ensure `data` is used
		}
	}

	return {
		user: { email: userEmail, username },
		accounts: accountsdata ?? [],
		messages: messagesdata,
		receiver,
	};
}

export const actions: Actions = {
	logout: async ({ locals: { supabase } }) => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error(error);
			throw redirect(303, '/auth/error');
		}
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

		// Insert the message with sender and receiver
		const { error } = await supabase
			.from('messages')
			.insert({ content: message, sender, receiver });

		if (error) {
			console.error('Send message error:', error);
		} else {
			console.log('Message sent successfully');
		}
	}
};
