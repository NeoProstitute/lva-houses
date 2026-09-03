"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiUrl } from "../lib/api";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

type Mode = "login" | "setup";

async function send(path: string, body: unknown, extraHeaders: HeadersInit = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json", ...extraHeaders },
    body: JSON.stringify(body)
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error ?? "Please try again.");
  return payload;
}

export function AuthForm({ mode }: { mode: Mode }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    try {
      if (mode === "login") {
        await send("/api/v1/auth/login", { login: fields.get("login"), password: fields.get("password") });
      } else {
        await send("/api/v1/auth/bootstrap", {
          schoolName: fields.get("schoolName"), name: fields.get("name"), username: fields.get("username"), email: fields.get("email"), password: fields.get("password")
        }, { "x-bootstrap-token": String(fields.get("bootstrapToken") ?? "") });
      }
      window.location.assign("/portal");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const isSetup = mode === "setup";
  return <main className="auth-layout">
    <section className="auth-aside"><div className="auth-aside-header"><Logo /><ThemeToggle /></div><div className="auth-copy"><p className="eyebrow">{isSetup ? "A safer beginning" : "Welcome back"}</p><h1>{isSetup ? "Set the tone for a fairer house system." : "Good to see you."}</h1><p>{isSetup ? "Create the first administrator account. Keep the one-time setup token in your school password manager." : "Sign in to recognise effort, see progress and keep every point meaningful."}</p></div><p className="aside-foot">Simple for people.<br />Reliable for the school.</p></section>
    <section className="auth-card-wrap"><form className="auth-card" onSubmit={submit}><Link className="back-link" href="/">← Back to standings</Link><p className="eyebrow">{isSetup ? "First-time setup" : "Secure sign in"}</p><h2>{isSetup ? "Create the school administrator" : "Enter your portal"}</h2>
      {isSetup ? <><label>School name<input required name="schoolName" autoComplete="organization" defaultValue="Leonardo V Academy Houses" /></label><label>Your name<input required name="name" autoComplete="name" placeholder="Your full name" /></label><label>Username<input required name="username" pattern="[a-z0-9][a-z0-9._-]{2,30}" autoComplete="username" defaultValue="admin" /></label><label>Email address<input required name="email" type="email" autoComplete="email" placeholder="name@school.edu" /></label><label>One-time setup token<input required name="bootstrapToken" type="password" autoComplete="off" /></label></> : <label>Email or username<input required name="login" autoComplete="username" placeholder="name@school.edu or admin" /></label>}
      <label>Password<input required name="password" type="password" minLength={14} autoComplete={isSetup ? "new-password" : "current-password"} placeholder="At least 14 characters" /></label>
      {error && <p role="alert" className="form-error">{error}</p>}<button className="button button-dark full-button" disabled={busy}>{busy ? "Please wait…" : isSetup ? "Create administrator" : "Sign in"} <span>→</span></button>
      {!isSetup && <p className="form-note">If you do not have an account, ask a school administrator.</p>}
    </form></section>
  </main>;
}
