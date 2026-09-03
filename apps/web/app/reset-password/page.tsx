import { AuthForm } from "../../components/auth-forms";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <AuthForm mode="reset" resetToken={token} />;
}
