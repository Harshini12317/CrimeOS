"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User, Role } from "../types/Auth";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // ============================================================
  // BACKEND API URL
  // ============================================================

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // ============================================================
  // CHECK CURRENT USER
  // ============================================================

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`${apiUrl}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();

        setUser(data.user ?? null);
      } catch (error) {
        console.error("Authentication check failed:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [apiUrl]);

  // ============================================================
  // LOGIN
  // ============================================================

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);

      try {
        const res = await fetch(`${apiUrl}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
          }),
        });

        let data: any = {};

        try {
          data = await res.json();
        } catch {
          data = {};
        }

        if (!res.ok) {
          const message =
            data?.error ||
            data?.detail ||
            "Login failed.";

          setError(message);
          throw new Error(message);
        }

        setUser(data.user ?? null);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
          throw err;
        }

        const message = "Login failed.";
        setError(message);
        throw new Error(message);
      }
    },
    [apiUrl]
  );

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = useCallback(async () => {
    try {
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [apiUrl, router]);

  // ============================================================
  // ROLE CHECK
  // ============================================================

  const hasRole = useCallback(
    (...roles: Role[]) =>
      !!user && roles.includes(user.role),
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// USE AUTH
// ============================================================

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside <AuthProvider>"
    );
  }

  return ctx;
}