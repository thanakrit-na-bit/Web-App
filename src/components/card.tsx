import type { ReactNode } from "react";

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
  icon?: string;
  children: ReactNode;
  iconClass?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="flex min-w-0 items-center gap-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        {icon ? (
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm ${iconClass}`}
          >
            {icon}
          </span>
        ) : null}
        <span className="truncate">{children}</span>
      </h3>
      {action ? <div className="no-print shrink-0">{action}</div> : null}
    </div>
  );
}
