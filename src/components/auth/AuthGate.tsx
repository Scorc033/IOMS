"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/components/auth/AuthProvider";
import { RefreshCw } from "lucide-react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, error } = useAuth();
  const isLoginRoute = pathname?.replace(/\/+$/, "") === "/login";

  useEffect(() => {
    if (loading) return;
    if (isLoginRoute) {
      if (user) router.replace("/");
      return;
    }
    if (!user) router.replace("/login");
  }, [isLoginRoute, loading, router, user]);

  if (isLoginRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {error ? (
          <p className="max-w-lg px-6 text-center text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : (
          <RefreshCw className="h-7 w-7 animate-spin text-indigo-600 dark:text-indigo-400" />
        )}
      </div>
    );
  }

  return (
    <>
      <Navbar />
      {error && (
        <p className="mx-auto mt-4 max-w-7xl px-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
        IOMS — Browser-synced inventory
      </footer>
    </>
  );
}
