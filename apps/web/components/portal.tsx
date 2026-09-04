"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { apiUrl, type House } from "../lib/api";
import { withCsrfHeader } from "../lib/csrf";
import { presentationMode, presentationResponse, signOutForPresentation } from "../lib/presentation-demo";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

type User = { id: string; name: string; role: "student" | "teacher" | "admin"; houseId: string | null };
type Award = { id: string; points: number; reason: string; createdAt: string; categoryName: string; studentName: string; awardedByName: string; houseName: string; houseColor: string; reversalOf: string | null };
type Category = { id: string; name: string; maxPoints: number };
type CategorySummary = { id: string; name: string; totalPoints: number; awardCount: number };
type Student = { id: string; name: string; houseId: string; houseName: string; houseColor: string };
type AdminUser = { id: string; name: string; username: string; email: string; role: "student" | "teacher" | "admin"; houseId: string | null; houseName: string | null; isActive: boolean };
type AdminCategory = Category & { isActive: boolean };

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  if (presentationMode) return presentationResponse(path) as T;
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !isFormData && !headers.has("content-type")) headers.set("content-type", "application/json");
  withCsrfHeader(headers, options.method);
  let response = await fetch(`${apiUrl}${path}`, { ...options, headers, credentials: "include" });
  if (response.status === 401 && retry) {
    const refreshHeaders = withCsrfHeader(new Headers(), "POST");
    const refreshed = await fetch(`${apiUrl}/api/v1/auth/refresh`, { method: "POST", headers: refreshHeaders, credentials: "include" });
    if (refreshed.ok) response = await fetch(`${apiUrl}${path}`, { ...options, headers, credentials: "include" });
  }
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? "We could not complete that request.");
  return body as T;
}

function AwardList({ awards }: { awards: Award[] }) {
  if (!awards.length) return <p className="muted-block">No points have been recorded yet.</p>;
  return <div className="award-list">{awards.map((award) => <article key={award.id} className="award-row"><span className="award-points">{award.points > 0 ? "+" : ""}{award.points}</span><div><h3>{award.categoryName}</h3><p>{award.reason} · {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(award.createdAt))}</p></div><span className="award-context">{award.studentName} · {award.houseName}</span></article>)}</div>;
}

function StudentProgress({ categories }: { categories: CategorySummary[] }) {
  const hasProgress = categories.some((category) => category.awardCount > 0);
  const strongest = hasProgress ? categories[0] : null;
  const focus = hasProgress ? categories[categories.length - 1] : null;
  return <section className="student-progress"><div className="section-heading"><div><p className="eyebrow">Your category overview</p><h2>Where you shine — and what to build next.</h2></div><span className="updated">Learning · behaviour · projects · participation</span></div>
    <div className="progress-layout"><div className="category-list">{categories.map((category) => <article className="category-row" key={category.id}><div><h3>{category.name}</h3><p>{category.awardCount ? `${category.awardCount} ${category.awardCount === 1 ? "achievement" : "achievements"}` : "No achievements recorded yet"}</p></div><strong>{category.totalPoints > 0 ? "+" : ""}{category.totalPoints}<small> pts</small></strong></article>)}</div>
      <aside className="progress-notes">{strongest && focus ? <><div><span>Your strongest category</span><strong>{strongest.name}</strong><p>{strongest.totalPoints.toLocaleString("en-US")} points across {strongest.awardCount} achievements.</p></div><div><span>Next opportunity</span><strong>{focus.name}</strong><p>There is room here for your next contribution.</p></div></> : <div><span>Ready when you are</span><strong>Your first achievement is next.</strong><p>As points are awarded, this page will show your strongest categories and where to focus.</p></div>}</aside>
    </div>
  </section>;
}

function TeacherComposer({ onAwarded }: { onAwarded: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { Promise.all([request<{ categories: Category[] }>("/api/v1/categories"), request<{ students: Student[] }>("/api/v1/students")]).then(([cats, pupils]) => { setCategories(cats.categories); setStudents(pupils.students); }).catch((error: Error) => setMessage(error.message)); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setBusy(true);
    const fields = new FormData(event.currentTarget);
    try { await request("/api/v1/awards", { method: "POST", body: JSON.stringify({ studentId: fields.get("studentId"), categoryId: fields.get("categoryId"), points: fields.get("points"), reason: fields.get("reason") }) }); event.currentTarget.reset(); setMessage("Points awarded. The ledger and standings are up to date."); onAwarded(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); } finally { setBusy(false); }
  }
  return <section className="composer"><div><p className="eyebrow">Recognition</p><h2>Award points</h2><p>Choose a student, name what they did, and keep the reason specific.</p></div><form onSubmit={submit}><label>Student<select required name="studentId" defaultValue=""><option disabled value="">Choose a student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} — {student.houseName}</option>)}</select></label><label>Category<select required name="categoryId" defaultValue=""><option disabled value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name} · up to {category.maxPoints}</option>)}</select></label><label>Points<input required name="points" type="number" min="1" max="10000" placeholder="10" /></label><label className="wide-label">Reason<textarea required name="reason" minLength={3} maxLength={500} placeholder="What should this student be recognised for?" /></label><button disabled={busy} className="button button-accent">{busy ? "Saving…" : "Award points"} <span>→</span></button>{message && <p className="inline-message" aria-live="polite">{message}</p>}</form></section>;
}

