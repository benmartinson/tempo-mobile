import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const SUPABASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Personal mode (LOCAL_USER_ID set): there is no Clerk token, so use the
// service role key, which bypasses row-level security. Only for a personal
// build on your own phone. See lib/auth.tsx.
const LOCAL_SERVICE_ROLE_KEY: string | undefined = Constants.expoConfig?.extra
  ?.LOCAL_USER_ID
  ? Constants.expoConfig?.extra?.LOCAL_SUPABASE_SERVICE_ROLE_KEY
  : undefined;

if (Constants.expoConfig?.extra?.LOCAL_USER_ID && !LOCAL_SERVICE_ROLE_KEY) {
  console.warn(
    "[auth] LOCAL_USER_ID is set but SUPABASE_SERVICE_ROLE_KEY is missing; user data will not load",
  );
}

export type ClerkGetToken = (opts?: {
  template?: string;
}) => Promise<string | null>;

type GlobalCache = typeof globalThis & {
  __tempoSupabase?: SupabaseClient;
  __tempoClerkSupabaseGetToken?: ClerkGetToken;
};

const g = globalThis as GlobalCache;

function createFetchWithClerkToken(): typeof fetch {
  return async (input, init) => {
    const getToken = g.__tempoClerkSupabaseGetToken;
    const token = getToken ? await getToken({ template: "supabase" }) : null;

    const baseHeaders =
      init?.headers ??
      (typeof Request !== "undefined" && input instanceof Request
        ? input.headers
        : undefined);

    const headers = new Headers(baseHeaders);
    if (token) headers.set("Authorization", `Bearer ${token}`);

    return fetch(input as any, { ...(init ?? {}), headers });
  };
}

if (!g.__tempoSupabase) {
  g.__tempoSupabase = createClient(
    SUPABASE_URL,
    LOCAL_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY,
    {
    global: {
      fetch: createFetchWithClerkToken(),
    },
    // We don't use Supabase Auth sessions (Clerk owns auth).
    auth: {
      storage: null,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    },
  );
}

export const supabase: SupabaseClient = g.__tempoSupabase;

export function setClerkSupabaseTokenGetter(getToken?: ClerkGetToken) {
  g.__tempoClerkSupabaseGetToken = getToken;
}
