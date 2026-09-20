"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole } from "@/app/actions/users";
import type { Role } from "@/lib/types";

export function RoleSelect({
  userId,
  role,
}: {
  userId: string;
  role: Role;
}) {
  const [selected, setSelected] = useState<Role>(role);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(next: Role) {
    setSelected(next);
    setMessage("");
    startTransition(async () => {
      const result = await updateUserRole(userId, next);
      if (result?.error) {
        setMessage(result.error);
      } else {
        setMessage("บันทึกแล้ว");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as Role)}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 disabled:opacity-60"
      >
        <option value="technician">Technician</option>
        <option value="admin">Admin</option>
      </select>
      {message && (
        <span
          className={`text-xs ${
            message === "บันทึกแล้ว" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
}