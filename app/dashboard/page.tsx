import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TrackerView from "@/components/TrackerView";
import type { ProgressRow } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // RLS restricts these to the current user's rows.
  const [{ data: progress }, { data: profile }] = await Promise.all([
    supabase.from("progress").select("problem_id, done, starred, note"),
    supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <TrackerView
      userId={user.id}
      userEmail={user.email ?? ""}
      userName={profile?.full_name ?? null}
      avatarUrl={profile?.avatar_url ?? null}
      initialProgress={(progress ?? []) as ProgressRow[]}
    />
  );
}
