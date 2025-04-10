import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as EmailOtpType | null;
	const next = url.searchParams.get('next') ?? '/';

	const redirectTo = new URL(url);
	redirectTo.pathname = next;
	redirectTo.searchParams.delete('token_hash');
	redirectTo.searchParams.delete('type');

	if (token_hash && type) {
		const { error } = await supabase.auth.verifyOtp({ type, token_hash });

		if (!error) {
			redirectTo.searchParams.delete('next');
			throw redirect(303, redirectTo.toString());
		} else {
			const errorMap: Record<string, string> = {
				'Invalid login credentials': 'Invalid login credentials. Please try again.',
				'User already registered': 'User already exists. Try logging in instead.',
				'Invalid token': 'The confirmation link is invalid or has expired.',
				'Token has expired or already been used': 'This link has expired or already been used.'
			};

			const displayMessage =
				errorMap[error.message] ?? 'An unexpected error occurred. Please try again later.';

			const errorRedirect = new URL('/auth/error', url);
			errorRedirect.searchParams.set('message', displayMessage);

			throw redirect(303, errorRedirect.toString());
		}
	}

	// Fallback if missing token or type
	const errorRedirect = new URL('/auth/error', url);
	errorRedirect.searchParams.set('message', 'Missing or invalid token.');
	throw redirect(303, errorRedirect.toString());
};
