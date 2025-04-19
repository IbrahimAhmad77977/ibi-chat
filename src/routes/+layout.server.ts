import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies }) => {
  const { session } = await safeGetSession()
 console.log('this is the session: ', session);

  return {
    session,
    cookies: cookies.getAll(),
  }
}