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

  login: (
    email: string,
    password: string
  ) => Promise<User>;

  logout: () => Promise<void>;

  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(undefined);

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
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    "http://localhost:8000";

  // ============================================================
  // INITIAL AUTH CHECK
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        console.log(
          "🔐 Checking authentication..."
        );

        const response = await fetch(
          `${apiUrl}/api/auth/me`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        console.log(
          "🔐 /api/auth/me status:",
          response.status
        );

        if (!mounted) {
          return;
        }

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        /*
         * Supports both:
         *
         * { user: {...} }
         *
         * and:
         *
         * {...}
         */

        const currentUser =
          data?.user ?? data;

        console.log(
          "✅ Current user:",
          currentUser
        );

        setUser(currentUser);
      } catch (error) {
        console.error(
          "❌ Authentication check failed:",
          error
        );

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [apiUrl]);

  // ============================================================
  // LOGIN
  // ============================================================

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<User> => {
      setError(null);

      try {
        console.log(
          "🔐 Attempting login..."
        );

        // ------------------------------------------------------
        // LOGIN REQUEST
        // ------------------------------------------------------

        const response = await fetch(
          `${apiUrl}/api/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            /*
             * IMPORTANT:
             * Allows browser to receive/send
             * the crimeos_token cookie.
             */

            credentials: "include",

            body: JSON.stringify({
              email: email.trim(),
              password,
            }),
          }
        );

        console.log(
          "🔐 Login response:",
          response.status
        );

        // ------------------------------------------------------
        // READ RESPONSE
        // ------------------------------------------------------

        let data: any = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }

        // ------------------------------------------------------
        // LOGIN FAILED
        // ------------------------------------------------------

        if (!response.ok) {
          const message =
            data?.error ||
            data?.detail ||
            "Login failed.";

          console.error(
            "❌ Login failed:",
            message
          );

          setError(message);

          throw new Error(message);
        }

        console.log(
          "✅ Login API successful"
        );

        // ------------------------------------------------------
        // VERIFY AUTHENTICATION
        // ------------------------------------------------------

        /*
         * Login should have created:
         *
         * crimeos_token
         *
         * as an HTTP-only cookie.
         *
         * Verify that the browser can now authenticate.
         */

        const meResponse = await fetch(
          `${apiUrl}/api/auth/me`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        console.log(
          "🔐 Verification /me status:",
          meResponse.status
        );

        if (!meResponse.ok) {
          throw new Error(
            "Login succeeded, but the authentication session could not be verified."
          );
        }

        const meData =
          await meResponse.json();

        const authenticatedUser =
          meData?.user ?? meData;

        if (!authenticatedUser) {
          throw new Error(
            "Authenticated user could not be retrieved."
          );
        }

        console.log(
          "✅ Authenticated user:",
          authenticatedUser
        );

        // ------------------------------------------------------
        // SAVE USER
        // ------------------------------------------------------

        setUser(authenticatedUser);

        // ------------------------------------------------------
        // RETURN USER TO LOGIN PAGE
        // ------------------------------------------------------

        return authenticatedUser;
      } catch (error) {
        console.error(
          "❌ Login error:",
          error
        );

        if (error instanceof Error) {
          setError(error.message);
          throw error;
        }

        const message =
          "Login failed.";

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
      await fetch(
        `${apiUrl}/api/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (error) {
      console.error(
        "❌ Logout request failed:",
        error
      );
    } finally {
      setUser(null);

      router.replace("/login");
    }
  }, [apiUrl, router]);

  // ============================================================
  // ROLE CHECK
  // ============================================================

  const hasRole = useCallback(
    (...roles: Role[]) => {
      return (
        !!user &&
        roles.includes(user.role)
      );
    },
    [user]
  );

  // ============================================================
  // PROVIDER
  // ============================================================

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
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside <AuthProvider>"
    );
  }

  return context;
}