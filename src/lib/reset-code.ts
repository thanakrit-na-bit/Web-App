import { createHash } from "node:crypto";

/**
 * โค้ดรีเซ็ตรหัสผ่านไม่เก็บเป็นข้อความธรรมดาในฐานข้อมูล แต่เก็บเป็น hash SHA-256
 * ถ้าฐานข้อมูลรั่ว ก็เอาโค้ดไปรีเซ็ตรหัสผ่านไม่ได้ (ถูกต้องตามหลักแล้ว)
 *
 * ตั้งค่า `RESET_CODE_PEPPER` เป็นค่าลับเพิ่มได้ (ไม่บังคับ) เพื่อให้ถึง hash ที่โดนเดา
 * ล่วงหน้ามาแล้วก็ใช้ไม่ได้ เพราะ pepper ไม่ได้อยู่ในฐานข้อมูล
 */
function pepper(): string {
  return process.env.RESET_CODE_PEPPER ?? "";
}

export function hashResetCode(code: string): string {
  return createHash("sha256")
    .update(`${pepper()}${code.trim()}`)
    .digest("hex");
}
