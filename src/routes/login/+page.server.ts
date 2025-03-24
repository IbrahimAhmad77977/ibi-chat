import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { z } from 'zod';
import { zod } from 'sveltekit-superforms/adapters';

const newContactSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8)
});

export const load = async () => {
	const form = await superValidate(zod(newContactSchema));
	return { form };
};

export const actions = {
	default: async ({ request, locals }) => {
		const supabase = locals.supabase
		const form = await superValidate(request, zod(newContactSchema));
		console.log(form);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}
	  
		return { form };
	}
};
