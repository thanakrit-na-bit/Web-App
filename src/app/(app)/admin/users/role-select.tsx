"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole } from "@/app/actions/users";
import type { Role } from "@/lib/types";
import { ROLES } from "@/lib/types";

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
          className="field w-auto py-1.5 disabled:opacity-60"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r === "admin" ? "Admin" : r === "technician" ? "Technician" : "Viewer"}
            </option>
          ))}
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