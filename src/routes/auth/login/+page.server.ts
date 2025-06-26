import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	login: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			let message = 'Something went wrong';

			if (error.message === 'Invalid login credentials') {
				message = 'Login credentials are incorrect';
			} else if (error.message === 'User already registered') {
				message = 'User already exists';
			} else if (error.status === 500 || error.message.includes('500')) {
				message = 'Server 500 error';
			}

			const errorUrl = new URL('/auth/error', url);
			errorUrl.searchParams.set('message', message);
			throw redirect(303, errorUrl.toString());
		}

		throw redirect(303, '/');
	}
};
