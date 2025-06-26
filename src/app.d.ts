import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from './database.types.ts' // import generated types

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      supabase: SupabaseClient<Database>
      safeGetSession: () => Promise<{ session: Session | null; user: User | null }>
      session: Session | null
      user: {
        username: string;
        email: string;
        // add other fields you use
      };
      }
    interface PageData {
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {}