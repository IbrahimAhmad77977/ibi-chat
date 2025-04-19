<script>
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100">
	<form
		method="POST"
		action="?/login"
		class="hidden w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 shadow-2xl md:flex"
	>
		<h2 class="mb-6 text-3xl font-bold text-gray-800">Create your account</h2>

		<label class="mb-5 w-full">
			<span class="mb-1 block text-lg font-semibold text-gray-700">Username</span>
			<input
				name="username"
				type="text"
				required
				minlength="8"
				class="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 transition duration-200 focus:ring-2 focus:ring-green-500 focus:outline-none"
			/>
		</label>

		<label class="mb-5 w-full">
			<span class="mb-1 block text-lg font-semibold text-gray-700">Email</span>
			<input
				name="email"
				type="email"
				required
				class="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 transition duration-200 focus:ring-2 focus:ring-green-500 focus:outline-none"
			/>
		</label>

		<label class="mb-6 w-full">
			<span class="mb-1 block text-lg font-semibold text-gray-700">Password</span>
			<input
				name="password"
				type="password"
				required
				minlength="8"
				class="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 transition duration-200 focus:ring-2 focus:ring-green-500 focus:outline-none"
			/>
		</label>

		<button
			formaction="?/signup"
			class="w-full rounded-xl bg-green-600 py-3 text-lg font-semibold text-white transition duration-200 hover:bg-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
		>
			Sign up
		</button>

		<p class="mt-6 text-center text-sm text-gray-600">
			Already have an account?
			<a href="/auth/login" class="font-medium text-green-500 hover:underline">Login here</a>
		</p>
	</form>
</div>
