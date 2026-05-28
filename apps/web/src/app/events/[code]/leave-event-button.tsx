"use client";

import { useState, useTransition } from "react";

import { leaveEventAction } from "./actions";

export function LeaveEventButton({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm(`Leave "${eventName}"? You'll lose access to photos in this event.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await leaveEventAction({ eventId });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded border border-red-900 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950/40 disabled:opacity-50"
      >
        {pending ? "Leaving…" : "Leave event"}
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
