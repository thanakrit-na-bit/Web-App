import { pick } from "@/lib/pick";

const statusColors: Record<string, string> = {
  Running: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Stop: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  Alarm: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Maintenance:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Open: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "In Progress":
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  Closed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Scheduled:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  "Waiting Part":
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

export function StatusBadge({ status }: { status: string }) {
  const color = pick(
    statusColors,
    status,
    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
  );
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {status}
    </span>
  );
}