import type { ElementType } from "react";
import Link from "next/link";

export const ReleaseButton = ({
  href,
  icon: Icon,
  label,
  subLabel,
  comingSoon = false,
}: {
  href: string;
  icon: ElementType<{ className?: string }>;
  label: string;
  subLabel?: string;
  comingSoon?: boolean;
}) => {
  if (comingSoon) {
    return (
      <div className="group relative flex items-center justify-center gap-4 border-2 border-dashed border-white/20 bg-neutral-900/20 p-4 transition-all opacity-70 cursor-not-allowed">
        <Icon className="h-8 w-8 text-neutral-600 transition-colors" />
        <div className="text-left">
          <div className="font-bold text-neutral-500 transition-colors">
            {label}
          </div>
          <div className="text-xs text-neutral-600">Coming Soon</div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group relative flex items-center justify-center gap-4 border-2 border-dashed border-white/20 bg-neutral-900/50 p-4 transition-all hover:bg-neutral-800 hover:border-emerald-500/40"
      target="_blank"
      rel="noreferrer"
    >
      <Icon className="h-8 w-8 text-white group-hover:text-emerald-400 transition-colors" />
      <div className="text-left">
        <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">
          {label}
        </div>
        {subLabel && <div className="text-xs text-neutral-500">{subLabel}</div>}
      </div>
    </Link>
  );
};
