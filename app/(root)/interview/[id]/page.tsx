import { InterviewRoom } from "@/components/HelperWorkspace";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { id } = await params;
  return <InterviewRoom id={id} userName={user.name} />;
}
