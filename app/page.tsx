import { createClient } from "@/lib/supabase/server";
import TrackerView from "@/components/TrackerView";
import type { ProgressRow } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let progress: ProgressRow[] = [];

  if (user) {
    const { data: progressData } = await supabase
      .from("progress")
      .select("problem_id, done, starred, note");
    progress = (progressData ?? []) as ProgressRow[];
  }

  return <TrackerView userId={user?.id ?? null} initialProgress={progress} />;
}
