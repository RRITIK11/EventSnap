import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getMyEvents } from "@/lib/events";

function formatRange(startsAt: Date | null, endsAt: Date | null) {
  if (!startsAt && !endsAt) return null;
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  if (startsAt && endsAt) return `${fmt(startsAt)} → ${fmt(endsAt)}`;
  return fmt((startsAt ?? endsAt)!);
}

const roleStyles: Record<"owner" | "photographer" | "guest", string> = {
  owner: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  photographer: "bg-violet-500/20 text-violet-200 border-violet-500/40",
  guest: "bg-neutral-500/20 text-neutral-300 border-neutral-500/40",
};

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/events");

  const rows = await getMyEvents(session.user.id);

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your events</h1>
          <p className="text-sm text-neutral-400">Events you own or have joined.</p>
        </div>
        <Link
          href="/events/new"
          className="rounded bg-white px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-neutral-200"
        >
          + New event
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950 p-8 text-center">
          <p className="text-neutral-400">You haven&apos;t joined any event yet.</p>
          <Link
            href="/events/new"
            className="mt-3 inline-block rounded bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200"
          >
            Create your first event
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map(({ event, role }) => {
            const range = formatRange(event.startsAt, event.endsAt);
            return (
              <li key={event.id}>
                <Link
                  href={`/events/${event.code}`}
                  className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-4 transition hover:border-neutral-700 hover:bg-neutral-800/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium">{event.name}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      <span className="font-mono">{event.code}</span>
                      {range ? <span> · {range}</span> : null}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${roleStyles[role]}`}
                  >
                    {role}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
