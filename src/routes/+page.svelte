<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { supabaseClient } from '$lib/supabase';

	type User = {
		username: string;
		email: string;
	};

	type Data = {
		user: User;
		accounts: { username: string }[];
	};

	export let data: Data | null = null;

	let username: string = '';
	let newMessage = '';
	let messages: Array<any> = [];

	let showLogoutModal = false;
	let isLoggingOut = false;
	let logoutButton: HTMLButtonElement;

	function changeDM(clickedUsername: string) {
		username = clickedUsername;
		messages = [];
		console.log('Changed DM to:', clickedUsername);
		fetchMessages();
	}

	async function sendMessage() {
		if (!newMessage || !username) return;

		const content = newMessage;
		const formData = new FormData();
		formData.append('message', content);
		formData.append('receiver', username);

		const res = await fetch('?/sendMessage', {
			method: 'POST',
			body: formData
		});

		if (res.ok) {
			newMessage = '';
		} else {
			console.error('Message send failed');
		}
	}

	onMount(() => {
		if (!data || !data.user) return;

		const channel = supabaseClient
			.channel('messages')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'messages' },
				(payload) => {
					const msg = payload.new;
					if (
						(msg.sender === data.user.username && msg.receiver === username) ||
						(msg.sender === username && msg.receiver === data.user.username)
					) {
						if (!messages.some((m) => m.id === msg.id)) {
							messages = [...messages, msg];
						}
					}
				}
			)
			.subscribe();

		onDestroy(() => {
			supabaseClient.removeChannel(channel);
		});
	});

	$: if (username) {
		fetchMessages();
	}

	async function fetchMessages() {
		if (!data || !data.user) return;

		const { data: messageData, error } = await supabaseClient
			.from('messages')
			.select()
			.or(`sender.eq.${data.user.username},receiver.eq.${data.user.username}`)
			.or(`sender.eq.${username},receiver.eq.${username}`)
			.order('created_at', { ascending: true });

		if (error) {
			console.error('Error fetching messages:', error);
		} else {
			messages = messageData ?? [];
		}
	}

	function confirmLogout() {
		showLogoutModal = true;
	}

	function logout() {
		isLoggingOut = true;
		logoutButton?.click(); // triggers form submit to SvelteKit action
	}
</script>

<!-- Hidden form to submit logout to server -->
<form method="POST" class="hidden">
	<input type="hidden" name="logout" value="true" />
	<button type="submit" bind:this={logoutButton}></button>
</form>

<!-- Layout -->
<div class="flex h-screen overflow-hidden bg-gray-50 text-gray-800">
	<!-- Sidebar -->
	<aside
		class="hidden w-1/4 flex-col items-center justify-center border-r border-gray-200 bg-white p-6 shadow-md md:flex"
	>
		<h1 class="mb-6 text-3xl font-extrabold text-green-600">Ibi Chat</h1>
		<div class="flex flex-col items-center space-y-2">
			<img src="default.avif" alt="User PFP" class="h-20 w-20 rounded-full border" />
			<p class="text-sm font-medium text-gray-700">{data.user.username}</p>
		</div>

		<!-- Logout -->
		<button
			class="mt-4 w-full rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600"
			on:click={confirmLogout}
		>
			{#if isLoggingOut}
				<span class="animate-spin">⏳</span> Logging out...
			{:else}
				Log Out
			{/if}
		</button>

		<!-- Logout Modal -->
		{#if showLogoutModal}
			<div class="bg-opacity-50 fixed inset-0 flex items-center justify-center bg-black">
				<div class="rounded-lg bg-white p-6 shadow-lg">
					<h3 class="mb-4 text-xl font-semibold">Are you sure you want to log out?</h3>
					<div class="flex justify-between">
						<button
							class="rounded-lg bg-gray-500 px-4 py-2 text-white"
							on:click={() => (showLogoutModal = false)}
						>
							Cancel
						</button>
						<button class="rounded-lg bg-red-500 px-4 py-2 text-white" on:click={logout}>
							Confirm Logout
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Conversation List -->
		<div class="mt-10 max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto px-4 py-6">
			<h2 class="mb-4 text-center text-xl font-bold text-gray-700">Recent Chats</h2>
			<div class="w-full max-w-md space-y-4">
				{#each data.accounts as account}
					{#if account.username !== data.user.username}
						<button
							class="flex w-full items-center gap-4 rounded-lg bg-white p-4 shadow-sm transition duration-200 ease-in-out hover:bg-gray-100 hover:shadow-lg"
							on:click={() => changeDM(account.username)}
						>
							<img
								src="default.avif"
								alt="PFP"
								class="h-12 w-12 rounded-full border-2 border-gray-300"
							/>
							<p class="text-md font-medium text-gray-800">{account.username}</p>
						</button>
					{/if}
				{/each}
			</div>
		</div>
	</aside>

	<!-- Main Chat Area -->
	<main class="flex flex-1 flex-col bg-white p-6 md:overflow-y-auto">
		<div class="mb-6 flex items-center gap-4">
			<img src="default.avif" alt="Chat PFP" class="h-14 w-14 rounded-full border" />
			<h2 class="text-2xl font-bold text-gray-800">{username || 'Select a chat'}</h2>
		</div>

		{#if username}
			<div class="mb-6 space-y-2">
				<label for="message" class="block text-sm font-semibold text-gray-700">Message</label>
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={newMessage}
						required
						placeholder="Type your message..."
						class="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
					/>
					<button
						on:click={sendMessage}
						class="rounded-md bg-green-500 px-4 py-2 font-semibold text-white transition hover:bg-green-600"
					>
						Send
					</button>
				</div>
			</div>

			<div class="chat-box space-y-4 overflow-y-auto pr-2" style="max-height: calc(100vh - 16rem);">
				{#each messages as message (message.id)}
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
