import { redirect } from "next/navigation";

// The dashboard has been merged into the root page.
// Redirect any old /dashboard links to /.
export default function DashboardPage() {
  redirect("/");
}
