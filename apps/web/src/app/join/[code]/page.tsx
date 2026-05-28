import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { getEventByCode, joinEvent } from "@/lib/events";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    // Bounce to sign-up with callback. Sign-up page passes callbackUrl into the form
    // so the signed-up user lands back here for the actual join.
    redirect(`/sign-up?callbackUrl=/join/${code}`);
  }

  const event = await getEventByCode(code);
  if (!event) notFound();

  await joinEvent({ eventId: event.id, userId: session.user.id });
  redirect(`/events/${event.code}`);
}
