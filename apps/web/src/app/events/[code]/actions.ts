"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { leaveEvent } from "@/lib/events";

export async function leaveEventAction({ eventId }: { eventId: string }) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  try {
    await leaveEvent({ eventId, userId: session.user.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not leave";
    return { error: msg };
  }

  redirect("/events");
}
