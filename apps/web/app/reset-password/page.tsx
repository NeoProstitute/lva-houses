import { Suspense } from "react";
import { AuthForm } from "../../components/auth-forms";
import { ResetPasswordClient } from "./reset-password-client";

export default function ResetPasswordPage() {
  return <Suspense fallback={<AuthForm mode="reset" />}><ResetPasswordClient /></Suspense>;
}
