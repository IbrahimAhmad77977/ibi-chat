<script lang="ts">
	// You can pass any dynamic messages if needed, though for now, it's static content
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100">
	<div
		class="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 shadow-xl md:p-12 lg:max-w-xl"
	>
		<h2 class="mb-6 text-center text-4xl font-bold text-red-600">Auth Error</h2>

		<p class="mb-4 text-lg text-gray-600">It may be due to one of the following reasons:</p>

		<ul class="list-inside list-disc space-y-4 text-lg text-gray-700">
			<li>Invalid login credentials. Try logging in again with the correct credentials.</li>
			<li>
				User already exists. Try creating an account with a different username and/or email address.
			</li>
			<li>Server error. Please try again later.</li>
		</ul>

		<div class="mt-8 flex justify-center">
			<a
				href="/auth/login"
				class="rounded-lg bg-green-600 px-8 py-3 text-xl font-semibold text-white transition duration-200 hover:bg-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
			>
				Go back to Login
			</a>
		</div>
	</div>
</div>
