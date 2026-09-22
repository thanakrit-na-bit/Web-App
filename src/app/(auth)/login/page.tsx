import { ThemeToggle } from "@/components/theme-toggle";
import { AuthForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 px-4 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-200/60 blur-3xl dark:bg-blue-900/20" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-200/60 blur-3xl dark:bg-indigo-900/20" />
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <AuthForm />
    </main>
  );
}