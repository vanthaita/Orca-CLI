import type { ReactNode } from "react";

export const TerminalWindow = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`overflow-hidden rounded-lg border-2 border-dashed border-white/20 bg-[#0c0c0c] shadow-2xl font-mono text-sm leading-relaxed flex flex-col ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-white/15 bg-white/5 px-4 py-3 shrink-0">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <div className="ml-4 text-xs font-medium text-white/40">{title}</div>
      </div>
      <div className="p-6 text-neutral-300 font-mono">{children}</div>
    </div>
  );
};
