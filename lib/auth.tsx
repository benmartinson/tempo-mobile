/**
 * Auth for the personal version of the app: there is no sign-in and there
 * are no tokens. The app always runs as one fixed user (LOCAL_USER_ID from
 * .env, or "local-user" if it isn't set).
 *
 * The hooks keep the same names and shapes the app used with Clerk, so the
 * rest of the code is unchanged.
 */
import * as React from "react";
import Constants from "expo-constants";

export const LOCAL_USER_ID: string =
  Constants.expoConfig?.extra?.LOCAL_USER_ID || "local-user";

if (__DEV__) {
  console.log(`[auth] no sign-in: running as user "${LOCAL_USER_ID}"`);
}

type LocalUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
};

const authState = {
  isLoaded: true,
  isSignedIn: true,
  userId: LOCAL_USER_ID as string | null,
  sessionId: null as string | null,
};

const localUser: LocalUser = {
  id: LOCAL_USER_ID,
  firstName: "Me",
  lastName: null,
  primaryEmailAddress: null,
};

export function useAuth(_opts?: { treatPendingAsSignedOut?: boolean }) {
  return authState;
}

export function useUser() {
  return { isLoaded: true, isSignedIn: true, user: localUser as LocalUser | null };
}

export function useClerk() {
  return { signOut: async (_opts?: { sessionId?: string }) => {} };
}

export function useSSO() {
  return {
    startSSOFlow: async (_opts: {
      strategy: string;
      redirectUrl?: string;
      [key: string]: unknown;
    }): Promise<{
      createdSessionId: string | null;
      setActive?: (opts: { session: string | null }) => Promise<void>;
      signUp?: { createdUserId?: string | null } | null;
    }> => {
      throw new Error("Sign-in is disabled in the personal version");
    },
  };
}

export function ClerkProvider({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
