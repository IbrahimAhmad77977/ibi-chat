<script lang="ts">
  import { redirect } from '@sveltejs/kit';

  let { data } = $props()
  let username = $state();
function changeDM()
{
  let username = 'account'
}

  console.log('this is my user data: ', data);
</script>

<div class="h-screen flex">
  <!-- Profile Section -->
  <aside class="w-1/4 bg-white shadow-md p-6 flex flex-col items-center justify-start space-y-4">
    <h1 class="text-2xl font-bold text-gray-800">Ibi Chat</h1>
    <img src="default.avif" alt="account default pfp" class="w-16 h-16 rounded-full border border-gray-300">
    <p class="text-lg font-semibold text-gray-700">{data.user.email}</p>
    <form method="POST" action="?/logout">
      <button formaction="?/logout" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">Log Out</button>
    </form>
    {#each data.accounts as account}

    <div class="flex flex-row items-center gap-x-[20px] mt-10">

      <img src="default.avif" alt="account default pfp" class="w-16 h-16 rounded-full border border-gray-300">
<button onclick={changeDM}>
          <p> {account.username}</p>
        </button>
    </div>
    {/each}

  </aside>
  
  <!-- Chat Section -->
  <main class="flex-1 bg-white shadow-md p-6">
    <div class="flex flex-row items-center gap-x-[20px] mt-10">

    <img src="default.avif" alt="account default pfp" class="w-16 h-16 rounded-full border border-gray-300">

    <p>Username: {username}</p>
</div>
<form method="POST" action="?/sendMessage">
<label for="message">Message
<input type="text" name="message" required class="bg-green-500">
<button formaction="?/sendMessage" class="bg-green-500">Send</button>
</label>
</form>
{#each data.messages as message}
<p> {message.content}</p>

{/each}
    <!-- Chat content will go here -->
  </main>
</div>
