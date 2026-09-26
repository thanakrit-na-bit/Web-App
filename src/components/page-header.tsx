import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";

export function PageHeader({
  icon,
  title,
  description,
  actions,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-accent-soft text-accent">
            <Icon name={icon} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
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
