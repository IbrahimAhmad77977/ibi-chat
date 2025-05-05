<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { supabaseClient } from '$lib/supabase';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	dayjs.extend(relativeTime);
	let showForm = false;
	export let form: any;
	function getUserIdByUsername(username: string): string | undefined {
		return data?.accounts.find((acc) => acc.username === username)?.id;
	}
	function getUsernameById(id: string): string {
		if (id === data?.user?.id) return data.user.username;
		return data?.accounts.find((acc) => acc.id === id)?.username ?? 'Unknown';
	}

	const handleClick = () => {
		console.log('Button clicked!'); // Debugging log to confirm click
		showForm = true; // Toggle form visibility
	};

	let isSending = false; // Track if a message is being sent

	type User = {
		username: string;
		email: string;
		id: string; // <-- Add this
	};
	type Account = {
		username: string;
		latestMessage?: string;
		latestTime?: string;
		id: string;
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
						(msg.sender_id === data.user.id && msg.receiver_id === getUserIdByUsername(username)) ||
						(msg.sender_id === getUserIdByUsername(username) && msg.receiver_id === data.user.id)
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

<div class="flex h-screen overflow-hidden bg-[#ECE5DD] text-[#111B21]">
	<!-- Sidebar -->
	<aside class="hidden w-[28%] flex-col border-r border-[#D1D7DB] bg-white md:flex">
		<!-- Top user info -->
		<div class="flex flex-col items-center gap-4 border-b border-[#D1D7DB] p-4">
			<h1 class="text-2xl font-extrabold text-[#25D366]">Ibi Chat</h1>
			<img src="default.avif" alt="User PFP" class="h-16 w-16 rounded-full border" />
			<p class="text-sm font-medium text-[#111B21]">{data?.user?.username}</p>
			<button on:click={handleClick} aria-label="Change Username">
				<img src="settings_button.png" alt="Settings Button" width="50" height="100" />
			</button>
			{#if showForm}
				<!-- Username input form that appears when the button is clicked -->
				<form method="POST" action="?/updateUsername">
					<div class="flex flex-col items-center gap-4">
						<label for="username" class="text-sm font-medium">New Username:</label>
						<input
							type="text"
							id="username"
							name="username"
							required
							class="rounded-full border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-[#25D366] focus:outline-none"
						/>
						<button
							type="submit"
							class="mt-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1DA851] disabled:opacity-50"
						>
							Change Username
						</button>
					</div>
					{#if form?.message}
						<p style="color: {form.success ? 'green' : 'red'};">
							{form.message}
						</p>
					{/if}
				</form>
			{/if}
		</div>

		<!-- Recent Chats -->
		<div class="flex-1 overflow-y-auto p-4">
			<h2 class="mb-2 text-center text-base font-semibold text-[#667781]">Chats</h2>
			<div class="space-y-2">
				{#if data && data.accounts && data.user}
					{#each data.accounts as account}
						{#if account.username !== data.user.username}
							<button
								class="w-full rounded-lg bg-white px-4 py-3 text-left shadow-sm hover:bg-[#F0F2F5]"
								on:click={() => changeDM(account.username)}
							>
								<div class="flex items-center justify-between">
									<p class="font-semibold">{account.username}</p>
									{#if account.latestTime}
										<p class="text-xs text-[#667781]">{dayjs(account.latestTime).fromNow()}</p>
									{/if}
								</div>
								<p class="mt-1 truncate text-sm text-[#667781]">{account.latestMessage}</p>
							</button>
						{/if}
					{/each}
				{/if}
			</div>
		</div>

		<!-- Logout -->
		<div class="border-t border-[#D1D7DB] p-4">
			<button
				class="w-full rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600"
				on:click={confirmLogout}
			>
				{#if isLoggingOut}
					<span class="animate-spin">⏳</span> Logging out...
				{:else}
					Log Out
				{/if}
			</button>
		</div>

		<!-- Logout Modal -->
		{#if showLogoutModal}
			<div
				class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300"
			>
				<div class="space-y-6 rounded-lg bg-white p-6 shadow-2xl">
					<h3 class="text-center text-xl font-semibold text-[#111B21]">
						Are you sure you want to log out?
					</h3>
					<p class="text-center text-sm text-[#667781]">
						You will be logged out of your account and redirected to the login page.
					</p>
					<div class="flex justify-between gap-6">
						<button
							class="w-full rounded-md border border-[#25D366] bg-transparent px-4 py-2 text-sm font-medium text-[#25D366] transition hover:bg-[#DCF8C6] hover:shadow-md focus:ring-2 focus:ring-[#25D366] focus:outline-none"
							on:click={() => (showLogoutModal = false)}
						>
							Cancel
						</button>
						<form method="POST" action="?/logout">
							<button
								class="w-full rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 hover:shadow-md focus:ring-2 focus:ring-red-500 focus:outline-none"
							>
								Confirm Logout
							</button>
						</form>
					</div>
				</div>
			</div>
		{/if}
	</aside>

	<!-- Main Chat Area -->
	<main class="bg-chat-background flex flex-1 flex-col bg-cover p-4">
		<!-- Header -->
		<div class="mb-4 flex items-center gap-3 border-b border-[#D1D7DB] pb-4">
			<img src="default.avif" alt="Chat PFP" class="h-12 w-12 rounded-full border" />
			<h2 class="text-xl font-bold text-[#111B21]">{username || 'Select a chat'}</h2>
		</div>

		<!-- Chat Messages -->
		{#if username}
			<div class="flex-1 space-y-3 overflow-y-auto pr-2 pb-4">
				{#each messages as message (message.id)}
					<div
						class={`max-w-[70%] rounded-xl px-4 py-2 text-sm shadow ${
							message.sender_id === data?.user?.id
								? 'ml-auto bg-[#DCF8C6] text-right'
								: 'bg-white text-left'
						}`}
					>
						<p class="font-semibold">
							{message.sender_id === data?.user?.id ? 'You' : getUsernameById(message.sender_id)}
						</p>
						<p>{message.content}</p>
						<p class="mt-1 text-xs text-[#667781]">{dayjs(message.created_at).fromNow()}</p>
					</div>
				{/each}
			</div>

			<!-- Message Input -->
			<div class="mt-4 flex items-center gap-2 border-t border-[#D1D7DB] pt-4">
				<input
					type="text"
					bind:value={newMessage}
					placeholder="Type a message"
					class="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-[#25D366] focus:outline-none"
				/>
				<button
					on:click={sendMessage}
					class="rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1DA851] disabled:opacity-50"
					disabled={isSending}
				>
					{#if isSending}
						<svg
							class="mx-auto h-5 w-5 animate-spin"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
						>
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke-width="4" />
							<path class="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke-width="4" />
						</svg>
					{:else}
						Send
					{/if}
				</button>
			</div>
		{/if}
	</main>
</div>

<style>
</style>
