"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SiteHeader from "@/components/SiteHeader";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
        return;
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        // Email confirmation disabled — we're signed in immediately.
        router.push("/");
        router.refresh();
        return;
      } else {
        setMessage("Check your inbox to confirm your email, then sign in.");
        setMode("signin");
      }
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setError(null);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Final <span className="text-indigo-600">450</span>
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Track your DSA sheet progress.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 text-sm font-medium">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                    setMessage(null);
                  }}
                  className={`rounded-md py-1.5 transition ${
                    mode === m
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </p>
              )}
              {message && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Please wait…"
                  : mode === "signin"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-xs text-zinc-400">
              <span className="h-px flex-1 bg-zinc-200" />
              or
              <span className="h-px flex-1 bg-zinc-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="mt-4 flex items-center justify-center gap-4 text-center">
              <Link
                href="/"
                className="text-sm text-zinc-500 transition hover:text-indigo-600"
              >
                ← Back to problems
              </Link>
              <Link
                href="/topics"
                className="text-sm text-zinc-500 transition hover:text-indigo-600"
              >
                Browse the 450 DSA sheet
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
