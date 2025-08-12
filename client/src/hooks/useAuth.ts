import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
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
        console.log("Auth response headers:", Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          if (response.status === 401) {
            console.log("User not authenticated");
            return null;
          }
          const errorText = await response.text();
          console.error("Auth error response:", errorText);
          throw new Error(`Auth request failed: ${response.status} - ${errorText}`);
        }

        const userData = await response.json();
        console.log("Auth user data:", userData);
        return userData;
      } catch (error) {
        console.error("Auth fetch error:", error);
        return null; // Return null instead of throwing to prevent error state
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  console.log("useAuth state:", { user, isLoading, error });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}