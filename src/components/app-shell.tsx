"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavLink } from "@/components/nav-link";
import { NotificationBell } from "@/components/notification-bell";
import { can } from "@/lib/permissions";
import type { Role } from "@/lib/types";
import type { AppNotification } from "@/lib/notifications";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/machines", label: "เครื่องจักร (Machines)", icon: "⚙️" },
  { href: "/alarms", label: "Alarm", icon: "🚨" },
  { href: "/maintenance", label: "งานบำรุงรักษา", icon: "🔧" },
];

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  technician: "Technician",
  viewer: "Viewer",
};

const roleClasses: Record<Role, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  technician: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  viewer: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
};

type ShellUser = {
  email: string;
  full_name: string | null;
  role: Role;
};

function SidebarContent({
  user,
  notifications,
  onNavigate,
}: {
  user: ShellUser;
  notifications: AppNotification[];
  onNavigate?: () => void;
}) {
  const initial = (user.full_name ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <>
      <div className="relative flex items-center justify-between gap-2 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-blue-500/10 to-transparent" />
        <div className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg shadow-sm shadow-blue-600/30 dark:from-blue-500 dark:to-indigo-500">
            ⚙️
          </span>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Alarm &amp; Maintenance
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Management System
            </p>
          </div>
        </div>
        <div className="relative flex items-center gap-1.5">
          <NotificationBell notifications={notifications} />
          <ThemeToggle />
        </div>
      </div>

      <nav className="scroll-slim flex-1 space-y-1 overflow-y-auto p-3" onClick={onNavigate}>
        <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          ภาพรวม
        </p>
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon}>
            {item.label}
          </NavLink>
        ))}
        {can(user.role, "manageUsers") && (
          <>
            <div className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              การจัดการ
            </div>
            <NavLink href="/admin/users" icon="👥">
              ผู้ใช้งาน (Users)
            </NavLink>
            <NavLink href="/admin/audit" icon="📜">
              Audit Log
            </NavLink>
          </>
        )}
      </nav>

      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-zinc-50 p-2.5 dark:bg-zinc-900">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {user.full_name ?? user.email}
            </p>
            <span
              className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${roleClasses[user.role]}`}
            >
              {roleLabels[user.role]}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <Link
            href="/change-password"
            onClick={onNavigate}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            🔑 เปลี่ยนรหัสผ่าน
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export function AppShell({
  user,
  notifications,
  children,
}: {
  user: ShellUser;
  notifications: AppNotification[];
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="เปิดเมนู"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
        >
          ☰
        </button>
        <span className="flex-1 truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Alarm &amp; Maintenance
        </span>
        <NotificationBell notifications={notifications} />
        <ThemeToggle />
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="ปิดเมนู"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="animate-pop absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="ปิดเมนู"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
            >
              ✕
            </button>
            <SidebarContent
              user={user}
              notifications={notifications}
              onNavigate={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex dark:border-zinc-800 dark:bg-zinc-950">
          <SidebarContent user={user} notifications={notifications} />
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1400px] p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
