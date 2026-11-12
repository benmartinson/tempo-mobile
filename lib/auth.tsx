/**
 * Auth entry point for the app. Import auth hooks from here, not from
 * "@clerk/clerk-expo" directly.
 *
 * Normal mode: re-exports Clerk unchanged.
 *
 * Personal mode (LOCAL_USER_ID set in .env): Clerk is skipped entirely and
 * the app always behaves as if that one user is signed in. Supabase is then
 * accessed with the service role key (see lib/supabase.ts), so this mode is
 * only for a personal build on your own phone, never for a shared or
 * published build.
 */
import * as React from "react";
import Constants from "expo-constants";
import * as Clerk from "@clerk/clerk-expo";

const LOCAL_USER_ID: string | undefined =
  Constants.expoConfig?.extra?.LOCAL_USER_ID || undefined;

export const AUTH_BYPASS = !!LOCAL_USER_ID;

if (__DEV__ && AUTH_BYPASS) {
  console.log(`[auth] personal mode: signed in as ${LOCAL_USER_ID}`);
}

const noTokenGetter = async (_opts?: { template?: string }) => null;

const bypassAuthState = {
  isLoaded: true as const,
  isSignedIn: true as const,
  userId: LOCAL_USER_ID as string,
  sessionId: "local-session",
  getToken: noTokenGetter,
  signOut: async () => {},
};

const bypassUser = {
  id: LOCAL_USER_ID as string,
  firstName: "Me",
  lastName: null,
  fullName: "Me",
  imageUrl: undefined,
  primaryEmailAddress: null,
  emailAddresses: [],
};

function useBypassAuth(_opts?: unknown) {
  return bypassAuthState;
}

function useBypassUser() {
  return { isLoaded: true, isSignedIn: true, user: bypassUser };
}

function useBypassClerk() {
  return { signOut: async () => {} };
}

function useBypassSSO() {
  return {
    startSSOFlow: async () => {
      throw new Error("Sign-in is disabled in personal mode");
    },
  };
}

function BypassProvider({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export const useAuth = (
  AUTH_BYPASS ? useBypassAuth : Clerk.useAuth
) as typeof Clerk.useAuth;
export const useUser = (
  AUTH_BYPASS ? useBypassUser : Clerk.useUser
) as typeof Clerk.useUser;
export const useClerk = (
  AUTH_BYPASS ? useBypassClerk : Clerk.useClerk
) as typeof Clerk.useClerk;
export const useSSO = (
  AUTH_BYPASS ? useBypassSSO : Clerk.useSSO
) as typeof Clerk.useSSO;
export const ClerkProvider = (
  AUTH_BYPASS ? BypassProvider : Clerk.ClerkProvider
) as typeof Clerk.ClerkProvider;
