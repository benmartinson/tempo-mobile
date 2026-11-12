import { supabase } from "../lib/supabase";

/**
 * Returns the shared Supabase client. In the personal version it always
 * uses the admin key, so it is ready immediately (see lib/supabase.ts).
 */
export function useSupabaseWithClerk() {
  return supabase;
}
