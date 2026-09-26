"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      }`}
    >
      <span
        aria-hidden
        className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-600 transition-all dark:bg-blue-400 ${
          active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
        }`}
      />
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base transition ${
          active
            ? "bg-blue-100 text-blue-700 dark:bg-blue-800/60 dark:text-blue-200"
            : "bg-zinc-100 text-zinc-500 group-hover:bg-white dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-700"
        }`}
      >
        {icon}
      </span>
      <span className="flex-1 truncate">{children}</span>
    </Link>
  );
}