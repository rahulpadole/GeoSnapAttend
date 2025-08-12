import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/user"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      try {
        console.log("Fetching auth user...");
        const response = await fetch("/api/user", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("Auth response status:", response.status);

        if (!response.ok) {
          if (response.status === 401) {
            console.log("User not authenticated");
            return null;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const userData = await response.json();
        console.log("Auth user data:", userData);
        return userData;
      } catch (error) {
        console.error("Auth fetch error:", error);
        return null; // Return null instead of throwing to prevent error state
      }
    },
  });

  console.log("useAuth state:", { user, isLoading, error });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}