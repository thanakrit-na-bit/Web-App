import { ThemeToggle } from "@/components/theme-toggle";
import { AuthForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <AuthForm />
    </main>
  );
}
