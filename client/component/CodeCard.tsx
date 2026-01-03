"use client";

import { useState } from "react";
import { CopyIcon } from "./icons";

export const CodeCard = ({
  label,
  helper,
  code,
}: {
  label: string;
  helper: string;
  code: string;
}) => {
  const [copied, setCopied] = useState(false);

  return (
    <div className="group relative overflow-hidden bg-neutral-900/80 p-5 border-2 border-dashed border-white/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-neutral-300">
            {label}
          </div>
          <div className="mt-1 text-sm text-neutral-300/90">{helper}</div>
        </div>
        <button
          type="button"
          className="shrink-0 border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-100 transition hover:bg-white/10 inline-flex items-center gap-2"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            } catch {
              setCopied(false);
            }
          }}
        >
          <CopyIcon className="h-3.5 w-3.5" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="mt-4 overflow-x-auto border-t-2 border-dashed border-white/20 bg-black/50 p-4 text-sm leading-6 text-neutral-100">
        <code>{code}</code>
      </pre>
    </div>
  );
};
