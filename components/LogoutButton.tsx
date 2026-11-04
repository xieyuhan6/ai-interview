"use client";
import { signOut } from "@/lib/actions/auth.action";
import { getClientAuth } from "@/firebase/client";
import { useRouter } from "next/navigation";
export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="quiet"
      onClick={async () => {
        await signOut();
        await getClientAuth().signOut();
        router.push("/sign-in");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
