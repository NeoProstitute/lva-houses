"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiUrl } from "../lib/api";
import { withCsrfHeader } from "../lib/csrf";
import { presentationMode, presentationPath, signInForPresentation } from "../lib/presentation-demo";
import { Logo } from "./logo";
import { LanguageToggle } from "./language-toggle";
import { localizeApiMessage, useLanguage } from "./language-provider";
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
  if (!response.ok) throw new Error(localizeApiMessage(payload?.error ?? "Please try again."));
  return payload;
}

export function AuthForm({ mode, resetToken }: { mode: Mode; resetToken?: string }) {
  const { text, language } = useLanguage();
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
          if (!signedIn) throw new Error(language === "cs" ? "Použijte některý z ukázkových účtů uvedených v návodu." : "Use one of the presentation accounts provided by the presenter.");
          window.location.assign(presentationPath("/portal"));
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
        setNotice(language === "cs" ? "Pokud adresa patří k aktivnímu účtu, byl odeslán odkaz pro obnovu hesla." : "If that address belongs to an active account, a reset link has been sent.");
        return;
      }
      if (!resetToken) throw new Error(language === "cs" ? "Odkaz pro obnovu hesla je neplatný. Vyžádejte si nový." : "This reset link is invalid. Request a new one.");
      const password = String(fields.get("password") ?? "");
      if (password !== String(fields.get("passwordConfirmation") ?? "")) throw new Error(language === "cs" ? "Zadaná hesla se neshodují." : "The passwords do not match.");
      await send("/api/v1/auth/reset-password", { token: resetToken, password });
      window.location.assign("/login");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text.tryAgain);
    } finally {
      setBusy(false);
    }
  }

  const isSetup = mode === "setup";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";
  const invalidReset = isReset && !resetToken;
  const heading = isSetup ? text.createSchoolAdmin : isForgot ? text.resetPassword : isReset ? text.choosePassword : text.enterPortal;
  const eyebrow = isSetup ? text.firstSetup : isForgot || isReset ? text.accountRecovery : text.portalSignIn;
  const buttonText = isSetup ? text.createAdmin : isForgot ? text.sendResetLink : isReset ? text.savePassword : text.signIn;
  const description = isSetup
    ? text.setupDescription
    : isForgot
      ? text.forgotDescription
      : isReset
        ? text.newPasswordDescription
        : text.loginDescription;
  return <main className="auth-layout">
    <section className="auth-aside"><div className="auth-aside-header"><Logo /><div className="header-controls"><LanguageToggle /><ThemeToggle /></div></div><div className="auth-copy"><p className="eyebrow">{isSetup ? text.saferBeginning : isForgot || isReset ? text.accountRecovery : text.welcomeBack}</p><h1>{isSetup ? text.setupTone : isForgot || isReset ? text.backSafely : text.goodToSeeYou}</h1><p>{description}</p></div><p className="aside-foot">{text.simplePeople}<br />{text.reliableSchool}</p></section>
    <section className="auth-card-wrap"><form className="auth-card" onSubmit={submit}><Link className="back-link" href={isForgot || isReset ? "/login" : "/"}>← {isForgot || isReset ? text.backToSignIn : text.backToStandings}</Link><p className="eyebrow">{eyebrow}</p><h2>{heading}</h2>
      {isSetup ? <><label>{text.schoolName}<input required name="schoolName" autoComplete="organization" defaultValue="Leonardo V Academy Houses" /></label><label>{text.yourName}<input required name="name" autoComplete="name" placeholder={text.fullName} /></label><label>{text.username}<input required name="username" pattern="[a-z0-9][a-z0-9._-]{2,30}" autoComplete="username" defaultValue="admin" /></label><label>{text.emailAddress}<input required name="email" type="email" autoComplete="email" placeholder="name@school.edu" /></label><label>{text.setupToken}<input required name="bootstrapToken" type="password" autoComplete="off" /></label></> : isForgot ? <label>{text.schoolEmail}<input required name="email" type="email" autoComplete="email" placeholder="name@school.edu" /></label> : isReset && !invalidReset ? <><label>{text.newPassword}<input required name="password" type="password" minLength={14} autoComplete="new-password" placeholder={text.atLeast14} /></label><label>{text.confirmPassword}<input required name="passwordConfirmation" type="password" minLength={14} autoComplete="new-password" placeholder={text.repeatPassword} /></label></> : !isReset ? <><label>{text.emailOrUsername}<input required name="login" autoComplete="username" placeholder="name@school.edu or admin" /></label><label>{text.password}<input required name="password" type="password" minLength={14} autoComplete="current-password" placeholder={text.atLeast14} /></label></> : <p className="form-error" role="alert">{text.invalidReset}</p>}
      {error && <p role="alert" className="form-error">{error}</p>}{notice && <p role="status" className="form-note">{notice}</p>}{!invalidReset && <button className="button button-dark full-button" disabled={busy}>{busy ? text.pleaseWait : buttonText} <span>→</span></button>}
      {mode === "login" && <p className="form-note"><Link className="auth-link" href="/forgot-password">{text.forgotPassword}</Link><br />{text.noAccount}</p>}
      {isForgot && <p className="form-note">{text.spamHint}</p>}
    </form></section>
  </main>;
}
