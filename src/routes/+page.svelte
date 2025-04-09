<script lang="ts">
	import { redirect } from '@sveltejs/kit';

	let { data } = $props();
	let username = $state();

	function changeDM(clickedUsername: string) {
		username = clickedUsername;
		console.log('Changed DM to:', clickedUsername);
	}

	console.log('this is my user data: ', data);
</script>

<div class="flex h-screen overflow-hidden bg-gray-50 text-gray-800">
	<!-- Sidebar -->
	<aside class="hidden w-1/4 flex-col border-r border-gray-200 bg-white p-6 shadow-md md:flex">
		<h1 class="mb-6 text-3xl font-extrabold text-green-600">Ibi Chat</h1>
		<div class="flex flex-col items-center space-y-2">
			<img src="default.avif" alt="User PFP" class="h-20 w-20 rounded-full border" />
			<p class="text-lg font-semibold">{data.user.email}</p>
		</div>
		<form method="POST" action="?/logout" class="mt-4 w-full">
			<button
				formaction="?/logout"
				class="w-full rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600"
			>
				Log Out
			</button>
		</form>

		<div class="mt-10 space-y-4 overflow-y-auto">
			<h2 class="text-xl font-bold text-gray-700">Conversations</h2>
			{#each data.accounts as account}
				<button
					class="flex w-full items-center gap-4 rounded-lg p-3 transition hover:bg-gray-100"
					onclick={() => changeDM(account.username)}
				>
					<img src="default.avif" alt="PFP" class="h-12 w-12 rounded-full border" />
					<p class="text-md font-medium">{account.username}</p>
				</button>
			{/each}
		</div>
	</aside>

	<!-- Main Chat Area -->
	<main class="flex flex-1 flex-col bg-white p-6 md:overflow-y-auto">
		<!-- Chat Header -->
		<div class="mb-6 flex items-center gap-4">
			<img src="default.avif" alt="Chat PFP" class="h-14 w-14 rounded-full border" />
			<h2 class="text-2xl font-bold text-gray-800">{username || 'Select a chat'}</h2>
		</div>

		<!-- Message Form -->
		{#if username}
			<form method="POST" action="?/sendMessage" class="mb-6 space-y-2">
				<input type="hidden" name="receiver" value={username} />
				<label for="message" class="block text-sm font-semibold text-gray-700">Message</label>
				<div class="flex gap-2">
					<input
						type="text"
						name="message"
						required
						placeholder="Type your message..."
						class="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
					/>
					<button
						formaction="?/sendMessage"
						class="rounded-md bg-green-500 px-4 py-2 font-semibold text-white transition hover:bg-green-600"
					>
						Send
					</button>
				</div>
			</form>

			<!-- Messages Display -->
			<div class="space-y-4 overflow-y-auto pr-2">
				{#each data.messages.filter((m) => (m.sender === data.user.username && m.receiver === username) || (m.sender === username && m.receiver === data.user.username)) as message}
					<div
						class={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${
							message.sender === data.user.username
								? 'ml-auto bg-green-100 text-right'
								: 'bg-gray-100 text-left'
						}`}
					>
						<p class="font-semibold">
							{message.sender === data.user.username ? 'You' : message.sender}
						</p>
						<p>{message.content}</p>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>
