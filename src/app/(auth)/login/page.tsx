import { ThemeToggle } from "@/components/theme-toggle";
import { AuthForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 px-4 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <AuthForm />
    </main>
  );
}