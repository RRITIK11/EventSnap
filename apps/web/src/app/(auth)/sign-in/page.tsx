import Link from "next/link";

import { signIn } from "@/auth";

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  return <SignInForm searchParams={searchParams} />;
}

async function SignInForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl = "/dashboard" } = await searchParams;

  return (
    <form
      action={async (formData) => {
        "use server";
        await signIn("credentials", {
          email: formData.get("email"),
          password: formData.get("password"),
          redirectTo: callbackUrl,
        });
      }}
      className="flex flex-col gap-4"
    >
      <h2 className="text-xl font-medium">Sign in</h2>

      {error ? (
        <p className="rounded bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error === "CredentialsSignin"
            ? "Wrong email or password."
            : "Something went wrong. Try again."}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2"
        />
      </label>

      <button
        type="submit"
        className="rounded bg-white px-4 py-2 font-medium text-neutral-950 hover:bg-neutral-200"
      >
        Sign in
      </button>

      <GoogleSignInButton callbackUrl={callbackUrl} />

      <p className="text-center text-sm text-neutral-400">
        No account?{" "}
        <Link href="/sign-up" className="underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}

function GoogleSignInButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: callbackUrl });
      }}
    >
      <button
        type="submit"
        className="w-full rounded border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800"
      >
        Continue with Google
      </button>
    </form>
  );
}
