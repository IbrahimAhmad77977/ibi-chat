<script lang="ts">
	export let message: string;
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100">
	<div class="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 shadow-xl md:p-12">
		<h2 class="mb-6 text-center text-4xl font-bold text-red-600">Auth Error</h2>
		<p class="mb-6 text-center text-lg text-pretty text-gray-700">
			{message}
		</p>
		<div class="flex justify-center">
			<a
				href="/auth/login"
				class="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition duration-200 hover:bg-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
			>
				Go back to Login
			</a>
		</div>
	</div>
</div>
