<script lang="ts">
	let loading = false;
	import { onMount, onDestroy } from 'svelte';
	import { supabaseClient } from '$lib/supabase';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import { enhance } from '$app/forms';
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
	let messageForm = false;
	const SendMessage = () => {
		console.log('Button clicked');
		messageForm = true;
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
	let sentToIds: Set<string> = new Set();

	async function fetchSentToIds() {
		if (!data?.user?.id) return;

		const { data: sentMessages, error } = await supabaseClient
			.from('messages')
			.select('receiver_id')
			.eq('sender_id', data.user.id);

		if (error) {
			console.error('Error fetching sent messages:', error);
			return;
		}

		sentToIds = new Set(sentMessages.map((m) => m.receiver_id));
	}

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
		if (isSending) return;
		if (!newMessage || !username) return;

		isSending = true;
		const tempId = `temp-${Date.now()}`;
		const tempMessage = {
			id: tempId,
			content: newMessage,
			sender_id: data!.user.id,
			receiver_id: getUserIdByUsername(username),
			created_at: new Date().toISOString()
		};

		// Optimistically update UI
		messages = [...messages, tempMessage];
		newMessage = '';

		try {
			const content = tempMessage.content;
			const formData = new FormData();
			formData.append('message', content);
			formData.append('receiver', username);

			const res = await fetch('?/' + new URLSearchParams({ sendMessage: '' }), {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				throw new Error('Failed to send message');
			}

			// Assuming server returns the saved message with a real ID
			const savedMessage = await res.json();

			// Remove temp message and add the saved message
			messages = messages.filter((m) => m.id !== tempId).concat(savedMessage);
		} catch (error) {
			console.error(error);
			// Remove the optimistic message on error
			messages = messages.filter((m) => m.id !== tempId);
			// Optionally, show an error notification to user
		} finally {
			isSending = false;
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
		fetchSentToIds();

		const channel = supabaseClient
			.channel('messages')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'messages' },
				async (payload) => {
					const msg = payload.new;

					const involvesCurrentUser =
						(msg.sender_id === data.user.id && msg.receiver_id === getUserIdByUsername(username)) ||
						(msg.sender_id === getUserIdByUsername(username) && msg.receiver_id === data.user.id);

					if (involvesCurrentUser) {
						const alreadyInMessages = messages.some((m) => m.id === msg.id);
						if (!alreadyInMessages) {
							// Fetch missing username if needed
							const senderId = msg.sender_id;
							const receiverId = msg.receiver_id;

							const allKnownIds = new Set([data.user.id, ...data.accounts.map((acc) => acc.id)]);

							const missingId = !allKnownIds.has(senderId)
								? senderId
								: !allKnownIds.has(receiverId)
									? receiverId
									: null;

							if (missingId) {
								const { data: missingAccount } = await supabaseClient
									.from('accounts')
									.select('id, username')
									.eq('id', missingId)
									.single();

								if (missingAccount) {
									data.accounts = [...data.accounts, missingAccount];
								}
							}

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
			<img src="default.avif" alt="User PFP" class="h-16 w-16 rounded-full" />
			<p class="text-sm font-medium text-[#111B21]">{data?.user?.username}</p>
			<button on:click={handleClick} aria-label="Change Username" class="cursor-pointer">
				<img
					src="settings_button.png"
					alt="Settings Button"
					width="50"
					height="100"
					class="rounded-full p-2 transition hover:bg-black"
				/>
			</button>
			{#if showForm}
				<!-- Username input form that appears when the button is clicked -->
				<form
					method="POST"
					action="?/updateUsername"
					use:enhance={() => {
						loading = true;

						return async ({ update }) => {
							await update();
							loading = false;
						};
					}}
				>
					<div class="flex flex-col items-center gap-4">
						<label for="username" class="text-sm font-medium">New Username:</label>
						<input
							type="text"
							id="username"
							name="username"
							required
							class="rounded-full border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-[#25D366] focus:outline-none"
						/>
						<div class="flex gap-2">
							<button
								type="submit"
								class="cursor-pointer rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1DA851] disabled:opacity-50"
							>
								{#if loading}
									Changing Username...
								{:else}
									Change Username
								{/if}
							</button>
							<!-- New Cancel button -->
							<button
								type="button"
								on:click={() => (showForm = false)}
								class="cursor-pointer rounded-full bg-gray-300 px-4 py-2 text-sm font-semibold text-[#111B21] hover:bg-gray-400"
							>
								Cancel
							</button>
						</div>

						{#if form?.message}
							<p style="color: {form.success ? 'green' : 'red'};">
								{form.message}
							</p>
						{/if}
					</div>
				</form>
			{/if}
			<button
				on:click={SendMessage}
				aria-label="Send Message"
				class="flex cursor-pointer items-center gap-2 rounded bg-blue-600 px-4 py-2 font-semibold text-white shadow-md transition duration-150 hover:bg-blue-700"
			>
				Send
			</button>
			{#if messageForm}
				<div class="mt-4 w-full space-y-2">
					<h3 class="text-sm font-semibold text-[#111B21]">Select a user to message:</h3>
					{#if data && data.accounts && data.user}
						{#each data.accounts as account (account.id)}
							{#if account.id !== data.user.id && !sentToIds.has(account.id)}
								<button
									class="w-full rounded bg-gray-100 px-4 py-2 text-left text-sm hover:bg-gray-200"
									on:click={() => {
										changeDM(account.username);
										messageForm = false;
									}}
								>
									{account.username}
								</button>
							{/if}
						{/each}
					{/if}

					<button
						type="button"
						on:click={() => (messageForm = false)}
						class="mt-2 w-full rounded bg-gray-300 px-4 py-2 text-sm font-semibold text-[#111B21] hover:bg-gray-400"
					>
						Cancel
					</button>
				</div>
			{/if}
		</div>

		<!-- Recent Chats -->
		<div class="flex-1 overflow-y-auto p-4">
			<h2 class="mb-2 text-center text-base font-semibold text-[#667781]">Chats</h2>
			<div class="space-y-2">
				{#if data && data.accounts && data.user}
					{#each data.accounts as account (account.id)}
						{#if account.id !== data.user.id && sentToIds.has(account.id)}
							<button
								class="w-full cursor-pointer rounded-lg bg-white px-4 py-3 text-left shadow-sm hover:bg-[#F0F2F5]"
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
				class="w-full cursor-pointer rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600"
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
							class=" cursor-pointer rounded-md border border-[#25D366] bg-transparent px-4 py-2 text-sm font-medium text-[#25D366] transition hover:bg-[#DCF8C6] hover:shadow-md focus:ring-2 focus:ring-[#25D366] focus:outline-none"
							on:click={() => (showLogoutModal = false)}
						>
							Cancel
						</button>
						<form
							method="POST"
							action="?/logout"
							use:enhance={() => {
								loading = true;

								return async ({ update }) => {
									await update();
									loading = false;
								};
							}}
						>
							<button
								class=" cursor-pointer rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 hover:shadow-md focus:ring-2 focus:ring-red-500 focus:outline-none"
							>
								{#if loading}
									Logging out...
								{:else}
									Confirm Logout
								{/if}
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
		<div class=" flex items-center gap-3 border-b border-[#D1D7DB] bg-white px-4 py-4">
			<img src="default.avif" alt="Chat PFP" class="h-12 w-12 rounded-full" />
			<h2 class="text-xl font-bold text-[#111B21]">{username || 'Select a chat'}</h2>
		</div>

		<!-- Chat Messages -->
		{#if username}
			<div class="flex-1 space-y-3 overflow-y-auto pr-2 pb-4">
				{#if isFetchingMessages}
					<p class="text-center text-gray-500">Loading messages...</p>
				{:else}
					{#each messages as message (message.id)}
						{#if message.sender_id === data?.user?.id || getUserIdByUsername(message.sender_id)}
							<div
								class={`max-w-[70%] rounded-xl px-4 py-2 text-sm shadow ${
									message.sender_id === data?.user?.id
										? 'ml-auto bg-[#DCF8C6] text-right'
										: 'bg-white text-left'
								}`}
							>
								<p class="font-semibold">
									{message.sender_id === data?.user?.id
										? 'You'
										: getUsernameById(message.sender_id)}
								</p>
								<p>{message.content}</p>
								<p class="mt-1 text-xs text-[#667781]">{dayjs(message.created_at).fromNow()}</p>
							</div>
						{/if}
					{/each}
				{/if}
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
					class="cursor-pointer rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1DA851] disabled:opacity-50"
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
