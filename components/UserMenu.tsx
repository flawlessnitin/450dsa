"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/actions";
import Avatar from "./Avatar";

// Avatar-only trigger in the navbar that opens a compact dropdown.
export default function UserMenu({
  userName,
  userEmail,
  avatarUrl,
}: {
  userName?: string | null;
  userEmail: string;
  avatarUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={`flex items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-white transition duration-200 hover:scale-105 active:scale-95 ${
          open ? "ring-indigo-400" : "ring-transparent hover:ring-zinc-200"
        }`}
      >
        <Avatar name={userName} email={userEmail} src={avatarUrl} size={34} />
      </button>

      <div
        role="menu"
        inert={!open}
        className={`absolute right-0 top-full z-20 mt-2.5 w-44 origin-top-right rounded-xl bg-white p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-black/5 transition duration-150 ease-out ${
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        <Link
          href="/profile"
          role="menuitem"
          onClick={() => setOpen(false)}
          className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
        >
          <UserIcon className="text-zinc-400 transition group-hover:text-zinc-600" />
          Profile
        </Link>

        <div className="my-1 h-px bg-zinc-100" />

        <form action={signOut}>
          <button
            type="submit"
            role="menuitem"
            className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <SignOutIcon className="transition group-hover:translate-x-0.5" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

function UserIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignOutIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M15 17l5-5-5-5M20 12H9M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
