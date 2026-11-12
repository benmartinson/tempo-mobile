import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

/**
 * Personal version: the app talks to Supabase with the admin (service role)
 * key from .env. No per-user tokens are created or sent. That key has full
 * access to the database, so this build must stay on your own phone.
 */
const extra = Constants.expoConfig?.extra;
const SUPABASE_URL: string = extra?.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ADMIN_KEY: string = extra?.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("EXPO_PUBLIC_SUPABASE_URL is not set in .env");
}
if (!SUPABASE_ADMIN_KEY) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is not set in .env (restart Metro with --clear after adding it)",
  );
}

// Catch the most common setup mistake: a key from a different Supabase
// project than the URL, or the anon key pasted in place of the admin key.
// Supabase rejects those with a confusing JWT error.
function checkAdminKey() {
  const urlRef = SUPABASE_URL.match(/^https?:\/\/([^.]+)\./)?.[1];
  const parts = SUPABASE_ADMIN_KEY.split(".");
  if (parts.length !== 3) {
    console.log(
      `[supabase] project ${urlRef}, admin key type: ${SUPABASE_ADMIN_KEY.slice(0, 10)}...`,
    );
    return;
  }
  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    console.log(
      `[supabase] project ${urlRef}, admin key is for project ${payload.ref} with role ${payload.role}`,
    );
    if (payload.ref && urlRef && payload.ref !== urlRef) {
      console.error(
        `[supabase] WRONG KEY: SUPABASE_SERVICE_ROLE_KEY belongs to project "${payload.ref}" but EXPO_PUBLIC_SUPABASE_URL is project "${urlRef}". Use the key and URL from the same project.`,
      );
    }
    if (payload.role && payload.role !== "service_role") {
      console.error(
        `[supabase] WRONG KEY: SUPABASE_SERVICE_ROLE_KEY has role "${payload.role}", expected "service_role".`,
      );
    }
  } catch {
    console.warn("[supabase] could not read SUPABASE_SERVICE_ROLE_KEY");
  }
}
if (__DEV__) checkAdminKey();

type GlobalCache = typeof globalThis & {
  __tempoSupabase?: SupabaseClient;
};

const g = globalThis as GlobalCache;

if (!g.__tempoSupabase) {
  g.__tempoSupabase = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY, {
    auth: {
      storage: null,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export const supabase: SupabaseClient = g.__tempoSupabase;
