<script>
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import '../app.css';

	let { data, children } = $props();
	console.log('this is the data for the page: ', data);

	let { supabase, user } = $derived(data);

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
			// No session logic, just track auth state change if needed
			invalidate('supabase:auth');
		});

		return () => data.subscription.unsubscribe();
	});
</script>

{@render children()}
