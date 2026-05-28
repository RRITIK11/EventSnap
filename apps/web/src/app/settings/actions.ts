"use server";

import { schema } from "@repo/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";

const updateSchema = z.object({
  name: z.string().min(1).max(80),
  autoApprove: z.boolean(),
});

export type UpdateSettingsState = { error?: string; ok?: boolean } | undefined;

export async function updateSettingsAction(
  _prev: UpdateSettingsState,
  formData: FormData,
): Promise<UpdateSettingsState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const parsed = updateSchema.safeParse({
    name: formData.get("name"),
    autoApprove: formData.get("autoApprove") === "on",
  });

  if (!parsed.success) {
    return { error: "Check your inputs (name 1–80 chars)." };
  }

  await db
    .update(schema.users)
    .set({
      name: parsed.data.name,
      autoApprove: parsed.data.autoApprove,
    })
    .where(eq(schema.users.id, session.user.id));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
