"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(() => setReady(true));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 px-4 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      {ready ? (
        <ResetPasswordForm />
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">กำลังโหลด...</p>
      )}
    </main>
  );
}