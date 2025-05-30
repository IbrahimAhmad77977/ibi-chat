<script>
	import { enhance } from '$app/forms';
	let loading = false;
</script>

<div class="flex min-h-screen items-center justify-center bg-[#ECE5DD] font-sans">
	<form
		method="POST"
		action="?/login"
		use:enhance={() => {
			loading = true;

			return async ({ update }) => {
				await update();
				loading = false;
			};
		}}
		class="hidden w-full max-w-md flex-col items-center justify-center rounded-lg border border-[#D1D7DB] bg-white p-8 shadow-md md:flex"
	>
		<h2 class="mb-4 text-2xl font-semibold text-[#111B21]">Create your account</h2>

		<p class="mb-6 text-center text-sm text-[#667781]">Sign up to get started</p>

		<label class="mb-5 w-full">
			<span class="mb-1 block text-sm font-medium text-[#111B21]">Username</span>
			<input
				name="username"
				type="text"
				required
				minlength="8"
				class="mt-1 w-full rounded-lg border border-[#D1D7DB] bg-white p-3 text-sm text-[#111B21] shadow-sm transition duration-300 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] focus:outline-none"
			/>
		</label>

		<label class="mb-5 w-full">
			<span class="mb-1 block text-sm font-medium text-[#111B21]">Email</span>
			<input
				name="email"
				type="email"
				required
				class="mt-1 w-full rounded-lg border border-[#D1D7DB] bg-white p-3 text-sm text-[#111B21] shadow-sm transition duration-300 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] focus:outline-none"
			/>
		</label>

		<label class="mb-6 w-full">
			<span class="mb-1 block text-sm font-medium text-[#111B21]">Password</span>
			<input
				name="password"
				type="password"
				required
				minlength="8"
				class="mt-1 w-full rounded-lg border border-[#D1D7DB] bg-white p-3 text-sm text-[#111B21] shadow-sm transition duration-300 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] focus:outline-none"
			/>
		</label>

		<button
			formaction="?/signup"
			class="w-full cursor-pointer rounded-lg bg-[#25D366] py-2.5 text-sm font-medium text-white transition duration-200 hover:bg-[#128C7E] focus:ring-2 focus:ring-[#25D366] focus:outline-none"
		>
			{#if loading}
				Signing in...
			{:else}
				Sign In
			{/if}
		</button>

		<p class="mt-6 text-center text-sm text-[#667781]">
			Already have an account?
			<a href="/auth/login" class="font-medium text-[#25D366] hover:underline">Login here</a>
		</p>
	</form>
</div>
