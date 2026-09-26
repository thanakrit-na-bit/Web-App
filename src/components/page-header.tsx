import type { ReactNode } from "react";

export function PageHeader({
  icon,
  title,
  description,
  actions,
}: {
  icon?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3.5">
        {icon ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl shadow-sm shadow-blue-600/20">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
