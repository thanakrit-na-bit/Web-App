import Link from "next/link";
import { requireUser } from "@/utils/auth";
import { logoutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/machines", label: "เครื่องจักร (Machines)", icon: "⚙️" },
  { href: "/alarms", label: "Alarm", icon: "🚨" },
  { href: "/maintenance", label: "งานบำรุงรักษา", icon: "🔧" },
];

const navClass =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  const roleLabel =
    user.role === "admin" ? "Admin" : user.role === "viewer" ? "Viewer" : "Technician";
  const roleClass =
    user.role === "admin"
      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
      : user.role === "viewer"
        ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
        : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Alarm & Maintenance
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Management System
            </p>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={navClass}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          {user.role === "admin" && (
            <>
              <Link href="/admin/users" className={navClass}>
                <span>👥</span>
                ผู้ใช้งาน (Users)
              </Link>
              <Link href="/admin/audit" className={navClass}>
                <span>📜</span>
                Audit Log
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="mb-3">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {user.full_name ?? user.email}
            </p>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleClass}`}
            >
              {roleLabel}
            </span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden p-6">{children}</main>
    </div>
  );
}