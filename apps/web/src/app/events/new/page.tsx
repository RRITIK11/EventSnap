"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createEventAction, type CreateEventState } from "./actions";

const initialState: CreateEventState = undefined;

export default function NewEventPage() {
  const [state, formAction, pending] = useActionState(createEventAction, initialState);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">New event</h1>
        <Link
          href="/events"
          className="text-sm text-neutral-400 underline hover:text-neutral-100"
        >
          ← Cancel
        </Link>
      </header>

      <form action={formAction} className="flex flex-col gap-4">
        {state?.error ? (
          <p className="rounded bg-red-950/50 px-3 py-2 text-sm text-red-300">{state.error}</p>
        ) : null}

        <label className="flex flex-col gap-1 text-sm">
          Event name
          <input
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={120}
            placeholder="e.g. Riya & Arjun's wedding"
            className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Starts at <span className="text-xs text-neutral-500">(optional)</span>
          <input
            name="startsAt"
            type="datetime-local"
            className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Ends at <span className="text-xs text-neutral-500">(optional)</span>
          <input
            name="endsAt"
            type="datetime-local"
            className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-white px-4 py-2 font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create event"}
        </button>

        <p className="text-xs text-neutral-500">
          You&apos;ll get an invite link and code you can share with guests right after.
        </p>
      </form>
    </main>
  );
}
