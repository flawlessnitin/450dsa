"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import UserMenu from "./UserMenu";

// Rendered on every page. Reads auth state from AuthProvider (mounted once
// in the root layout) instead of fetching its own — fetching here directly
// used to re-run on every single page navigation, since this component
// remounts per page while the root layout (and AuthProvider within it)
// does not.
export default function SiteHeader() {
  const auth = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-semibold tracking-tight text-zinc-900">
          Final <span className="text-indigo-600">450</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/topics"
            className="text-sm text-zinc-500 transition hover:text-indigo-600"
          >
            Browse Topics
          </Link>
          {auth.loading ? (
            <div
              aria-hidden="true"
              className="h-[34px] w-[34px] animate-pulse rounded-full bg-zinc-200"
            />
          ) : (
            <UserMenu
              isGuest={auth.isGuest}
              userName={auth.userName}
              userEmail={auth.userEmail}
              avatarUrl={auth.avatarUrl}
            />
          )}
        </div>
      </div>
    </header>
  );
}
