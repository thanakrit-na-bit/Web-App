"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * จับ error ระดับทั้งเว็บ (รวมตัว root layout)
 * ต้องวาด <html> / <body> เอง และไม่มี global styles ของแอป
 * จึงใช้สีพื้นฐานของระบบแทนชุด design system
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error.message, "digest:", error.digest);
  }, [error]);

  return (
    <html lang="th">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', 'Noto Sans Thai', sans-serif",
          background: "#fafafa",
          color: "#18181b",
        }}
      >
        <div style={{ maxWidth: 480, padding: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            ระบบมีปัญหาชั่วคราว
          </h1>
          <p style={{ fontSize: 14, color: "#52525b", marginTop: 8 }}>
            หน้านี้โหลดไม่สำเร็จ กดลองใหม่อีกครั้ง หรือกลับไปหน้าแรก
          </p>
          {error.digest ? (
            <p style={{ fontSize: 12, color: "#a1a1aa", marginTop: 12 }}>
              รหัสอ้างอิง: {error.digest}
            </p>
          ) : null}
          <div
            style={{
              marginTop: 20,
              display: "flex",
              gap: 8,
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={() => retry()}
              style={{
                fontSize: 14,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #18181b",
                background: "#18181b",
                color: "#fafafa",
                cursor: "pointer",
              }}
            >
              ลองใหม่
            </button>
            <Link
              href="/login"
              style={{
                fontSize: 14,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #d4d4d8",
                color: "#18181b",
                textDecoration: "none",
              }}
            >
              ไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
