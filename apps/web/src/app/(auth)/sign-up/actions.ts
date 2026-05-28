"use server";

import { schema } from "@repo/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const signUpSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  callbackUrl: z.string().default("/dashboard"),
});

// Only allow internal relative paths as callbackUrls to prevent open-redirects.
function safeCallback(raw: string): string {
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export type SignUpState = { error?: string } | undefined;

export async function signUpAction(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl") ?? "/dashboard",
  });

  if (!parsed.success) {
    return { error: "Check your name, email, and password (≥ 8 chars)." };
  }

  const { name, email, password, callbackUrl } = parsed.data;

  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);
  await db.insert(schema.users).values({
    email,
    name,
    passwordHash,
    consentAt: new Date(),
    consentVersion: 1,
  });

  // Sign the new user in immediately. Throws a redirect on success — that's expected.
  await signIn("credentials", { email, password, redirectTo: safeCallback(callbackUrl) });

  return undefined;
}
