<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { supabaseClient } from '$lib/supabase';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import { redirect } from '@sveltejs/kit';
	dayjs.extend(relativeTime);
	let conversationMessages = [];
	let loading = true;

	async function loadMessages(conversationId: string) {
		loading = true; // Show loading state
		try {
			const res = await fetch(`/api/messages?conversationId=${conversationId}`);
			if (res.ok) {
				const newMessages = await res.json();
				conversationMessages = newMessages;
			} else {
				console.error('Failed to load messages');
			}
		} catch (error) {
			console.error('Error fetching messages:', error);
		} finally {
			loading = false;
		}
	}

	let isSending = false; // Track if a message is being sent

	type User = {
		username: string;
		email: string;
	};
	type Account = {
		username: string;
		latestMessage?: string;
		latestTime?: string;
	};

	type Data = {
		user: User;
		accounts: Account[];
	};

	export let data: Data | null = null;

	let username: string = '';
	let newMessage = '';
	let messages: Array<any> = [];

	let showLogoutModal = false;
	let isLoggingOut = false;
	let logoutButton: HTMLButtonElement;

	// Initialize as empty until a conversation is clicked
	let isFetchingMessages = false;

	// Change the direct message to the clicked user's username
	function changeDM(clickedUsername: string) {
		if (clickedUsername !== username) {
			username = clickedUsername;
			isFetchingMessages = true; // Start loading
			messages = []; // Clear the current messages to avoid duplication
			fetchMessages(clickedUsername); // Fetch new messages
		}
	}

	// Send a message to the selected user
	async function sendMessage() {
		if (isSending) return; // Prevent multiple clicks

		if (!newMessage || !username) return; // Ensure there is a message and username

		isSending = true; // Set sending state to true

		try {
			const content = newMessage;
			const formData = new FormData();
			formData.append('message', content);
			formData.append('receiver', username);

			const res = await fetch('?/' + new URLSearchParams({ sendMessage: '' }), {
				method: 'POST',
				body: formData
			});

			if (res.ok) {
				// Handle success (clear the input message and optionally update the UI)
				newMessage = ''; // Clear input message after successful send
				// Optionally update the UI with the new message here
			} else {
				console.error('Message send failed');
				// Optionally show an error message to the user
			}
		} catch (error) {
			console.error('Error sending message:', error);
			// Optionally show an error message to the user
		} finally {
			isSending = false; // Reset sending state after the message is sent
		}
	}

	// Fetch messages for the selected user
	async function fetchMessages(otherUsername: string) {
		try {
			const res = await fetch(`/api/messages?other=${otherUsername}`);
			const data = await res.json();

			if (res.ok) {
				messages = data.messages; // Update messages with new data
			} else {
				console.error(data.error); // Handle fetch errors
			}
		} catch (error) {
			console.error('Error fetching messages:', error);
		} finally {
			isFetchingMessages = false; // Stop loading once done
		}
	}

	// Handle the login/logout flow
	async function logout() {
		isLoggingOut = true;
		try {
			// Log out from Supabase
			const { error } = await supabaseClient.auth.signOut();

			if (error) {
				console.error('Error during logout:', error);
				return;
			}

			// Redirect to login page after successful logout
			showLogoutModal = false;
			isLoggingOut = false;
			throw redirect(303, '/auth/login');
		} catch (error) {
			console.error('Logout failed:', error);
			isLoggingOut = false;
		}
	}

	// Confirm logout action
	function confirmLogout() {
		showLogoutModal = true;
	}

	// Observe changes for new messages and update messages in real-time
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
</script>

<!-- Layout -->
<div class="flex h-screen overflow-hidden bg-gray-50 text-gray-800">
	<!-- Sidebar -->
	<aside
		class="hidden w-1/2 flex-col items-center justify-center border-r border-gray-200 bg-white p-6 shadow-md md:flex"
	>
		<h1 class="mb-6 text-3xl font-extrabold text-green-600">Ibi Chat</h1>
		<div class="flex flex-col items-center space-y-2">
			<img src="default.avif" alt="User PFP" class="h-20 w-20 rounded-full border" />
			<p class="text-sm font-medium text-gray-700">{data?.user?.username}</p>
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
						<form method="POST" action="?/logout">
							<button type="submit" class="rounded-lg bg-red-500 px-4 py-2 text-white">
								Confirm Logout
							</button>
						</form>
					</div>
				</div>
			</div>
		{/if}

		<!-- Conversation List -->
		<div class="mt-10 max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto px-4 py-6">
			<h2 class="mb-4 text-center text-xl font-bold text-gray-700">Recent Chats</h2>
			<div class="w-full max-w-md space-y-4">
				{#if data && data.accounts && data.user}
					{#each data.accounts as account}
						{#if account.username !== data.user.username}
							<button
								class="flex w-full flex-col items-start gap-2 rounded-lg bg-white p-4 shadow-sm transition hover:bg-gray-100 hover:shadow-lg"
								on:click={() => changeDM(account.username)}
							>
								<div class="flex w-full items-center justify-between">
									<p class="font-medium text-gray-800">{account.username}</p>
									{#if account.latestTime}
										<p class="text-xs text-gray-400">{dayjs(account.latestTime).fromNow()}</p>
									{/if}
								</div>
								<p class="truncate text-sm text-gray-600">{account.latestMessage}</p>
							</button>
						{/if}
					{/each}
				{/if}
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
						disabled={isSending}
					>
						{#if isSending}
							<!-- Show loading spinner when sending -->
							<svg
								class="h-6 w-6 animate-spin"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
							>
								<circle
									cx="12"
									cy="12"
									r="10"
									stroke-width="4"
									stroke="currentColor"
									opacity=".25"
								/>
								<path d="M4 12a8 8 0 1 1 16 0A8 8 0 0 1 4 12Z" fill="currentColor" />
							</svg>
						{:else}
							Send
						{/if}

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
						<p class="mt-1 text-xs text-gray-500">{dayjs(message.created_at).fromNow()}</p>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

<style>
</style>
