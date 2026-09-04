"use client";

import { useSearchParams } from "next/navigation";
import { AuthForm } from "../../components/auth-forms";

export function ResetPasswordClient() {
  return <AuthForm mode="reset" resetToken={useSearchParams().get("token") ?? undefined} />;
}
