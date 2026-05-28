import { schema } from "@repo/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";

import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/settings");

  const [user] = await db
    .select({
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      autoApprove: schema.users.autoApprove,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);

  if (!user) redirect("/sign-in");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-xs text-neutral-500 underline hover:text-neutral-300"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Settings</h1>
        </div>
      </header>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Account</p>
        <p className="mt-2 text-sm text-neutral-300">{user.email ?? "—"}</p>
        {user.phone ? <p className="text-sm text-neutral-500">{user.phone}</p> : null}
        <p className="mt-1 text-xs text-neutral-500">
          Changing email or phone isn&apos;t supported yet.
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <SettingsForm
          initial={{ name: user.name ?? "", autoApprove: user.autoApprove }}
        />
      </section>

      <section className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950 p-5">
        <p className="text-sm font-medium text-neutral-300">Selfie & face profile</p>
        <p className="mt-1 text-xs text-neutral-500">
          You haven&apos;t enrolled a selfie yet. This will become available in Phase 4 prep, when
          the face-matching pipeline is wired up.
        </p>
      </section>
    </main>
  );
}
