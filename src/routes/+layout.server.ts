import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies }) => {
  // Removing session handling, focusing on user data retrieval
  const { user } = await safeGetSession(); // Optionally use safeGetSession to get user
  console.log('this is the user: ', user);

  return {
    cookies: cookies.getAll(),
    user, // Return only user
  };
};
