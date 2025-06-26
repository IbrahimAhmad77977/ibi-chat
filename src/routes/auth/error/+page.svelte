<script lang="ts">
	import { page } from '$app/stores';
	$: message = $page.url.searchParams.get('message') ?? 'Something went wrong';
</script>

<div class="flex min-h-screen items-center justify-center bg-[#ECE5DD] font-sans">
	<div
		class="w-full max-w-lg rounded-lg border border-[#D1D7DB] bg-white p-8 shadow-md md:p-12 lg:max-w-xl"
	>
		<h2 class="mb-6 text-center text-3xl font-semibold text-[#111B21]">Auth Error</h2>

		<p class="mb-4 text-lg text-[#D93025]">{message}</p>

		<div class="mt-8 flex justify-center">
			<a
				href="/auth/login"
				class="rounded-lg bg-[#25D366] px-8 py-3 text-xl font-semibold text-white transition duration-200 hover:bg-[#128C7E] focus:ring-2 focus:ring-[#25D366] focus:outline-none"
			>
				Go back to Login
			</a>
		</div>
	</div>
</div>
