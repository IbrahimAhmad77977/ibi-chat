<div class="min-h-screen flex justify-center items-center bg-gray-100">
	<form method="POST" action="?/login" class="flex flex-col justify-center items-center max-w-xl w-full p-10 bg-white shadow-xl rounded-lg border border-gray-200">
	  
	  <h2 class="text-3xl font-semibold text-gray-800 mb-6">Log In</h2>
  
	  <label class="w-full mb-6">
		<span class="block text-lg font-medium text-gray-700 mb-1">Email</span>
		<input name="email" type="email" required 
		  class="mt-2 p-4 w-full border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-300" />
	  </label>
	  
	  <label class="w-full mb-6">
		<span class="block text-lg font-medium text-gray-700 mb-1">Password</span>
		<input name="password" type="password" required 
		  class="mt-2 p-4 w-full border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-300" />
	  </label>
  
	  <button formaction="?/login" 
		class="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200">
		Log In
	  </button>
  
	  <p class="mt-6 text-center text-gray-600 text-sm">
		Want to create a new account? 
		<a href="/auth/signup" class="text-green-500 hover:underline font-medium">Sign up</a>
	  </p>
	</form>
  </div>
  