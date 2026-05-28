import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  getEventByCode,
  getEventMembers,
  getEventMembership,
  getUploadPolicy,
} from "@/lib/events";

import { CopyInviteButton } from "./copy-invite-button";
import { EventQR } from "./event-qr";
import { LeaveEventButton } from "./leave-event-button";
import { UploadPolicyForm } from "./upload-policy-form";

function formatRange(startsAt: Date | null, endsAt: Date | null) {
  if (!startsAt && !endsAt) return null;
  const fmt = (d: Date) =>
    d.toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  if (startsAt && endsAt) return `${fmt(startsAt)} → ${fmt(endsAt)}`;
  return fmt((startsAt ?? endsAt)!);
}

const roleStyles: Record<"owner" | "photographer" | "guest", string> = {
  owner: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  photographer: "bg-violet-500/20 text-violet-200 border-violet-500/40",
  guest: "bg-neutral-500/20 text-neutral-300 border-neutral-500/40",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/sign-in?callbackUrl=/events/${code}`);

  const event = await getEventByCode(code);
  if (!event) notFound();

  const membership = await getEventMembership(event.id, session.user.id);
  if (!membership) {
    // Signed in but not a member — bounce them through /join to get added cleanly.
    redirect(`/join/${event.code}`);
  }

  const members = await getEventMembers(event.id);
  const isOwner = membership.role === "owner";
  const range = formatRange(event.startsAt, event.endsAt);
  const uploadPolicy = getUploadPolicy(event.uploadPolicy);

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const inviteUrl = `${proto}://${host}/join/${event.code}`;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-6 py-12">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/events"
            className="text-xs text-neutral-500 underline hover:text-neutral-300"
          >
            ← All events
          </Link>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{event.name}</h1>
          <p className="mt-1 text-xs text-neutral-500">
            <span className="font-mono">{event.code}</span>
            {range ? <span> · {range}</span> : null}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${roleStyles[membership.role]}`}>
          {membership.role}
        </span>
      </header>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <p className="text-sm font-medium">Invite people</p>
        <p className="mt-1 text-xs text-neutral-400">
          Share the code, link, or QR. Anyone who opens it will be added as a guest.
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <EventQR url={inviteUrl} />
          </div>
          <div className="min-w-0 flex-1">
            <CopyInviteButton code={event.code} />
          </div>
        </div>
      </section>

      {isOwner ? (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <p className="text-sm font-medium">Who can upload photos</p>
          <p className="mt-1 mb-3 text-xs text-neutral-400">
            Choose who&apos;s allowed to upload to this event.
          </p>
          <UploadPolicyForm eventId={event.id} current={uploadPolicy} />
        </section>
      ) : null}

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
        <p className="text-sm font-medium">
          Members <span className="text-neutral-500">({members.length})</span>
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {members.map((m) => (
            <li
              key={m.userId}
              className="flex items-center justify-between gap-3 rounded border border-neutral-800 bg-neutral-950 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm">{m.name ?? "Unnamed"}</p>
                <p className="truncate text-xs text-neutral-500">{m.email}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${roleStyles[m.role]}`}>
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {!isOwner ? (
        <LeaveEventButton eventId={event.id} eventName={event.name} />
      ) : (
        <p className="text-xs text-neutral-500">
          Owners can&apos;t leave their own event. Event deletion is coming in a later phase.
        </p>
      )}
    </main>
  );
}
