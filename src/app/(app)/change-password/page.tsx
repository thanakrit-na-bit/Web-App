import { requireUser } from "@/utils/auth";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-md">
      <ChangePasswordForm />
    </div>
  );
}