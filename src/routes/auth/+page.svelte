<script lang="ts">
	// You can pass any dynamic messages if needed, though for now, it's static content
</script>

<div class="flex min-h-screen items-center justify-center bg-[#ECE5DD] font-sans">
	<div
		class="w-full max-w-lg rounded-xl border border-[#D1D7DB] bg-white p-8 shadow-lg md:p-12 lg:max-w-xl"
	>
		<h2 class="mb-6 text-center text-3xl font-semibold text-[#075E54]">Create your account</h2>

		<p class="mb-6 text-center text-lg text-[#075E54]">
			Welcome to our platform! Please select one of the following options:
		</p>

		<div class="mt-6 flex justify-center gap-4">
			<a
				href="/auth/login"
				class="inline-block rounded-xl bg-[#25D366] px-8 py-3 text-lg font-semibold text-white transition duration-200 hover:bg-[#128C7E] focus:ring-2 focus:ring-[#25D366] focus:outline-none"
			>
				Login
			</a>
			<a
				href="/auth/signup"
				class="inline-block rounded-xl bg-[#25D366] px-8 py-3 text-lg font-semibold text-white transition duration-200 hover:bg-[#128C7E] focus:ring-2 focus:ring-[#25D366] focus:outline-none"
			>
				Sign Up
			</a>
		</div>
	</div>
</div>
