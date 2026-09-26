import { Icon, type IconName } from "@/components/icon";

export function EmptyState({
  icon = "box",
  title,
  hint,
}: {
  icon?: IconName;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-sunken text-zinc-400">
        <Icon name={icon} />
      </span>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {title}
      </p>
      {hint ? (
        <p className="max-w-sm text-xs text-zinc-400 dark:text-zinc-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
