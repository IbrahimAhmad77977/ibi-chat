declare module "$env/static/public" {
    export const PUBLIC_SUPABASE_URL: string;
    export const PUBLIC_SUPABASE_ANON_KEY: string;
}
type User = {
    username: string;
    email: string;
  };
  
  declare namespace App {
    interface Locals {
      errorMessage: string; // Define the errorMessage property on locals
    }
  }
  