"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getClientAuth } from "@/firebase/client";
import { signIn } from "@/lib/actions/auth.action";
export default function AuthForm({ type }: { type: FormType }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const signup = type === "sign-up";
  return (
    <div className="card-border helper-auth">
      <div className="card">
        <Link href="/" className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">PrepWise</h2>
        </Link>
        <h3 className="text-center">Practice job interviews with AI</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const f = new FormData(e.currentTarget);
            try {
              const email = String(f.get("email")),
                password = String(f.get("password"));
              const auth = getClientAuth();
              const credential = await (signup
                ? createUserWithEmailAndPassword(auth, email, password)
                : signInWithEmailAndPassword(auth, email, password));
              await signIn({
                idToken: await credential.user.getIdToken(),
                ...(signup ? { name: String(f.get("name")) } : {}),
              });
              router.push("/");
              router.refresh();
            } catch (error) {
              const code =
                typeof error === "object" &&
                error !== null &&
                "code" in error &&
                typeof error.code === "string"
                  ? error.code
                  : "";
              const message =
                code === "auth/invalid-credential" ||
                code === "auth/invalid-login-credentials"
                  ? "Incorrect email or password."
                  : code === "auth/email-already-in-use"
                    ? "This email is already registered. Sign in instead."
                    : code === "auth/operation-not-allowed"
                      ? "Email/password sign-in is disabled in Firebase Authentication."
                      : error instanceof Error && error.message
                        ? error.message
                        : "Sign-in failed. Check your Firebase configuration.";
              setError(message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {signup && (
            <label>
              Name
              <input name="name" required maxLength={80} autoComplete="name" />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete={signup ? "new-password" : "current-password"}
            />
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button className="btn-primary !w-full" disabled={busy}>
            {busy ? "Connecting…" : signup ? "Create an Account" : "Sign in"}
          </button>
        </form>
        <Link
          className="text-center font-bold text-primary-100"
          href={signup ? "/sign-in" : "/sign-up"}
        >
          {signup
            ? "Already have an account? Sign in"
            : "No account yet? Sign up"}
        </Link>
      </div>
    </div>
  );
}
