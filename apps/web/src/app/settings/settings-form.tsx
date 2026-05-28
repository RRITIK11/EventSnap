"use client";

import { useActionState } from "react";

import { updateSettingsAction, type UpdateSettingsState } from "./actions";

const initialState: UpdateSettingsState = undefined;

export function SettingsForm({
  initial,
}: {
  initial: { name: string; autoApprove: boolean };
}) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.error ? (
        <p className="rounded bg-red-950/50 px-3 py-2 text-sm text-red-300">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="rounded bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">Saved.</p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          name="name"
          type="text"
          required
          maxLength={80}
          defaultValue={initial.name}
          className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2"
        />
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded border border-neutral-800 bg-neutral-950 p-3 hover:border-neutral-700">
        <input
          name="autoApprove"
          type="checkbox"
          defaultChecked={initial.autoApprove}
          className="mt-0.5 accent-white"
        />
        <span className="flex flex-col gap-1">
          <span className="text-sm font-medium">Auto-approve photos of me</span>
          <span className="text-xs text-neutral-500">
            When this is on, photos matched to your face appear in your gallery automatically. Leave
            it off and we&apos;ll ask you to approve each one first.
          </span>
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
