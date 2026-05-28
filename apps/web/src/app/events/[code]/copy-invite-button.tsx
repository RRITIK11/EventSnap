"use client";

import { useState } from "react";

export function CopyInviteButton({ code }: { code: string }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const link = typeof window !== "undefined" ? `${window.location.origin}/join/${code}` : `/join/${code}`;

  async function copy(value: string, kind: "code" | "link") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard API can fail in non-secure contexts (e.g., raw http). Surface inline.
      window.prompt("Copy manually:", value);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-lg tracking-widest">
          {code}
        </code>
        <button
          type="button"
          onClick={() => copy(code, "code")}
          className="rounded border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800"
        >
          {copied === "code" ? "✓" : "Copy"}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-400">
          {link}
        </code>
        <button
          type="button"
          onClick={() => copy(link, "link")}
          className="rounded border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800"
        >
          {copied === "link" ? "✓" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
