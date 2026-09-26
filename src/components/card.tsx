import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";

export function Card({
  children,
  className = "",
  delay = 0,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  padded?: boolean;
}) {
  return (
    <section
      className={`surface animate-rise ${padded ? "p-5" : "overflow-hidden"} ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </section>
  );
}

export function CardTitle({
  icon,
  children,
  iconClass = "",
  action,
}: {
  icon?: IconName;
  children: ReactNode;
  iconClass?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="flex min-w-0 items-center gap-2.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {icon ? (
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-sunken text-zinc-500 dark:text-zinc-400 ${iconClass}`}
          >
            <Icon name={icon} className="h-4 w-4" />
          </span>
        ) : null}
        <span className="truncate">{children}</span>
      </h3>
      {action ? <div className="no-print shrink-0">{action}</div> : null}
    </div>
  );
}
