export default function Loading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="กำลังโหลด"
    >
      <span className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
        กำลังโหลดข้อมูล...
      </span>
    </div>
  );
}
