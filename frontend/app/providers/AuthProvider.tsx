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
  createContext<AuthContextValue | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const router = useRouter();

  // ============================================================
  // BACKEND URL
  // ============================================================

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  // ============================================================
  // CHECK AUTHENTICATION
  // ============================================================

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch(
        `${apiUrl}/api/auth/me`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const data = await response.json();

      /*
       * Depending on your FastAPI response, this can be:
       *
       * { user: {...} }
       *
       * or directly:
       *
       * {...}
       */

      const currentUser =
        data?.user ?? data;

      setUser(currentUser);

      return currentUser;
    } catch (error) {
      console.error(
        "Authentication check failed:",
        error
      );

      setUser(null);

      return null;
    }
  }, [apiUrl]);

  // ============================================================
  // INITIAL AUTH CHECK
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const response = await fetch(
          `${apiUrl}/api/auth/me`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!mounted) return;

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        const currentUser =
          data?.user ?? data;

        setUser(currentUser);
      } catch (error) {
        if (mounted) {
          console.error(
            "Initial authentication check failed:",
            error
          );

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
             * VERY IMPORTANT
             *
             * Allows browser to accept/send
             * the crimeos_token cookie.
             */

            credentials: "include",

            body: JSON.stringify({
              email: email.trim(),
              password,
            }),
          }
        );

        // ------------------------------------------------------
        // PARSE RESPONSE
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

          setError(message);

          throw new Error(message);
        }

        // ------------------------------------------------------
        // USER FROM LOGIN RESPONSE
        // ------------------------------------------------------

        const loginUser =
          data?.user;

        if (loginUser) {
          setUser(loginUser);
        }

        // ------------------------------------------------------
        // VERIFY SESSION
        // ------------------------------------------------------

        /*
         * The backend should have set:
         *
         * crimeos_token
         *
         * as an HTTP-only cookie.
         *
         * We now verify that the browser can use it.
         */

        const meResponse = await fetch(
          `${apiUrl}/api/auth/me`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
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
            "Could not retrieve authenticated user."
          );
        }

        // ------------------------------------------------------
        // UPDATE AUTH STATE
        // ------------------------------------------------------

        setUser(authenticatedUser);

        // ------------------------------------------------------
        // RETURN USER
        // ------------------------------------------------------

        return authenticatedUser;
      } catch (error) {
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
        "Logout request failed:",
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