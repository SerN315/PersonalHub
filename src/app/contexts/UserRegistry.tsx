"use client";

import { useEffect } from "react";
import { useUserStore } from "../utils/store/userStore";
import { fetchUser } from "@/app/apis/settings";
import { LoadingSpinner } from "../components/ultis/loadingSpinner";

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
        const user = await fetchUser();
        console.log("Fetched user:", user);

        if (user?.email) {
          setUser({
            id: user.id || "",
            name: user.display_name || "",
            username: user.user_metadata?.username || "",
            email: user.email || "",
            avatar_url: user.user_metadata?.avatar_url || "",
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setUser(null);
      } finally {
        setFetched(true);
        setLoading(false);
      }
    };

    if (!fetched) initUser();
  }, [fetched, setUser, setFetched, setLoading]);

  const shouldShowLoading = loading || !fetched;

  if (shouldShowLoading) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
