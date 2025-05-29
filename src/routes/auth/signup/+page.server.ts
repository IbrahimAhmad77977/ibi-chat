import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	signup: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const username = formData.get('username') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const { error: signUpError } = await supabase.auth.signUp({ email, password });

		if (signUpError) {
			let message = 'Something went wrong';

			if (signUpError.message === 'User already registered') {
				message = 'User already exists';
			} else if (signUpError.status === 500 || signUpError.message.includes('500')) {
				message = 'Server 500 error';
			}

			const errorUrl = new URL('/auth/error', url);
			errorUrl.searchParams.set('message', message);
			throw redirect(303, errorUrl.toString());
		}

		// Insert additional user info after successful signup
		const { error: dbError } = await supabase
			.from('accounts')
			.insert({ username, email });

		if (dbError) {
			const errorUrl = new URL('/auth/error', url);
			errorUrl.searchParams.set('message', 'Server 500 error');
			throw redirect(303, errorUrl.toString());
		}

		throw redirect(303, '/');
	}
};
