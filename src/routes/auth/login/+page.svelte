<div class="flex min-h-screen items-center justify-center bg-[#ECE5DD] font-sans">
	<form
		method="POST"
		action="?/login"
		class="flex w-full max-w-md flex-col items-center justify-center rounded-lg border border-[#D1D7DB] bg-white p-8 shadow-md"
	>
		<h2 class="mb-4 text-2xl font-semibold text-[#111B21]">Welcome back</h2>

		<p class="mb-6 text-center text-sm text-[#667781]">Login to continue messaging</p>

		<label class="mb-5 w-full">
			<span class="mb-1 block text-sm font-medium text-[#111B21]">Email</span>
			<input
				name="email"
				type="email"
				required
				class="mt-1 w-full rounded-lg border border-[#D1D7DB] bg-white p-3 text-sm text-[#111B21] shadow-sm transition duration-300 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] focus:outline-none"
			/>
		</label>

		<label class="mb-5 w-full">
			<span class="mb-1 block text-sm font-medium text-[#111B21]">Password</span>
			<input
				name="password"
				type="password"
				required
				class="mt-1 w-full rounded-lg border border-[#D1D7DB] bg-white p-3 text-sm text-[#111B21] shadow-sm transition duration-300 focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] focus:outline-none"
			/>
		</label>

		<button
			formaction="?/login"
			class="mt-2 w-full rounded-lg bg-[#25D366] py-2.5 text-sm font-medium text-white transition duration-200 hover:bg-[#128C7E] focus:ring-2 focus:ring-[#25D366] focus:outline-none"
		>
			Log In
		</button>

		<p class="mt-6 text-center text-sm text-[#667781]">
			New here?
			<a href="/auth/signup" class="font-medium text-[#25D366] hover:underline">Create an account</a
			>
		</p>
	</form>
</div>
