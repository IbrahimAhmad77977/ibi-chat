import { createServerClient } from '@supabase/ssr'
import { type Handle, redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

// Initialize the Supabase client and store it in locals
const supabase: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' })
        })
      },
    },
  })

  // Function to safely get session and user, ensuring JWT validation
  event.locals.safeGetSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession()
    if (!session) {
      return { session: null, user: null }
    }

    const {
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser()
    if (error) {
      // JWT validation has failed
      return { session: null, user: null }
    }

    return { session, user }
  }

  // Initialize errorMessage if not already initialized
  event.locals.errorMessage = ''

  // Continue with request handling
  const response = await resolve(event)
  return response
}

// Auth guard to redirect based on session/user
const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession()
  event.locals.session = session
  event.locals.user = user

  // If user is not logged in and trying to access the home page, redirect to /auth
  if (!event.locals.user && event.url.pathname === '/') {
    throw redirect(303, '/auth')
  }

  // If user is logged in and trying to access auth-related pages, redirect to home
  if (event.locals.user && (event.url.pathname === '/auth/login' || event.url.pathname === '/auth/error' || event.url.pathname === '/auth/signup')) {
    throw redirect(303, '/')
  }

  return resolve(event)
}

// Combine supabase and authGuard logic using sequence
export const handle: Handle = sequence(supabase, authGuard)
