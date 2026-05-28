"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  UPLOAD_POLICIES,
  leaveEvent,
  updateUploadPolicy,
  type UploadPolicy,
} from "@/lib/events";

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

function isUploadPolicy(value: unknown): value is UploadPolicy {
  return typeof value === "string" && (UPLOAD_POLICIES as readonly string[]).includes(value);
}

export async function updateUploadPolicyAction({
  eventId,
  policy,
}: {
  eventId: string;
  policy: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };
  if (!isUploadPolicy(policy)) return { error: "Invalid policy value" };

  try {
    await updateUploadPolicy({ eventId, ownerId: session.user.id, policy });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not update" };
  }

  revalidatePath(`/events/[code]`, "page");
  return { ok: true };
}
