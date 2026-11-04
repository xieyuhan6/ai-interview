import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/actions/auth.action";
import LogoutButton from "@/components/LogoutButton";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <div className="root-layout">
      <nav className="helper-nav" aria-label="Main navigation">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="logo" width={38} height={32} priority />
          <h2 className="text-primary-100">PrepWise</h2>
        </Link>
        <div className="helper-nav-links">
          <Link href="/interview">Practice Interview</Link>
          <Link href="/resume">Resume Helper</Link>
          <Link href="/history">My Records</Link>
        </div>
        <div className="helper-account">
          {user ? (
            <>
              <span>{user.name}</span>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/sign-in"
              className="btn-primary inline-flex items-center"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
      <main className="helper-content">{children}</main>
    </div>
  );
}
