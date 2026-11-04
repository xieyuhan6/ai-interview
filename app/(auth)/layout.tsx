import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await getCurrentUser()) redirect("/");
  return <main className="auth-layout">{children}</main>;
}
