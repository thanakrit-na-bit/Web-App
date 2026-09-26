export function EmptyState({
  icon = "📭",
  title,
  hint,
}: {
  icon?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-200 px-4 py-10 text-center dark:border-zinc-800">
      <span className="text-3xl" aria-hidden>
        {icon}
      </span>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{title}</p>
      {hint ? <p className="max-w-sm text-xs text-zinc-400">{hint}</p> : null}
    </div>
  );
}
