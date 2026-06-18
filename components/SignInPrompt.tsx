"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

/**
 * A modal overlay shown to unauthenticated users when they attempt to use a
 * progress-tracking feature (mark done, star, or write a note). Directs them
 * to sign in; offers a dismiss button to keep browsing.
 */
export default function SignInPrompt({ onClose }: { onClose: () => void }) {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape key.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Close when clicking the backdrop (not the card itself).
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative mx-4 w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-indigo-600"
            aria-hidden="true"
          >
            <path
              d="M12 15v-3m0 0V9m0 3h3m-3 0H9m-5 9V6a2 2 0 012-2h3.28a2 2 0 011.58.78l.72.96c.34.45.87.72 1.42.76H18a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="mb-1 text-center text-lg font-semibold text-zinc-900">
          Sign in to track progress
        </h2>
        <p className="mb-5 text-center text-sm text-zinc-500">
          Create a free account to mark problems as done, star them for
          revision, and add personal notes.
        </p>

        <Link
          href="/login"
          className="mb-3 block w-full rounded-lg bg-indigo-600 py-2.5 text-center text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          Sign in or create account
        </Link>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg py-2 text-center text-sm font-medium text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-700"
        >
          Continue browsing
        </button>
      </div>
    </div>
  );
}
