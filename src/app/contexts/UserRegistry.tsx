"use client";

import { useEffect } from "react";
import { useUserStore } from "../utils/store/userStore";
import { fetchUser } from "@/app/apis/settings";
import { onSignedOut } from "@/app/apis/http";
import { LoadingSpinner } from "../components/ultis/loadingSpinner";

const PUBLIC_PATHS = ["/auth/"];

export default function UserRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setUser, loading, setLoading, fetched, setFetched } = useUserStore();

  useEffect(() => {
    const initUser = async () => {
      setLoading(true);
      try {
        const profile = await fetchUser();
        setUser({
          id: profile.id,
          name: profile.full_name || "",
          username: profile.username || "",
          email: profile.email,
          avatar_url: profile.avatar_url || "",
        });
      } catch {
        setUser(null); // not signed in (or the server is unreachable): the page decides what to show
      } finally {
        setFetched(true);
        setLoading(false);
      }
    };

    if (!fetched) initUser();
  }, [fetched, setUser, setFetched, setLoading]);

  // The session expired somewhere mid-use: forget the user and go to the login page.
  useEffect(
    () =>
      onSignedOut(() => {
        setUser(null);
        if (!PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p))) {
          window.location.href = "/auth/login";
        }
      }),
    [setUser]
  );

  if (loading || !fetched) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
