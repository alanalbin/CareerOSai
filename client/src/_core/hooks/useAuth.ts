import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export const getPersistedUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("careeros_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setPersistedUser = (user: any, token?: string) => {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem("careeros_user", JSON.stringify(user));
      if (token) localStorage.setItem("careeros_token", token);
    } else {
      localStorage.removeItem("careeros_user");
      localStorage.removeItem("careeros_token");
      localStorage.removeItem("careeros_github");
    }
    window.dispatchEvent(new Event("careeros:auth-change"));
  } catch {}
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const [localUser, setLocalUser] = useState<any>(() => getPersistedUser());

  useEffect(() => {
    const handleAuthChange = () => {
      setLocalUser(getPersistedUser());
    };
    window.addEventListener("careeros:auth-change", handleAuthChange);
    return () => window.removeEventListener("careeros:auth-change", handleAuthChange);
  }, []);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      setPersistedUser(null);
    },
  });

  const logout = useCallback(async () => {
    try {
      setPersistedUser(null);
      await logoutMutation.mutateAsync();
    } catch (error: any) {
      if (error?.data?.code === "UNAUTHORIZED") {
        return;
      }
    } finally {
      window.location.href = "/";
    }
  }, [logoutMutation]);

  const state = useMemo(() => {
    const rawData = meQuery.data;
    // Prefer server meQuery, fallback to localStorage user
    const user = rawData?.user ?? localUser ?? null;
    const profile = rawData?.profile ?? null;

    if (rawData?.user && JSON.stringify(rawData.user) !== JSON.stringify(localUser)) {
      setPersistedUser(rawData.user);
    }

    return {
      user,
      profile,
      loading: meQuery.isLoading && !localUser,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(user),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    localUser,
    logoutMutation.error,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (state.loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    if (redirectPath) {
      window.location.href = redirectPath;
    } else {
      startLogin("login");
    }
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    state.loading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
