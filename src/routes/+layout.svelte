<script>
	import { invalidate } from '$app/navigation'
	import { redirect } from '@sveltejs/kit';
	import { onMount } from 'svelte'
  
	let { data, children } = $props()
	console.log('this is the data for the page: ', data);

	let { session, supabase } = $derived(data)
  
	onMount(() => {
	  const { data } = supabase.auth.onAuthStateChange((_, newSession) => {

		if (newSession?.expires_at !== session?.expires_at) {
		  invalidate('supabase:auth')
		}
	  })
  
	  return () => data.subscription.unsubscribe()
	})
  </script>
  
  {@render children()}