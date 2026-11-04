"use server";
import { getAdmin } from "@/firebase/admin";
import { cookies } from "next/headers";
import { z } from "zod";
export async function signIn(input: { idToken: string; name?: string }) {
  const { idToken, name } = z
    .object({
      idToken: z.string().min(1),
      name: z.string().trim().min(1).max(80).optional(),
    })
    .parse(input);
  const { auth, db } = getAdmin();
  const claims = await auth.verifyIdToken(idToken);
  if (Date.now() / 1000 - claims.auth_time > 300)
    throw new Error("Please sign in again.");
  const ref = db.collection("users").doc(claims.uid);
  const existing = await ref.get();
  if (!existing.exists)
    await ref.set({
      name: name || claims.name || claims.email?.split("@")[0] || "Candidate",
      email: claims.email || "",
    });
  const expiresIn = 60 * 60 * 24 * 7 * 1000;
  const session = await auth.createSessionCookie(idToken, { expiresIn });
  (await cookies()).set("session", session, {
    maxAge: expiresIn / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return { success: true };
}
export async function getCurrentUser(): Promise<User | null> {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  try {
    const { auth, db } = getAdmin();
    const claims = await auth.verifySessionCookie(session, true);
    const user = await db.collection("users").doc(claims.uid).get();
    return user.exists ? ({ id: claims.uid, ...user.data() } as User) : null;
  } catch {
    return null;
  }
}
export async function isAuthenticated() {
  return !!(await getCurrentUser());
}
export async function signOut() {
  (await cookies()).delete("session");
}
