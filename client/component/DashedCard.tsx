import type { ReactNode } from "react";

export const DashedCard = ({
  children,
  title,
  className = "",
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) => {
  return (
    <div className={`relative group ${className}`}>
      <div
        className="h-full border-2 border-dashed border-white/20 bg-neutral-900/50 p-5 relative overflow-hidden transition-colors hover:border-emerald-500/30"
      >
        {title && <div className="text-sm font-semibold mb-2">{title}</div>}
        {children}
      </div>
    </div>
  );
};
