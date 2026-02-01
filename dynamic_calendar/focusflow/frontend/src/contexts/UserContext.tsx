"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  getGoogleAuthStatus,
  initiateGoogleAuth,
  logout as apiLogout,
} from "@/lib/api";
import type { UserProfile } from "@/lib/types";

interface UserContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const status = await getGoogleAuthStatus();
      if (status.authenticated && status.email) {
        setUser({
          email: status.email,
          name: status.name || "",
          given_name: status.given_name || "",
          picture: status.picture || "",
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user status:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async () => {
    try {
      const authData = await initiateGoogleAuth();
      // Open popup for Google OAuth
      const popup = window.open(
        authData.auth_url,
        "google-auth",
        "width=500,height=600,left=400,top=100"
      );

      // Poll for popup close
      const pollTimer = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(pollTimer);
          await refreshUser();
        }
      }, 500);
    } catch (error) {
      console.error("Failed to initiate login:", error);
    }
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
      setUser(null);
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  }, []);

  // Check auth status on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
