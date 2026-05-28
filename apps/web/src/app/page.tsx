import Link from "next/link";

import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">EventSnap</h1>
      <p className="text-neutral-400">
        Upload event photos. We deliver each one to the people whose faces appear in it.
      </p>

      {session?.user ? (
        <Link
          href="/dashboard"
          className="rounded bg-white px-4 py-2 font-medium text-neutral-950 hover:bg-neutral-200"
        >
          Go to dashboard
        </Link>
      ) : (
        <div className="flex gap-3">
          <Link
            href="/sign-up"
            className="rounded bg-white px-4 py-2 font-medium text-neutral-950 hover:bg-neutral-200"
          >
            Sign up
          </Link>
          <Link
            href="/sign-in"
            className="rounded border border-neutral-700 px-4 py-2 hover:bg-neutral-800"
          >
            Sign in
          </Link>
        </div>
      )}

      <p className="text-xs text-neutral-600">Scaffold v0 — Phase 1</p>
    </main>
  );
}
