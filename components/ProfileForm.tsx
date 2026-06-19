"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import Avatar from "./Avatar";

type Form = Omit<Profile, "user_id">;

const EMPTY: Form = {
  username: "",
  full_name: "",
  headline: "",
  bio: "",
  location: "",
  education: "",
  company: "",
  job_title: "",
  website: "",
  linkedin: "",
  twitter: "",
  github: "",
  leetcode: "",
  codeforces: "",
  phone: "",
  avatar_url: null,
  is_public: false,
};

const USERNAME_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

function fromProfile(p: Profile | null): Form {
  if (!p) return { ...EMPTY };
  return {
    username: p.username ?? "",
    full_name: p.full_name ?? "",
    headline: p.headline ?? "",
    bio: p.bio ?? "",
    location: p.location ?? "",
    education: p.education ?? "",
    company: p.company ?? "",
    job_title: p.job_title ?? "",
    website: p.website ?? "",
    linkedin: p.linkedin ?? "",
    twitter: p.twitter ?? "",
    github: p.github ?? "",
    leetcode: p.leetcode ?? "",
    codeforces: p.codeforces ?? "",
    phone: p.phone ?? "",
    avatar_url: p.avatar_url ?? null,
    is_public: p.is_public ?? false,
  };
}

// Resize an image file to a square <=256px PNG to keep storage tiny while
// preserving transparency (JPEG has no alpha channel and would fill
// transparent areas with black).
async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const size = Math.min(256, Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  // center-crop to square
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/png"),
  );
}

export default function ProfileForm({
  userId,
  email,
  initial,
}: {
  userId: string;
  email: string;
  initial: Profile | null;
}) {
  const supabase = useRef(createClient()).current;
  const [form, setForm] = useState<Form>(() => fromProfile(initial));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(
    null,
  );

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus(null);
    try {
      const blob = await resizeImage(file);
      const path = `${userId}/avatar.png`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/png" });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      set("avatar_url", `${data.publicUrl}?v=${Date.now()}`);
    } catch (err) {
      setStatus({
        type: "err",
        msg:
          "Photo upload failed. Make sure the 'avatars' storage bucket exists (see profiles.sql).",
      });
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    const username = form.username?.trim().toLowerCase() || null;
    if (form.is_public && (!username || !USERNAME_RE.test(username))) {
      setStatus({
        type: "err",
        msg: "To go public, set a username: 3–30 chars, lowercase letters, numbers or hyphens.",
      });
      return;
    }

    setSaving(true);
    // Store empty strings as null for cleaner data, then set identity fields.
    const cleaned = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [
        k,
        typeof v === "string" && v.trim() === "" ? null : v,
      ]),
    );
    const payload = {
      ...cleaned,
      user_id: userId,
      username,
      is_public: form.is_public,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" });

    setSaving(false);
    if (error) {
      setStatus({
        type: "err",
        msg:
          error.code === "23505"
            ? "That username is already taken — try another."
            : `Couldn't save: ${error.message}`,
      });
      return;
    }
    setStatus({ type: "ok", msg: "Profile saved." });
  }

  const publicUrl =
    form.is_public && form.username ? `/u/${form.username.toLowerCase()}` : null;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
      <h1 className="mb-6 text-xl font-semibold tracking-tight text-zinc-900">
        Your profile
      </h1>
      <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar */}
          <section className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <Avatar name={form.full_name} email={email} src={form.avatar_url} size={64} />
            <div>
              <label className="inline-block cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">
                {uploading ? "Uploading…" : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleAvatar}
                />
              </label>
              {form.avatar_url && (
                <button
                  type="button"
                  onClick={() => set("avatar_url", null)}
                  className="ml-2 text-sm text-zinc-400 transition hover:text-red-500"
                >
                  Remove
                </button>
              )}
              <p className="mt-1 text-xs text-zinc-400">
                Optional — we show your initials otherwise.
              </p>
            </div>
          </section>

          <Card title="Basics">
            <Field label="Full name">
              <Input value={form.full_name} onChange={(v) => set("full_name", v)} placeholder="Nitin Kumar" />
            </Field>
            <Field label="Headline">
              <Input value={form.headline} onChange={(v) => set("headline", v)} placeholder="Backend engineer · DSA enthusiast" />
            </Field>
            <Field label="About">
              <textarea
                value={form.bio ?? ""}
                onChange={(e) => set("bio", e.target.value)}
                rows={3}
                placeholder="A short intro about you."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </Field>
            <Field label="Location">
              <Input value={form.location} onChange={(v) => set("location", v)} placeholder="Bengaluru, India" />
            </Field>
          </Card>

          <Card title="Work & education">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Current role">
                <Input value={form.job_title} onChange={(v) => set("job_title", v)} placeholder="Software Engineer" />
              </Field>
              <Field label="Company">
                <Input value={form.company} onChange={(v) => set("company", v)} placeholder="Acme Corp" />
              </Field>
            </div>
            <Field label="Education">
              <Input value={form.education} onChange={(v) => set("education", v)} placeholder="B.Tech CSE, XYZ University (2024)" />
            </Field>
          </Card>

          <Card title="Links">
            <Field label="Website">
              <Input value={form.website} onChange={(v) => set("website", v)} placeholder="https://yoursite.com" />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="LinkedIn">
                <Input value={form.linkedin} onChange={(v) => set("linkedin", v)} placeholder="https://linkedin.com/in/you" />
              </Field>
              <Field label="X (Twitter)">
                <Input value={form.twitter} onChange={(v) => set("twitter", v)} placeholder="https://x.com/you" />
              </Field>
              <Field label="GitHub">
                <Input value={form.github} onChange={(v) => set("github", v)} placeholder="https://github.com/you" />
              </Field>
              <Field label="LeetCode">
                <Input value={form.leetcode} onChange={(v) => set("leetcode", v)} placeholder="https://leetcode.com/u/you" />
              </Field>
              <Field label="Codeforces">
                <Input value={form.codeforces} onChange={(v) => set("codeforces", v)} placeholder="https://codeforces.com/profile/you" />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(v) => set("phone", v)} placeholder="+91 …" />
              </Field>
            </div>
          </Card>

          <Card title="Visibility">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => set("is_public", e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-400"
              />
              <span className="text-sm text-zinc-700">
                Make my profile public (shareable page)
              </span>
            </label>
            {form.is_public && (
              <Field label="Username (your public URL)">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-zinc-400">/u/</span>
                  <Input
                    value={form.username}
                    onChange={(v) =>
                      set("username", v.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    }
                    placeholder="your-name"
                  />
                </div>
              </Field>
            )}
            {publicUrl && (
              <p className="text-xs text-zinc-500">
                Public page:{" "}
                <Link
                  href={publicUrl}
                  className="text-indigo-600 hover:underline"
                  target="_blank"
                >
                  {publicUrl}
                </Link>{" "}
                (save first to publish changes)
              </p>
            )}
          </Card>

          {status && (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                status.type === "ok"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {status.msg}
            </p>
          )}

          <div className="sticky bottom-0 -mx-4 border-t border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur">
            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60 sm:w-auto sm:px-6"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-800">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
    />
  );
}
