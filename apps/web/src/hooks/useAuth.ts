import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import { signIn, signOut, useSession } from "../lib/auth";
import type { SessionUser } from "@compsphere/types";

export function useAuth() {
  const queryClient = useQueryClient();
  const session = useSession();

  // Query to fetch active Compsphere profile & role context from API
  const {
    data: profileResult,
    isLoading: isProfileLoading,
    error,
    refetch,
  } = useQuery<{ user: SessionUser | null; needsOnboarding: boolean } | null>({
    queryKey: ["session-user"],
    queryFn: async () => {
      try {
        const data = await api.get<SessionUser>("/api/auth/session-info");
        return { user: data, needsOnboarding: false };
      } catch (err: unknown) {
        // 403 PROFILE_NOT_FOUND = Google session exists but no Compsphere profile yet
        if (err instanceof ApiError && err.status === 403 && err.data?.error === "PROFILE_NOT_FOUND") {
          return { user: null, needsOnboarding: true };
        }
        return null;
      }
    },
    enabled: !!session.data?.user, // only query if better-auth session exists
  });

  const user = profileResult?.user ?? null;
  const needsOnboarding = profileResult?.needsOnboarding ?? false;

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
      queryClient.setQueryData(["session-user"], null);
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
    },
  });

  return {
    isAuthenticated: !!session.data?.user && !!user,
    isLoading: session.isPending || !!(session.data?.user && isProfileLoading),
    isAuthenticating: session.isPending || !!(session.data?.user && isProfileLoading),
    hasGoogleSession: !!session.data?.user,  // true even without a Compsphere profile
    needsOnboarding,                          // true when Google session exists but profile doesn't
    user: user || null,
    googleUser: session.data?.user || null,
    error,
    refetch,
    logout: () => logoutMutation.mutate(),
    signInWithGoogle: async () => {
      await signIn.social({
        provider: "google",
        // After Google auth, better-auth redirects back to THIS frontend URL
        callbackURL: `${window.location.origin}/auth/callback`,
      });
    },
  };
}
