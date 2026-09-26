"use client";

import { useActionState, useState } from "react";
import {
  loginAction,
  signupAction,
  requestPasswordResetAction,
} from "@/app/actions/auth";
import { Icon } from "@/components/icon";

type Mode = "login" | "signup" | "forgot";

const inputClass = "field";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [state, action, pending] = useActionState(
    mode === "login"
      ? loginAction
      : mode === "signup"
        ? signupAction
        : requestPasswordResetAction,
    undefined
  );

  const [knownEmails] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("known_emails") ?? "[]");
    } catch {
      return [];
    }
  });

  const isForgot = mode === "forgot";

  return (
    <div className="panel animate-rise w-full max-w-sm p-7">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white">
          <Icon name="machine" className="h-6 w-6" />
        </span>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Alarm &amp; Maintenance System
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {isForgot
            ? "รีเซ็ตรหัสผ่าน"
            : "ระบบจัดการ Alarm และงานบำรุงรักษา"}
        </p>
      </div>

      {!isForgot && (
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-line bg-sunken p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-surface text-zinc-900 shadow-sm dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-surface text-zinc-900 shadow-sm dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            สมัครสมาชิก
          </button>
        </div>
      )}

      <form action={action} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label
              htmlFor="full_name"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              ชื่อจริง
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="เช่น Somchai Jaidee"
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            อีเมล
          </label>
          {isForgot && knownEmails.length > 0 ? (
            <select
              id="email"
              name="email"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>
                — เลือกอีเมลที่ต้องการรีเซ็ต —
              </option>
              {knownEmails.map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className={inputClass}
            />
          )}
        </div>
        {!isForgot ? (
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              รหัสผ่าน
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
        ) : null}

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/60 dark:text-red-300">
            {state.error}
          </p>
        )}
        {state && !state.error && mode === "signup" && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/60 dark:text-green-300">
            ลงทะเบียนสำเร็จ — ตรวจสอบอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ
          </p>
        )}
        {state && !state.error && mode === "forgot" && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/60 dark:text-green-300">
            ส่งลิงก์รีเซ็ตไปที่อีเมลแล้ว — ตรวจสอบกล่องจดหมาย (รวม Spam)
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary w-full py-2.5"
        >
          {pending
            ? "กำลังดำเนินการ..."
            : mode === "login"
              ? "เข้าสู่ระบบ"
              : mode === "signup"
                ? "สมัครสมาชิก"
                : "ส่งลิงก์รีเซ็ต"}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        {isForgot ? (
          <button
            type="button"
            onClick={() => setMode("login")}
            className="font-medium text-accent hover:underline"
          >
            ← กลับไปเข้าสู่ระบบ
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMode("forgot")}
            className="font-medium text-accent hover:underline"
          >
            ลืมรหัสผ่าน?
          </button>
        )}
      </div>

      {!isForgot && (
        <p className="mt-6 border-t border-line pt-4 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
          User แรกที่ลงทะเบียนจะได้สิทธิ์เป็น Admin โดยอัตโนมัติ
        </p>
      )}
    </div>
  );
}