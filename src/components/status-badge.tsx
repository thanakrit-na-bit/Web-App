import { pick } from "@/lib/pick";

const statusColors: Record<string, string> = {
  Running: "bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300",
  Stop: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  Alarm: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  Maintenance: "bg-accent-soft text-accent",
  Open: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  "In Progress":
    "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  Closed: "bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300",
  Completed: "bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300",
  Scheduled: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  "Waiting Part":
    "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
};

export function StatusBadge({ status }: { status: string }) {
  const color = pick(
    statusColors,
    status,
    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
  );
  return (
    <span
      className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {status}
    </span>
  );
}