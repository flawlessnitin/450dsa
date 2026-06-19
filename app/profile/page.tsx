import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import SiteHeader from "@/components/SiteHeader";
import type { Profile } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      <SiteHeader />
      <ProfileForm
        userId={user.id}
        email={user.email ?? ""}
        initial={(data as Profile | null) ?? null}
      />
    </>
  );
}
