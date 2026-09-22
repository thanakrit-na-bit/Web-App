"use client";

import { useActionState, useState } from "react";
import {
  loginAction,
  signupAction,
  requestPasswordResetAction,
} from "@/app/actions/auth";

type Mode = "login" | "signup" | "forgot";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-900";

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

  const isForgot = mode === "forgot";

  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Alarm & Maintenance System
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {isForgot
            ? "รีเซ็ตรหัสผ่าน"
            : "ระบบจัดการ Alarm และงานบำรุงรักษา"}
        </p>
      </div>

      {!isForgot && (
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-md py-2 text-sm font-medium transition ${
              mode === "login"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-md py-2 text-sm font-medium transition ${
              mode === "signup"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
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
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className={inputClass}
          />
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
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/40 dark:text-red-300">
            {state.error}
          </p>
        )}
        {state && !state.error && mode === "signup" && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/40 dark:text-green-300">
            ลงทะเบียนสำเร็จ — ตรวจสอบอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ
          </p>
        )}
        {state && !state.error && mode === "forgot" && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/40 dark:text-green-300">
            ส่งลิงก์รีเซ็ตไปที่อีเมลแล้ว — ตรวจสอบกล่องจดหมาย (รวม Spam)
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            ← กลับไปเข้าสู่ระบบ
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMode("forgot")}
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            ลืมรหัสผ่าน?
          </button>
        )}
      </div>

      {!isForgot && (
        <p className="mt-5 text-center text-xs text-zinc-400 dark:text-zinc-500">
          User แรกที่ลงทะเบียนจะได้สิทธิ์เป็น Admin โดยอัตโนมัติ
        </p>
      )}
    </div>
  );
}