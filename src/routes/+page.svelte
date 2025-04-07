<script lang="ts">
  import { redirect } from '@sveltejs/kit';

  export let data;


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
<p>DM 1</p>
  </aside>
  
  <!-- Chat Section -->
  <main class="flex-1 bg-white shadow-md p-6">
    <!-- Chat content will go here -->
  </main>
</div>
