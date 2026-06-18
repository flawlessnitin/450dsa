import { createClient } from "@/lib/supabase/server";
import TrackerView from "@/components/TrackerView";
import type { ProgressRow } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let progress: ProgressRow[] = [];
  let profileName: string | null = null;
  let profileAvatar: string | null = null;

  if (user) {
    const [{ data: progressData }, { data: profile }] = await Promise.all([
      supabase.from("progress").select("problem_id, done, starred, note"),
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    progress = (progressData ?? []) as ProgressRow[];
    profileName = profile?.full_name ?? null;
    profileAvatar = profile?.avatar_url ?? null;
  }

  return (
    <TrackerView
      userId={user?.id ?? null}
      userEmail={user?.email ?? ""}
      userName={profileName}
      avatarUrl={profileAvatar}
      initialProgress={progress}
    />
  );
}
