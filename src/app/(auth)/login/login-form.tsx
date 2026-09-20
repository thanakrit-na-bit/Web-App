"use client";

import { useActionState, useState } from "react";
import { loginAction, signupAction } from "@/app/actions/auth";

type Mode = "login" | "signup";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [state, action, pending] = useActionState(
    mode === "login" ? loginAction : signupAction,
    undefined
  );

  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-zinc-900">
          Alarm & Maintenance System
        </h1>
        <p className="mt-1 text-sm text-zinc-500">ระบบจัดการ Alarm และงานบำรุงรักษา</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-md py-2 text-sm font-medium transition ${
            mode === "login"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          เข้าสู่ระบบ
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-md py-2 text-sm font-medium transition ${
            mode === "signup"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          สมัครสมาชิก
        </button>
      </div>

      <form action={action} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label
              htmlFor="full_name"
              className="mb-1 block text-sm font-medium text-zinc-700"
            >
              ชื่อจริง
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="เช่น Somchai Jaidee"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        )}
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-zinc-700"
          >
            อีเมล
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-zinc-700"
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
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {state.error}
          </p>
        )}
        {state && !state.error && mode === "signup" && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            ลงทะเบียนสำเร็จ — ตรวจสอบอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ
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
              : "สมัครสมาชิก"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-zinc-400">
        User แรกที่ลงทะเบียนจะได้สิทธิ์เป็น Admin โดยอัตโนมัติ
      </p>
    </div>
  );
}