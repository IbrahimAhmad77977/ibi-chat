<div class="flex min-h-screen items-center justify-center bg-gray-100">
	<form
		method="POST"
		action="?/login"
		class="flex w-full max-w-xl flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-10 shadow-xl"
	>
		<h2 class="mb-6 text-3xl font-semibold text-gray-800">Log In</h2>

		<label class="mb-6 w-full">
			<span class="mb-1 block text-lg font-medium text-gray-700">Email</span>
			<input
				name="email"
				type="email"
				required
				class="mt-2 w-full rounded-xl border border-gray-300 p-4 text-gray-800 transition duration-300 focus:ring-2 focus:ring-green-500 focus:outline-none"
			/>
		</label>

		<label class="mb-6 w-full">
			<span class="mb-1 block text-lg font-medium text-gray-700">Password</span>
			<input
				name="password"
				type="password"
				required
				class="mt-2 w-full rounded-xl border border-gray-300 p-4 text-gray-800 transition duration-300 focus:ring-2 focus:ring-green-500 focus:outline-none"
			/>
		</label>

		<button
			formaction="?/login"
			class="w-full rounded-xl bg-green-600 py-3 font-semibold text-white transition duration-200 hover:bg-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
		>
			Log In
		</button>

		<p class="mt-6 text-center text-sm text-gray-600">
			Want to create a new account?
			<a href="/auth/signup" class="font-medium text-green-500 hover:underline">Sign up</a>
		</p>
	</form>
</div>
