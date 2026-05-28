import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-800"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <p className="text-sm text-neutral-400">Signed in as</p>
        <p className="text-lg font-medium">{session.user.name ?? "Unnamed"}</p>
        <p className="text-sm text-neutral-300">{session.user.email}</p>
        <p className="mt-3 font-mono text-xs text-neutral-500">user_id: {session.user.id}</p>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-300">
        <p className="font-medium text-neutral-100">Phase 1 — Foundation ✓</p>
        <p className="mt-2 text-neutral-400">
          You&apos;re authenticated. Phase 2 will add phone OTP and the selfie enrollment step that
          captures your face profile.
        </p>
      </section>
    </main>
  );
}
