import { pick } from "@/lib/pick";

const statusColors: Record<string, string> = {
  Running: "bg-green-100 text-green-700",
  Stop: "bg-yellow-100 text-yellow-700",
  Alarm: "bg-red-100 text-red-700",
  Maintenance: "bg-blue-100 text-blue-700",
  Open: "bg-red-100 text-red-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  Closed: "bg-green-100 text-green-700",
  Scheduled: "bg-slate-100 text-slate-600",
  "Waiting Part": "bg-orange-100 text-orange-700",
};

export function StatusBadge({ status }: { status: string }) {
  const color = pick(statusColors, status, "bg-zinc-100 text-zinc-600");
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}