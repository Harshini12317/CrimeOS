"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../providers/AuthProvider";

export default function DashboardPage() {
  const router = useRouter();

  const {
    user,
    isLoading,
  } = useAuth();

  useEffect(() => {
    // ------------------------------------------------------
    // WAIT FOR AUTH CHECK
    // ------------------------------------------------------

    if (isLoading) {
      return;
    }

    // ------------------------------------------------------
    // USER NOT LOGGED IN
    // ------------------------------------------------------

    if (!user) {
      router.replace("/login");
      return;
    }

    // ------------------------------------------------------
    // GET ROLE
    // ------------------------------------------------------

    const role = String(
      user.role || ""
    ).toUpperCase();

    console.log(
      "Dashboard redirect role:",
      role
    );

    // ------------------------------------------------------
    // IO
    // ------------------------------------------------------

    if (role === "IO") {
      router.replace("/dashboard/io");
      return;
    }

    // ------------------------------------------------------
    // SHO
    // ------------------------------------------------------

    if (role === "SHO") {
      router.replace("/dashboard/sho");
      return;
    }

    // ------------------------------------------------------
    // LEGAL ADVISOR
    // ------------------------------------------------------

    if (
      role === "LEGAL_ADVISOR" ||
      role === "LEGAL ADVISOR"
    ) {
      router.replace(
        "/dashboard/legal-advisor"
      );
      return;
    }

    // ------------------------------------------------------
    // UNKNOWN ROLE
    // ------------------------------------------------------

    console.error(
      "Unknown user role:",
      user.role
    );

    router.replace("/login");

  }, [
    user,
    isLoading,
    router,
  ]);

  // --------------------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------------------

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">

      <div className="text-center">

        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-maroon-700" />

        <p className="text-sm text-slate-600">
          Loading dashboard...
        </p>

      </div>

    </div>
  );
}