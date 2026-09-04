"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiUrl } from "../lib/api";
import { withCsrfHeader } from "../lib/csrf";
import { presentationMode, signInForPresentation } from "../lib/presentation-demo";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

type Mode = "login" | "setup" | "forgot" | "reset";

async function send(path: string, body: unknown, extraHeaders: HeadersInit = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    credentials: "include",
    headers: withCsrfHeader(new Headers({ "content-type": "application/json", ...extraHeaders }), "POST"),
    body: JSON.stringify(body)
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error ?? "Please try again.");
  return payload;
}

export function AuthForm({ mode, resetToken }: { mode: Mode; resetToken?: string }) {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    try {
      if (mode === "login") {
        if (presentationMode) {
          const signedIn = signInForPresentation(String(fields.get("login") ?? ""), String(fields.get("password") ?? ""));
          if (!signedIn) throw new Error("Use one of the presentation accounts provided by the presenter.");
          window.location.assign("/portal");
          return;
        }
        await send("/api/v1/auth/login", { login: fields.get("login"), password: fields.get("password") });
        window.location.assign("/portal");
        return;
      }
      if (mode === "setup") {
        await send("/api/v1/auth/bootstrap", {
          schoolName: fields.get("schoolName"), name: fields.get("name"), username: fields.get("username"), email: fields.get("email"), password: fields.get("password")
        }, { "x-bootstrap-token": String(fields.get("bootstrapToken") ?? "") });
        window.location.assign("/portal");
        return;
      }
      if (mode === "forgot") {
        await send("/api/v1/auth/forgot-password", { email: fields.get("email") });
        setNotice("If that address belongs to an active account, a reset link has been sent.");
        return;
      }
      if (!resetToken) throw new Error("This reset link is invalid. Request a new one.");
      const password = String(fields.get("password") ?? "");
      if (password !== String(fields.get("passwordConfirmation") ?? "")) throw new Error("The passwords do not match.");
      await send("/api/v1/auth/reset-password", { token: resetToken, password });
      window.location.assign("/login");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const isSetup = mode === "setup";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";
  const invalidReset = isReset && !resetToken;
  const heading = isSetup ? "Create the school administrator" : isForgot ? "Reset your password" : isReset ? "Choose a new password" : "Enter your portal";
  const eyebrow = isSetup ? "First-time setup" : isForgot || isReset ? "Account recovery" : "Secure sign in";
  const buttonText = isSetup ? "Create administrator" : isForgot ? "Send reset link" : isReset ? "Save new password" : "Sign in";
  const description = isSetup
    ? "Create the first administrator account. Keep the one-time setup token in your school password manager."
    : isForgot
      ? "Enter the school email address linked to your account. If it is active, we will send a one-time reset link."
      : isReset
        ? "Use a new password that you do not use elsewhere."
        : "Sign in to recognise effort, see progress and keep every point meaningful.";
  return <main className="auth-layout">
    <section className="auth-aside"><div className="auth-aside-header"><Logo /><ThemeToggle /></div><div className="auth-copy"><p className="eyebrow">{isSetup ? "A safer beginning" : isForgot || isReset ? "Account recovery" : "Welcome back"}</p><h1>{isSetup ? "Set the tone for a fairer house system." : isForgot || isReset ? "Back in safely." : "Good to see you."}</h1><p>{description}</p></div><p className="aside-foot">Simple for people.<br />Reliable for the school.</p></section>
    <section className="auth-card-wrap"><form className="auth-card" onSubmit={submit}><Link className="back-link" href={isForgot || isReset ? "/login" : "/"}>← {isForgot || isReset ? "Back to sign in" : "Back to standings"}</Link><p className="eyebrow">{eyebrow}</p><h2>{heading}</h2>
      {isSetup ? <><label>School name<input required name="schoolName" autoComplete="organization" defaultValue="Leonardo V Academy Houses" /></label><label>Your name<input required name="name" autoComplete="name" placeholder="Your full name" /></label><label>Username<input required name="username" pattern="[a-z0-9][a-z0-9._-]{2,30}" autoComplete="username" defaultValue="admin" /></label><label>Email address<input required name="email" type="email" autoComplete="email" placeholder="name@school.edu" /></label><label>One-time setup token<input required name="bootstrapToken" type="password" autoComplete="off" /></label></> : isForgot ? <label>School email address<input required name="email" type="email" autoComplete="email" placeholder="name@school.edu" /></label> : isReset && !invalidReset ? <><label>New password<input required name="password" type="password" minLength={14} autoComplete="new-password" placeholder="At least 14 characters" /></label><label>Confirm new password<input required name="passwordConfirmation" type="password" minLength={14} autoComplete="new-password" placeholder="Repeat your new password" /></label></> : !isReset ? <><label>Email or username<input required name="login" autoComplete="username" placeholder="name@school.edu or admin" /></label><label>Password<input required name="password" type="password" minLength={14} autoComplete="current-password" placeholder="At least 14 characters" /></label></> : <p className="form-error" role="alert">This reset link is incomplete or invalid. Request a new link to continue.</p>}
      {error && <p role="alert" className="form-error">{error}</p>}{notice && <p role="status" className="form-note">{notice}</p>}{!invalidReset && <button className="button button-dark full-button" disabled={busy}>{busy ? "Please wait…" : buttonText} <span>→</span></button>}
      {mode === "login" && <p className="form-note"><Link className="auth-link" href="/forgot-password">Forgot your password?</Link><br />If you do not have an account, ask a school administrator.</p>}
      {isForgot && <p className="form-note">If you do not receive a message, check your spam folder or ask the school administrator to confirm that your account email is correct.</p>}
    </form></section>
  </main>;
}
