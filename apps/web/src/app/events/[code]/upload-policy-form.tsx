"use client";

import { useState, useTransition } from "react";

import type { UploadPolicy } from "@/lib/events";

import { updateUploadPolicyAction } from "./actions";

const OPTIONS: { value: UploadPolicy; label: string; description: string }[] = [
  {
    value: "owner",
    label: "Only me",
    description: "Only you can upload photos to this event.",
  },
  {
    value: "members",
    label: "All event members",
    description: "Anyone you've added or who joined the event can upload.",
  },
  {
    value: "anyone",
    label: "Anyone with the link",
    description: "Anyone who opens the invite link can upload — even without an account.",
  },
];

export function UploadPolicyForm({
  eventId,
  current,
}: {
  eventId: string;
  current: UploadPolicy;
}) {
  const [selected, setSelected] = useState<UploadPolicy>(current);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const dirty = selected !== current;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dirty || pending) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await updateUploadPolicyAction({ eventId, policy: selected });
      if (result?.error) {
        setFeedback({ kind: "err", msg: result.error });
      } else {
        setFeedback({ kind: "ok", msg: "Saved" });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2">
        {OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer flex-col gap-0.5 rounded border px-3 py-2 ${
              selected === opt.value
                ? "border-neutral-500 bg-neutral-800/60"
                : "border-neutral-800 hover:border-neutral-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="who"
                value={opt.value}
                checked={selected === opt.value}
                onChange={() => setSelected(opt.value)}
                className="accent-white"
              />
              <span className="text-sm font-medium">{opt.label}</span>
            </div>
            <span className="ml-6 text-xs text-neutral-500">{opt.description}</span>
          </label>
        ))}
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!dirty || pending}
          className="rounded bg-white px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {feedback ? (
          <span
            className={`text-xs ${feedback.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}
          >
            {feedback.msg}
          </span>
        ) : null}
      </div>
    </form>
  );
}
