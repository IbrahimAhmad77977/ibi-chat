import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr'
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
  /**
   * Declare a dependency so the layout can be invalidated, for example, on
   * session refresh.
   */
  depends('supabase:auth')

  const supabase = isBrowser()
    ? createBrowserClient(supabaseUrl, supabaseAnonKey, {
        global: {
          fetch,
        },
      })
    : createServerClient(supabaseUrl, supabaseAnonKey, {
        global: {
          fetch,
        },
        cookies: {
       
          getAll() {
            return data.cookies
          },
        },
      })

  /**
   * It's fine to use `getSession` here, because on the client, `getSession` is
   * safe, and on the server, it reads `session` from the `LayoutData`, which
   * safely checked the session using `safeGetSession`.
   */
  const {
    data: { session },
  } = await supabase.auth.getSession()
  console.log('this is the data(session): ', data);

  const {
    data: { user },
  } = await supabase.auth.getUser()

    
  console.log('this is the data(user): ', data);

  return { session, supabase, user }
}