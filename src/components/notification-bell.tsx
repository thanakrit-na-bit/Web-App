"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AppNotification } from "@/lib/notifications";

const STORAGE_KEY = "read-notifications";

const severityStyles: Record<AppNotification["severity"], string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  warning: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

const severityIcon: Record<AppNotification["severity"], string> = {
  critical: "🚨",
  warning: "⚠️",
  info: "ℹ️",
};

function loadReadIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function NotificationBell({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setReadIds(loadReadIds());
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const readSet = new Set(readIds);
  const unread = notifications.filter((item) => !readSet.has(item.id));

  function persist(next: string[]) {
    setReadIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function markAllRead() {
    persist(notifications.map((item) => item.id));
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`การแจ้งเตือน (ยังไม่อ่าน ${unread.length})`}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-base text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        🔔
        {unread.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread.length > 99 ? "99+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-pop absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/40 sm:w-96">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              การแจ้งเตือน ({notifications.length})
            </p>
            {unread.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                อ่านแล้วทั้งหมด
              </button>
            )}
          </div>

          <div className="scroll-slim max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">
                ไม่มีการแจ้งเตือน 🎉
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {notifications.map((item) => {
                  const isUnread = !readSet.has(item.id);
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          if (isUnread) persist([...readIds, item.id]);
                          setOpen(false);
                        }}
                        className={`flex gap-3 px-4 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                          isUnread ? "bg-blue-50/60 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${severityStyles[item.severity]}`}
                        >
                          {severityIcon[item.severity]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                              {item.title}
                            </span>
                            {isUnread && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                            )}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {item.detail}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
