<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { supabaseClient } from '$lib/supabase';

	// Define the types for 'data'
	type User = {
		username: string;
		email: string;
	};

	type Data = {
		user: User;
		accounts: { username: string }[];
	};

	// Declare 'data' with the type 'Data | null'
	export let data: Data | null = null;

	let username: string = ''; // Receiver's username
	let newMessage = ''; // New message content
	let messages: Array<any> = []; // Store chat messages

	// Change to the selected DM conversation
	function changeDM(clickedUsername: string) {
		username = clickedUsername;
		messages = []; // Clear messages when switching DMs
		console.log('Changed DM to:', clickedUsername);
		fetchMessages(); // Fetch messages for the new selected user
	}

	// Function to send a message
	async function sendMessage() {
		if (!newMessage || !username) return;

		const content = newMessage;

		// Send the message to the server (Supabase)
		const formData = new FormData();
		formData.append('message', content);
		formData.append('receiver', username);

		const res = await fetch('?/sendMessage', {
			method: 'POST',
			body: formData
		});

		if (res.ok) {
			// Clear the message input after sending
			newMessage = '';
		} else {
			console.error('Message send failed');
		}
	}

	// Set up the real-time subscription on mount
	onMount(() => {
		if (!data || !data.user) return;

		// Subscribe to real-time updates for messages
		const channel = supabaseClient
			.channel('messages')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'messages' },
				(payload) => {
					console.log('New post received:', payload.new);

					// Add the new message to the chat if it's relevant to the current conversation
					const msg = payload.new;
					if (
						(msg.sender === data.user.username && msg.receiver === username) ||
						(msg.sender === username && msg.receiver === data.user.username)
					) {
						// Ensure the message doesn't already exist in the current conversation
						if (!messages.some((m) => m.id === msg.id)) {
							// Add the new message to the bottom of the list
							messages = [...messages, msg];
						}
					}
				}
			)
			.subscribe();

		// Cleanup on unmount
		onDestroy(() => {
			supabaseClient.removeChannel(channel);
		});
	});

	// Fetch messages when the username changes
	$: if (username) {
		// Fetch the messages for the selected conversation
		fetchMessages();
	}

	// Function to fetch messages for the current conversation
	async function fetchMessages() {
		if (!data || !data.user) return; // Guard clause to ensure 'data' is valid

		const { data: messageData, error } = await supabaseClient
			.from('messages')
			.select()
			.or(`sender.eq.${data.user.username},receiver.eq.${data.user.username}`)
			.or(`sender.eq.${username},receiver.eq.${username}`)
			.order('created_at', { ascending: true }); // Ensure messages are ordered by time

		if (error) {
			console.error('Error fetching messages:', error);
		} else {
			messages = messageData ?? []; // Assign fetched messages
		}
	}
</script>

<!-- Chat Layout -->
<div class="flex h-screen overflow-hidden bg-gray-50 text-gray-800">
	<!-- Sidebar -->
	<aside
		class="hidden w-1/4 flex-col items-center justify-center border-r border-gray-200 bg-white p-6 shadow-md md:flex"
	>
		<h1 class="mb-6 text-3xl font-extrabold text-green-600">Ibi Chat</h1>
		<div class="flex flex-col items-center space-y-2">
			<img src="default.avif" alt="User PFP" class="h-20 w-20 rounded-full border" />
			<p class="text-lg font-semibold">{data?.user?.email}</p>
		</div>
		<form method="POST" action="?/logout" class="mt-4 w-full">
			<button
				formaction="?/logout"
				class="w-full rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600"
			>
				Log Out
			</button>
		</form>

		<div class="mt-10 max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto px-4 py-6">
			<h2 class="mb-4 text-center text-xl font-bold text-gray-700">Conversations</h2>
			<div class="flex w-full justify-center space-y-2">
				<div class="w-full max-w-md space-y-4">
					{#if data}
						{#each data.accounts as account}
							{#if account.username !== data?.user?.username}
								<button
									class="flex w-full items-center gap-4 rounded-lg bg-white p-4 shadow-sm transition duration-200 ease-in-out hover:bg-gray-100 hover:shadow-lg"
									onclick={() => changeDM(account.username)}
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
					{/if}
				</div>
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
						onclick={sendMessage}
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
							message.sender === data?.user?.username
								? 'ml-auto bg-green-100 text-right'
								: 'bg-gray-100 text-left'
						}`}
					>
						<p class="font-semibold">
							{message.sender === data?.user?.username ? 'You' : message.sender}
						</p>
						<p>{message.content}</p>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>
