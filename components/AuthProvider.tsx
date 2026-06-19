"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthState = {
  isGuest: boolean;
  userId: string | null;
  userEmail: string;
  userName: string | null;
  avatarUrl: string | null;
};

const GUEST: AuthState = {
  isGuest: true,
  userId: null,
  userEmail: "",
  userName: null,
  avatarUrl: null,
};

const AuthContext = createContext<AuthState>(GUEST);

export function useAuth() {
  return useContext(AuthContext);
}

// Mounted once in the root layout, so it survives client-side navigation
// between pages — fetches auth + profile exactly once per session instead
// of every page remounting its own copy of this fetch (which is what
// happened when this logic lived inside SiteHeader directly).
export default function AuthProvider({ children }: { children: React.ReactNode }) {
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
        userId,
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

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
