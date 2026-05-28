import { randomBytes, randomUUID } from "node:crypto";

import { schema } from "@repo/db";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";

// Alphanumeric without I, O, 0, 1 (visually ambiguous when shared verbally).
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(length = 6): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return out;
}

export type CreateEventInput = {
  ownerId: string;
  name: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

export async function createEvent(input: CreateEventInput) {
  // Retry on the rare code collision (32^6 ≈ 1B codes; collisions are vanishingly rare).
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      const [event] = await db
        .insert(schema.events)
        .values({
          ownerId: input.ownerId,
          name: input.name,
          code,
          qrToken: randomUUID(),
          startsAt: input.startsAt ?? null,
          endsAt: input.endsAt ?? null,
        })
        .returning();

      if (!event) throw new Error("Event insert returned no row");

      await db.insert(schema.eventMembers).values({
        eventId: event.id,
        userId: input.ownerId,
        role: "owner",
      });

      return event;
    } catch (err) {
      const pgErr = err as { code?: string; constraint_name?: string };
      // 23505 = unique violation. Only retry on the code collision; rethrow otherwise.
      if (pgErr.code === "23505" && pgErr.constraint_name?.includes("code")) {
        continue;
      }
      throw err;
    }
  }
  throw new Error("Could not generate a unique event code after 5 attempts");
}

export async function getEventByCode(code: string) {
  const [event] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.code, code))
    .limit(1);
  return event ?? null;
}

export async function getMyEvents(userId: string) {
  return db
    .select({
      event: schema.events,
      role: schema.eventMembers.role,
      joinedAt: schema.eventMembers.joinedAt,
    })
    .from(schema.eventMembers)
    .innerJoin(schema.events, eq(schema.eventMembers.eventId, schema.events.id))
    .where(eq(schema.eventMembers.userId, userId))
    .orderBy(desc(schema.events.createdAt));
}

export async function getEventMembership(eventId: string, userId: string) {
  const [membership] = await db
    .select()
    .from(schema.eventMembers)
    .where(
      and(eq(schema.eventMembers.eventId, eventId), eq(schema.eventMembers.userId, userId)),
    )
    .limit(1);
  return membership ?? null;
}

export async function getEventMembers(eventId: string) {
  return db
    .select({
      userId: schema.eventMembers.userId,
      role: schema.eventMembers.role,
      joinedAt: schema.eventMembers.joinedAt,
      name: schema.users.name,
      email: schema.users.email,
      image: schema.users.image,
    })
    .from(schema.eventMembers)
    .innerJoin(schema.users, eq(schema.eventMembers.userId, schema.users.id))
    .where(eq(schema.eventMembers.eventId, eventId))
    .orderBy(desc(schema.eventMembers.joinedAt));
}

/** Idempotent — returns existing membership if already joined. */
export async function joinEvent(input: { eventId: string; userId: string }) {
  const existing = await getEventMembership(input.eventId, input.userId);
  if (existing) return existing;

  const [membership] = await db
    .insert(schema.eventMembers)
    .values({
      eventId: input.eventId,
      userId: input.userId,
      role: "guest",
    })
    .returning();
  return membership!;
}

export const UPLOAD_POLICIES = ["owner", "members", "anyone"] as const;
export type UploadPolicy = (typeof UPLOAD_POLICIES)[number];

export function getUploadPolicy(uploadPolicyJson: unknown): UploadPolicy {
  if (
    uploadPolicyJson &&
    typeof uploadPolicyJson === "object" &&
    "who" in uploadPolicyJson &&
    typeof (uploadPolicyJson as { who: unknown }).who === "string" &&
    (UPLOAD_POLICIES as readonly string[]).includes((uploadPolicyJson as { who: string }).who)
  ) {
    return (uploadPolicyJson as { who: UploadPolicy }).who;
  }
  return "members";
}

export async function updateUploadPolicy(input: {
  eventId: string;
  ownerId: string;
  policy: UploadPolicy;
}) {
  const [event] = await db
    .select({ ownerId: schema.events.ownerId })
    .from(schema.events)
    .where(eq(schema.events.id, input.eventId))
    .limit(1);

  if (!event) throw new Error("Event not found");
  if (event.ownerId !== input.ownerId) {
    throw new Error("Only the event owner can change the upload policy");
  }

  await db
    .update(schema.events)
    .set({ uploadPolicy: { who: input.policy } })
    .where(eq(schema.events.id, input.eventId));
}

export async function leaveEvent(input: { eventId: string; userId: string }) {
  // Owners can't leave their own event — they'd orphan it. Use a separate "delete event" path.
  const membership = await getEventMembership(input.eventId, input.userId);
  if (!membership) return null;
  if (membership.role === "owner") {
    throw new Error("Owners cannot leave their own event");
  }
  await db
    .delete(schema.eventMembers)
    .where(
      and(eq(schema.eventMembers.eventId, input.eventId), eq(schema.eventMembers.userId, input.userId)),
    );
  return membership;
}
