"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import UserMenu from "./UserMenu";

type AuthState = {
  isGuest: boolean;
  userEmail: string;
  userName: string | null;
  avatarUrl: string | null;
};

const GUEST: AuthState = { isGuest: true, userEmail: "", userName: null, avatarUrl: null };

// Self-contained header rendered identically on every page. It determines its
// own auth state client-side (getSession, not getUser — this is a display
// concern, not a security boundary) so the static SEO pages that render it
// stay fully static; only this component hydrates and fetches at runtime.
export default function SiteHeader() {
  const [auth, setAuth] = useState<AuthState>(GUEST);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadProfile(userId: string, email: string) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();
      if (!active) return;
      setAuth({
        isGuest: false,
        userEmail: email,
        userName: data?.full_name ?? null,
        avatarUrl: data?.avatar_url ?? null,
      });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session?.user) {
        loadProfile(session.user.id, session.user.email ?? "");
      } else {
        setAuth(GUEST);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        loadProfile(session.user.id, session.user.email ?? "");
      } else {
        setAuth(GUEST);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

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
          <UserMenu
            isGuest={auth.isGuest}
            userName={auth.userName}
            userEmail={auth.userEmail}
            avatarUrl={auth.avatarUrl}
          />
        </div>
      </div>
    </header>
  );
}
