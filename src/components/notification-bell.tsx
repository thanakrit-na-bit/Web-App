"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AppNotification } from "@/lib/notifications";
import { Icon, type IconName } from "@/components/icon";

const STORAGE_KEY = "read-notifications";

const severityStyles: Record<AppNotification["severity"], string> = {
  critical: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300",
  info: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300",
};

const severityIcon: Record<AppNotification["severity"], IconName> = {
  critical: "alarm",
  warning: "activity",
  info: "bell",
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
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <Icon name="bell" className="h-[18px] w-[18px]" />
        {unread.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unread.length > 99 ? "99+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="panel animate-pop absolute right-0 z-50 mt-2 w-80 overflow-hidden sm:w-96">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              การแจ้งเตือน ({notifications.length})
            </p>
            {unread.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-accent hover:underline"
              >
                อ่านแล้วทั้งหมด
              </button>
            )}
          </div>

          <div className="scroll-slim max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-sunken text-zinc-400">
                  <Icon name="check" className="h-5 w-5" />
                </span>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  ไม่มีการแจ้งเตือน
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
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
                        className={`flex gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                          isUnread ? "bg-blue-50/60 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${severityStyles[item.severity]}`}
                        >
                          <Icon name={severityIcon[item.severity]} className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                              {item.title}
                            </span>
                            {isUnread && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
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
