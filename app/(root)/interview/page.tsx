import { InterviewSetup } from "@/components/HelperWorkspace";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; focus?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const params = await searchParams;
  return (
    <InterviewSetup
      userName={user.name}
      initialRole={
        typeof params.role === "string" ? params.role.slice(0, 120) : ""
      }
      initialFocus={params.focus === "technical" ? "Technical" : "Mixed"}
    />
  );
}