function AdminPanel({ houses, refresh }: { houses: House[]; refresh: () => void }) {
  const [tab, setTab] = useState<"people" | "houses" | "categories">("people");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadAdministration() {
    try {
      const [people, cats] = await Promise.all([request<{ users: AdminUser[] }>("/api/v1/admin/users"), request<{ categories: AdminCategory[] }>("/api/v1/admin/categories")]);
      setUsers(people.users); setCategories(cats.categories);
    } catch (error) { setMessage(error instanceof Error ? error.message : "We could not load administration."); }
  }

  useEffect(() => { void loadAdministration(); }, []);

  async function perform(action: () => Promise<void>, successMessage: string) {
    setBusy(true); setMessage("");
    try { await action(); await loadAdministration(); refresh(); setMessage(successMessage); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const password = String(form.get("password") ?? "");
    const body = {
      name: form.get("name"), username: form.get("username"), email: form.get("email"), role: form.get("role"), houseId: form.get("houseId") || null,
      ...(password ? { password } : {})
    };
    const selected = editingUser;
    await perform(async () => {
      await request(selected ? `/api/v1/admin/users/${selected.id}` : "/api/v1/admin/users", { method: selected ? "PATCH" : "POST", body: JSON.stringify(body) });
      setEditingUser(null); formElement.reset();
    }, selected ? "Account updated." : "Account created.");
  }

  async function saveHouse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const selected = editingHouse;
    await perform(async () => {
      await request(selected ? `/api/v1/admin/houses/${selected.id}` : "/api/v1/admin/houses", { method: selected ? "PATCH" : "POST", body: JSON.stringify({ name: form.get("name"), color: form.get("color"), meaning: form.get("meaning"), symbol: form.get("symbol"), description: form.get("description") }) });
      setEditingHouse(null); formElement.reset();
    }, selected ? "House updated." : "House created.");
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const selected = editingCategory;
    const body = selected
      ? { name: form.get("name"), maxPoints: form.get("maxPoints"), isActive: form.get("isActive") === "on" }
      : { name: form.get("name"), maxPoints: form.get("maxPoints") };
    await perform(async () => {
      await request(selected ? `/api/v1/admin/categories/${selected.id}` : "/api/v1/admin/categories", { method: selected ? "PATCH" : "POST", body: JSON.stringify(body) });
      setEditingCategory(null); formElement.reset();
    }, selected ? "Category updated." : "Category created.");
  }

  async function setAccountStatus(person: AdminUser) {
    await perform(() => request(`/api/v1/admin/users/${person.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !person.isActive }) }), person.isActive ? "Account deactivated." : "Account activated.");
  }

  async function uploadHouseImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const fields = new FormData(event.currentTarget);
    const houseId = String(fields.get("houseId") ?? "");
    const image = fields.get("image");
    if (!houseId || !(image instanceof File) || image.size === 0) { setMessage("Choose a house and image first."); return; }
    const body = new FormData(); body.append("image", image);
    try { await request(`/api/v1/admin/houses/${houseId}/media`, { method: "POST", body }); event.currentTarget.reset(); setMessage("House image updated."); refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
  }
  return <section className="admin-panel"><div className="section-heading"><div><p className="eyebrow">School controls</p><h2>Keep the system fair</h2></div></div><div className="tab-row" role="tablist" aria-label="Administration"><button className={tab === "people" ? "active" : ""} onClick={() => setTab("people")} role="tab" aria-selected={tab === "people"}>People</button><button className={tab === "houses" ? "active" : ""} onClick={() => setTab("houses")} role="tab" aria-selected={tab === "houses"}>Houses</button><button className={tab === "categories" ? "active" : ""} onClick={() => setTab("categories")} role="tab" aria-selected={tab === "categories"}>Categories</button></div>
    {tab === "people" && <div className="admin-grid"><div className="data-list">{users.map((person) => <article className="admin-list-item" key={person.id}><div><strong>{person.name}</strong><span>{person.username} · {person.role} · {person.houseName ?? "No house"} · {person.isActive ? "active" : "inactive"}</span></div><div className="admin-item-actions"><button type="button" onClick={() => setEditingUser(person)}>Edit</button><button type="button" disabled={busy} onClick={() => void setAccountStatus(person)}>{person.isActive ? "Deactivate" : "Activate"}</button></div></article>)}</div><form key={editingUser?.id ?? "new-user"} className="compact-form" onSubmit={saveUser}><h3>{editingUser ? "Edit account" : "Add an account"}</h3><input name="name" required defaultValue={editingUser?.name} placeholder="Full name" /><input name="username" required defaultValue={editingUser?.username} pattern="[a-z0-9][a-z0-9._-]{2,30}" autoComplete="username" placeholder="Username" /><input name="email" required defaultValue={editingUser?.email} type="email" placeholder="name@school.edu" /><input name="password" type="password" minLength={14} placeholder={editingUser ? "New password (optional)" : "Temporary password"} required={!editingUser} /><select name="role" defaultValue={editingUser?.role ?? "student"}><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Administrator</option></select><select name="houseId" defaultValue={editingUser?.houseId ?? ""}><option value="">No house / choose for student</option>{houses.map((house) => <option key={house.id} value={house.id}>{house.name}</option>)}</select><div className="form-actions">{editingUser && <button type="button" className="secondary-action" onClick={() => setEditingUser(null)}>Cancel</button>}<button disabled={busy} className="button button-dark">{editingUser ? "Save account" : "Create account"} <span>→</span></button></div></form></div>}
    {tab === "houses" && <div className="admin-grid"><div className="data-list">{houses.map((house) => <article className="admin-list-item" key={house.id}><div><strong><i style={{ background: house.color }} />{house.name}</strong><span>{house.meaning || "House"} · {house.totalPoints.toLocaleString("en-US")} points · {house.studentCount} members</span></div><div className="admin-item-actions"><button type="button" onClick={() => setEditingHouse(house)}>Edit</button></div></article>)}</div><div><form key={editingHouse?.id ?? "new-house"} className="compact-form" onSubmit={saveHouse}><h3>{editingHouse ? "Edit house" : "Add a house"}</h3><input name="name" required defaultValue={editingHouse?.name} placeholder="House name" /><input name="meaning" defaultValue={editingHouse?.meaning} placeholder="Meaning, e.g. Curiosity" /><input name="symbol" defaultValue={editingHouse?.symbol} placeholder="Symbol, e.g. Set of keys" /><textarea name="description" defaultValue={editingHouse?.description} placeholder="What this house stands for" maxLength={500} /><input name="color" required defaultValue={editingHouse?.color} pattern="^#[0-9A-Fa-f]{6}$" placeholder="#5B5CE2" /><div className="form-actions">{editingHouse && <button type="button" className="secondary-action" onClick={() => setEditingHouse(null)}>Cancel</button>}<button disabled={busy} className="button button-dark">{editingHouse ? "Save house" : "Create house"} <span>→</span></button></div></form><form className="compact-form" onSubmit={uploadHouseImage}><h3>House image</h3><select name="houseId" required defaultValue=""><option value="" disabled>Choose a house</option>{houses.map((house) => <option key={house.id} value={house.id}>{house.name}</option>)}</select><input name="image" required type="file" accept="image/png,image/jpeg,image/webp" /><p className="form-note">PNG, JPEG or WebP · up to 2 MB</p><button className="button button-dark">Upload image <span>→</span></button></form></div></div>}
    {tab === "categories" && <div className="admin-grid"><div className="data-list">{categories.map((category) => <article className="admin-list-item" key={category.id}><div><strong>{category.name}</strong><span>Maximum {category.maxPoints.toLocaleString("en-US")} points per award · {category.isActive ? "active" : "inactive"}</span></div><div className="admin-item-actions"><button type="button" onClick={() => setEditingCategory(category)}>Edit</button></div></article>)}</div><form key={editingCategory?.id ?? "new-category"} className="compact-form" onSubmit={saveCategory}><h3>{editingCategory ? "Edit category" : "Add a category"}</h3><input name="name" required defaultValue={editingCategory?.name} placeholder="e.g. Leadership" /><input name="maxPoints" required defaultValue={editingCategory?.maxPoints} type="number" min="1" max="10000" placeholder="Maximum points" />{editingCategory && <label className="checkbox-label"><input name="isActive" type="checkbox" defaultChecked={editingCategory.isActive} /> Active and available for awards</label>}<div className="form-actions">{editingCategory && <button type="button" className="secondary-action" onClick={() => setEditingCategory(null)}>Cancel</button>}<button disabled={busy} className="button button-dark">{editingCategory ? "Save category" : "Create category"} <span>→</span></button></div></form></div>}
    {message && <p className="inline-message" aria-live="polite">{message}</p>}</section>;
}

export function Portal() {
  const [user, setUser] = useState<User | null>(null);
  const [awards, setAwards] = useState<Award[]>([]);
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [houses, setHouses] = useState<House[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    try {
      const [session, ledger, board] = await Promise.all([request<{ user: User }>("/api/v1/auth/me"), request<{ awards: Award[]; totalPoints: number; categorySummary: CategorySummary[] }>("/api/v1/awards/mine"), request<{ houses: House[] }>("/api/v1/houses/leaderboard")]);
      setUser(session.user); setAwards(ledger.awards); setTotal(ledger.totalPoints); setCategorySummary(ledger.categorySummary); setHouses(board.houses); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Please sign in again."); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function signOut() { if (presentationMode) signOutForPresentation(); else await request("/api/v1/auth/logout", { method: "POST" }, false).catch(() => undefined); window.location.assign("/"); }
  if (loading) return <main className="loading-screen"><Logo /><p>Opening your portal…</p></main>;
  if (!user) return <main className="loading-screen"><Logo /><h1>Session needed</h1><p>{error}</p><Link className="button button-dark" href="/login">Sign in <span>→</span></Link></main>;
  const roleCopy = user.role === "student" ? "Your contribution, made visible." : user.role === "teacher" ? "Make recognition feel timely and specific." : "A clear system needs thoughtful stewardship.";
  const hasCategoryProgress = categorySummary.some((category) => category.awardCount > 0);
  const strongestCategory = hasCategoryProgress ? categorySummary[0] : null;
  const focusCategory = hasCategoryProgress ? categorySummary[categorySummary.length - 1] : null;
  return <main className="portal"><header className="portal-header"><Logo /><div className="portal-actions"><ThemeToggle /><span className={`role role-${user.role}`}>{user.role}</span><button className="signout" onClick={signOut}>Sign out</button></div></header>{presentationMode && <p className="form-note">Local presentation mode — illustrative data only.</p>}<section className="portal-intro"><div><p className="eyebrow">Hello, {user.name.split(" ")[0]}</p><h1>{roleCopy}</h1></div><p>{user.role === "student" ? "Your points and the reasons behind them are all here." : "Your actions are recorded clearly, so the whole school can trust the system."}</p></section>
    <section className="quick-stats">{user.role === "student" ? <><div><span>Your points</span><strong>{total.toLocaleString("en-US")}</strong><small>points to date</small></div><div><span>Strongest category</span><strong>{strongestCategory?.name ?? "—"}</strong><small>{strongestCategory ? `${strongestCategory.totalPoints.toLocaleString("en-US")} points` : "Your progress will appear here"}</small></div><div><span>Next opportunity</span><strong>{focusCategory?.name ?? "—"}</strong><small>{focusCategory ? "A category to keep building" : "Every contribution counts"}</small></div></> : <><div><span>{user.role === "teacher" ? "Awards given" : "Ledger entries"}</span><strong>{awards.length.toLocaleString("en-US")}</strong><small>in the latest 100 entries</small></div><div><span>Leading house</span><strong>{houses[0]?.name ?? "—"}</strong><small>{houses[0] ? `${houses[0].totalPoints.toLocaleString("en-US")} points` : "No points yet"}</small></div><div><span>Built for</span><strong>{user.role === "teacher" ? "Recognition" : "Stewardship"}</strong><small>Clear roles, clear records</small></div></>}</section>
    {(user.role === "teacher" || user.role === "admin") && <TeacherComposer onAwarded={load} />}
    {user.role === "student" && <StudentProgress categories={categorySummary} />}
    <section className="ledger-section"><div className="section-heading"><div><p className="eyebrow">{user.role === "student" ? "Your achievements" : "Recent activity"}</p><h2>{user.role === "student" ? "The story behind your points" : "Points ledger"}</h2></div><span className="updated">Every change is recorded</span></div><AwardList awards={awards} /></section>
    {user.role === "admin" && <AdminPanel houses={houses} refresh={load} />}
  </main>;
}
