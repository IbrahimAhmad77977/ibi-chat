import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'
export const actions: Actions = {
  signup: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const username = formData.get('username') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const { error } = await supabase.auth.signUp({ email, password })
    
    if (error) {
      console.error(error)
      redirect(303, '/auth/error')
    } else {
      const { error } = await supabase
  .from('accounts')
  .insert({ username: username, email: email})

      redirect(303, '/')
    }
    
  }
}