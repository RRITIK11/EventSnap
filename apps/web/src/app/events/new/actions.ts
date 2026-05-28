"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import { createEvent } from "@/lib/events";

const schema = z.object({
  name: z.string().min(2).max(120),
  startsAt: z
    .string()
    .optional()
    .transform((s) => (s ? new Date(s) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), { message: "Invalid date" }),
  endsAt: z
    .string()
    .optional()
    .transform((s) => (s ? new Date(s) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), { message: "Invalid date" }),
});

export type CreateEventState = { error?: string } | undefined;

export async function createEventAction(
  _prev: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    startsAt: formData.get("startsAt") || undefined,
    endsAt: formData.get("endsAt") || undefined,
  });

  if (!parsed.success) {
    return { error: "Check the form: name (2–120 chars) and dates must be valid." };
  }

  const event = await createEvent({
    ownerId: session.user.id,
    name: parsed.data.name,
    startsAt: parsed.data.startsAt,
    endsAt: parsed.data.endsAt,
  });

  redirect(`/events/${event.code}`);
}
