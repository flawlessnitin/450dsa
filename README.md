# Final 450 — DSA Progress Tracker

A web app to track your progress through the Love Babbar **Final 450** DSA sheet.
All 448 problems are grouped by topic, each linking to its resource (GeeksforGeeks),
with per-problem **done** tracking, **star-for-revision**, **notes**, search/filter,
and overall + per-topic progress bars. Your progress is stored in **Supabase** and
syncs across every device you sign in on.

Built with **Next.js 16** (App Router) · **Supabase** (Postgres + Auth + RLS) ·
**Tailwind CSS**.

---

## How it works

- **Problem catalog** — the 448 problems live in [`data/problems.json`](data/problems.json).
  It's read-only reference data shipped with the app.
- **Your progress** — only per-user state (done / starred / note) is stored in the
  `progress` table in Supabase, protected by Row-Level Security so each account sees
  only its own data.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In **Project Settings → API**, copy the **Project URL** and the **publishable key**
   (`sb_publishable_...`). The publishable key is meant to be used in the browser.
3. Create `.env.local` (copy from `.env.example`) and fill them in:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
   ```

### 3. Create the database tables

In the Supabase dashboard → **SQL Editor → New query**, run each of these:

1. [`supabase/schema.sql`](supabase/schema.sql) — the `progress` table, its
   Row-Level Security policy, and an `updated_at` trigger.
2. [`supabase/profiles.sql`](supabase/profiles.sql) — the `profiles` table
   (private by default, opt-in public page at `/u/<username>`), its RLS policies,
   the public solved-count function, and the public **`avatars`** storage bucket
   used for optional profile photos. Run `schema.sql` first (profiles reuses its
   trigger function).

### 4. (Optional) Email confirmation

By default Supabase requires email confirmation for email/password signups. For a
smoother personal setup, go to **Authentication → Sign In / Providers → Email** and
turn **"Confirm email"** off — then signups log you straight in.

### 5. (Optional) Enable Google sign-in

1. In the Supabase dashboard → **Authentication → Sign In / Providers → Google**,
   enable the provider. Note the **callback URL** it shows you.
2. In the [Google Cloud Console](https://console.cloud.google.com/), create an
   **OAuth 2.0 Client ID** (type: Web application):
   - **Authorized redirect URI:** the callback URL from Supabase
     (`https://<project-ref>.supabase.co/auth/v1/callback`).
3. Paste the Google **Client ID** and **Client Secret** back into Supabase and save.

> Email/password works without this step. Skip it if you don't want Google login.

### 6. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start
checking off problems.

---

## Deploying to Vercel

1. Push this repo to GitHub and import it at [vercel.com/new](https://vercel.com/new).
2. Add the two `NEXT_PUBLIC_SUPABASE_*` environment variables in the Vercel project
   settings (they're baked into the build, so set them before deploying).
3. In Supabase → **Authentication → URL Configuration**, add your Vercel URL to the
   **Redirect URLs** (e.g. `https://your-app.vercel.app/**`).
4. If using Google login, add `https://your-app.vercel.app` to the OAuth client's
   authorized origins as needed.

---

## Project structure

```
app/
  page.tsx              # redirects to /dashboard or /login
  login/page.tsx        # email/password + Google sign-in
  dashboard/page.tsx    # loads catalog + your progress + profile (SSR)
  profile/page.tsx      # edit your profile (protected)
  u/[username]/page.tsx # public profile page (opt-in)
  auth/callback/route.ts# OAuth / email-confirmation code exchange
  actions.ts            # signOut server action
components/
  TrackerView.tsx       # client orchestrator: state, optimistic saves, filters
  TopicSection.tsx      # collapsible per-topic group + progress
  ProblemRow.tsx        # row: done / link / star / notes
  NoteEditor.tsx        # per-problem notes (debounced autosave)
  FilterBar.tsx         # search + topic + status filters
  ProgressBar.tsx       # presentational bar
  ProfileForm.tsx       # profile editor: fields, photo upload, publish toggle
  Avatar.tsx            # photo or generated initials avatar
lib/
  catalog.ts            # imports data/problems.json, derives topics/counts
  types.ts              # shared types
  supabase/{client,server}.ts
data/problems.json      # catalog (448 problems)
supabase/schema.sql     # progress table + RLS
supabase/profiles.sql   # profiles table + RLS + avatars bucket
proxy.ts                # session refresh + route guard (Next 16 "middleware")
```
