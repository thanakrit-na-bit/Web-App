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
import { Icon, type IconName } from "@/components/icon";

const navItems: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/machines", label: "เครื่องจักร (Machines)", icon: "machine" },
  { href: "/alarms", label: "Alarm", icon: "alarm" },
  { href: "/maintenance", label: "งานบำรุงรักษา", icon: "wrench" },
];

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  technician: "Technician",
  viewer: "Viewer",
};

const roleClasses: Record<Role, string> = {
  admin: "bg-accent-soft text-accent",
  technician:
    "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  viewer: "bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300",
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
      <div className="flex items-center justify-between gap-2 border-b border-line bg-sunken/50 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-ink shadow-[0_2px_12px_-2px_var(--accent-ring)]">
            <Icon name="machine" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Alarm &amp; Maintenance
            </h1>
            <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
              Management System
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <NotificationBell notifications={notifications} />
          <ThemeToggle />
        </div>
      </div>

      <nav className="scroll-slim flex-1 space-y-0.5 overflow-y-auto p-3" onClick={onNavigate}>
        <p className="nav-section pt-1">ภาพรวม</p>
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon}>
            {item.label}
          </NavLink>
        ))}
        {can(user.role, "manageUsers") && (
          <>
            <p className="nav-section pt-5">การจัดการ</p>
            <NavLink href="/admin/users" icon="users">
              ผู้ใช้งาน (Users)
            </NavLink>
            <NavLink href="/admin/audit" icon="audit">
              Audit Log
            </NavLink>
          </>
        )}
      </nav>

      <div className="border-t border-line p-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-xl border border-line bg-sunken p-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-ink">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {user.full_name ?? user.email}
            </p>
            <span
              className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ring-black/5 dark:ring-white/10 ${roleClasses[user.role]}`}
            >
              {roleLabels[user.role]}
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <Link
            href="/change-password"
            onClick={onNavigate}
            className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-line-strong hover:bg-sunken hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <Icon name="key" className="h-4 w-4" />
            เปลี่ยนรหัสผ่าน
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/25 px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:border-red-500/50 hover:bg-red-500/10 dark:text-red-400"
            >
              <Icon name="logout" className="h-4 w-4" />
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
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-surface/85 px-4 py-2.5 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="เปิดเมนู"
          className="btn btn-ghost h-9 w-9 px-0 py-0 text-zinc-600 dark:text-zinc-400"
        >
          <Icon name="menu" />
        </button>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-ink">
            <Icon name="machine" className="h-4 w-4" />
          </span>
          <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Alarm &amp; Maintenance
          </span>
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
            className="absolute inset-0 bg-scrim backdrop-blur-[2px]"
          />
          <aside className="animate-drawer panel absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col rounded-none border-y-0 border-l-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="ปิดเมนู"
              className="icon-btn absolute right-3 top-3.5 z-10 h-8 w-8"
            >
              <Icon name="close" className="h-4 w-4" />
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
        <aside className="sidebar sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line md:flex">
          <SidebarContent user={user} notifications={notifications} />
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1400px] p-4 md:p-6 md:py-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
