import { HistoryWorkspace } from "@/components/HelperWorkspace";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
export default async function Page() {
  if (!(await getCurrentUser())) redirect("/sign-in");
  return <HistoryWorkspace />;
}
