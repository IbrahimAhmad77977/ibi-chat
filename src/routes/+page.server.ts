import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'
import { supabaseClient } from "$lib/supabase";
  export async function load() {
    let  { data } = await supabaseClient.from("accounts").select()
    return {
      accounts: data ?? [],
    };
  }

export const actions: Actions = {
  logout: async ({ locals: { supabase } }) => {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error(error)
      redirect(303, '/auth/error')
    } else {
        
      redirect(303, '/auth/login')
    }
    
  },

  sendMessage: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const message = formData.get('message') as string

    const { error } = await supabase
    .from('messages')
    .insert({ content: message })
    
  }
}