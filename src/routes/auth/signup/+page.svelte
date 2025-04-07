<script >

  </script>
  
  <div class="min-h-screen flex justify-center items-center bg-gray-100">
	<form method="POST" action="?/login" class="hidden md:flex flex-col justify-center items-center max-w-xl w-full p-10 bg-white shadow-2xl rounded-2xl border border-gray-200">
	  <h2 class="text-3xl font-bold text-gray-800 mb-6">Create your account</h2>
  
	  <label class="w-full mb-5">
		<span class="block text-lg font-semibold text-gray-700 mb-1">Username</span>
		<input name="username" type="text" required minlength="8"
		  class="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200" />
	  </label>
  
	  <label class="w-full mb-5">
		<span class="block text-lg font-semibold text-gray-700 mb-1">Email</span>
		<input name="email" type="email" required
		  class="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200" />
	  </label>
  
	  <label class="w-full mb-6">
		<span class="block text-lg font-semibold text-gray-700 mb-1">Password</span>
		<input name="password" type="password" required minlength="8"
		  class="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200" />
	  </label>
  
	  <button formaction="?/signup"
		class="w-full py-3 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200">
		Sign up
	  </button>
  
	  <p class="mt-6 text-center text-gray-600 text-sm">
		Already have an account?
		<a href="/auth/login" class="text-green-500 hover:underline font-medium">Login here</a>
	  </p>
	</form>
  </div>
  
  