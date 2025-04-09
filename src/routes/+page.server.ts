import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

import { supabaseClient } from "$lib/supabase";
export async function load({ locals }) {
	const { data: userData } = await locals.supabase.auth.getUser();
	const userEmail = userData?.user?.email;

	// get the user's username from "accounts"
	const { data: accountData } = await supabaseClient
		.from("accounts")
		.select("username")
		.eq("email", userEmail)
		.single();

	const username = accountData?.username;

	const { data: accountsdata } = await supabaseClient.from("accounts").select();
	const { data: messagesdata } = await supabaseClient
		.from("messages")
		.select()
		.or(`sender.eq.${username},receiver.eq.${username}`);

	return {
		user: { email: userEmail, username },
		accounts: accountsdata ?? [],
		messages: messagesdata ?? [],
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
    const formData = await request.formData();
    const message = formData.get('message') as string;
    const receiver = formData.get('receiver') as string;
  
    const { data: userData } = await supabase.auth.getUser();
    const userEmail = userData?.user?.email;
  
    // get the sender's username from "accounts"
    const { data: accountData } = await supabaseClient
      .from("accounts")
      .select("username")
      .eq("email", userEmail)
      .single();
  
    const sender = accountData?.username;
  
    const { error } = await supabase
      .from('messages')
      .insert({ content: message, sender, receiver });
  
    if (error) console.error('Send message error:', error);
  }
  }