"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export const EMAIL_STORAGE_KEY = "known_emails";

export function RememberEmail() {
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.email) return;

        const emails = new Set<string>(
          JSON.parse(localStorage.getItem(EMAIL_STORAGE_KEY) ?? "[]")
        );
        emails.add(user.email);
        localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify([...emails]));
      } catch {
        // ignore
      }
    })();
  }, []);

  return null;
}