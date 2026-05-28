"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { signUpAction, type SignUpState } from "./actions";

const initialState: SignUpState = undefined;

export default function SignUpPage() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <h2 className="text-xl font-medium">Create your account</h2>

      <p className="text-xs text-neutral-400">
        By signing up you agree that EventSnap may process your photo and the photos others upload
        in events you join, including using face recognition to deliver matched photos to you.
      </p>

      {state?.error ? (
        <p className="rounded bg-red-950/50 px-3 py-2 text-sm text-red-300">{state.error}</p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          name="name"
          type="text"
          required
          maxLength={80}
          autoComplete="name"
          className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2"
        />
        <span className="text-xs text-neutral-500">Min. 8 characters.</span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-white px-4 py-2 font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create account"}
      </button>

      <p className="text-center text-sm text-neutral-400">
        Already have one?{" "}
        <Link
          href={{
            pathname: "/sign-in",
            query: callbackUrl !== "/dashboard" ? { callbackUrl } : undefined,
          }}
          className="underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
