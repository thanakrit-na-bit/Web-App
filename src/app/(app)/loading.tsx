export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-20" role="status" aria-live="polite">
      <span className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
        กำลังโหลดข้อมูล...
      </span>
    </div>
  );
}
