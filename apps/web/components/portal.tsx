"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiUrl, type House } from "../lib/api";
import { withCsrfHeader } from "../lib/csrf";
import { presentationMode, presentationPath, presentationResponse, resetPresentationDemo, signOutForPresentation } from "../lib/presentation-demo";
import { Logo } from "./logo";
import { LanguageToggle } from "./language-toggle";
import { localizeApiMessage, useLanguage } from "./language-provider";
import { ThemeToggle } from "./theme-toggle";

type User = { id: string; name: string; role: "student" | "teacher" | "admin"; houseId: string | null };
type Award = { id: string; points: number; reason: string; createdAt: string; categoryName: string; studentName: string; awardedByName: string; houseName: string; houseColor: string; reversalOf: string | null };
type Category = { id: string; name: string; maxPoints: number };
type CategorySummary = { id: string; name: string; totalPoints: number; awardCount: number };
type Student = { id: string; name: string; houseId: string; houseName: string; houseColor: string };
type AdminUser = { id: string; name: string; username: string; email: string; role: "student" | "teacher" | "admin"; houseId: string | null; houseName: string | null; isActive: boolean };
type AdminCategory = Category & { isActive: boolean };

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  if (presentationMode) return presentationResponse(path, options) as T;
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
  if (!response.ok) throw new Error(localizeApiMessage(body?.error ?? "We could not complete that request."));
  return body as T;
}

function AwardList({ awards, onUndo }: { awards: Award[]; onUndo?: (award: Award) => void }) {
  const { text, locale, translateBuiltin } = useLanguage();
  if (!awards.length) return <p className="muted-block">{text.noPointsRecorded}</p>;
  const reversedAwardIds = new Set(awards.flatMap((award) => award.reversalOf ? [award.reversalOf] : []));
  return <div className="award-list">{awards.map((award) => <article key={award.id} className="award-row"><span className="award-points">{award.points > 0 ? "+" : ""}{award.points}</span><div><h3>{translateBuiltin(award.categoryName)}</h3><p>{translateBuiltin(award.reason)} · {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(award.createdAt))}</p></div><span className="award-context">{award.studentName} · {award.houseName}</span>{onUndo && award.points > 0 && !reversedAwardIds.has(award.id) && <button type="button" className="award-undo" onClick={() => onUndo(award)}>{text.undo}</button>}</article>)}</div>;
}

function StudentProgress({ categories }: { categories: CategorySummary[] }) {
  const { text, translateBuiltin, formatPoints, formatAchievements } = useLanguage();
  const hasProgress = categories.some((category) => category.awardCount > 0);
  const strongest = hasProgress ? categories[0] : null;
  const focus = hasProgress ? categories[categories.length - 1] : null;
  return <section className="student-progress"><div className="section-heading"><div><p className="eyebrow">{text.categoryOverview}</p><h2>{text.shineNext}</h2></div><span className="updated">{text.defaultCategories}</span></div>
    <div className="progress-layout"><div className="category-list">{categories.map((category) => <article className="category-row" key={category.id}><div><h3>{translateBuiltin(category.name)}</h3><p>{category.awardCount ? formatAchievements(category.awardCount) : text.noAchievements}</p></div><strong>{category.totalPoints > 0 ? "+" : ""}{formatPoints(category.totalPoints)}</strong></article>)}</div>
      <aside className="progress-notes">{strongest && focus ? <><div><span>{text.strongestLabel}</span><strong>{translateBuiltin(strongest.name)}</strong><p>{formatPoints(strongest.totalPoints)} · {formatAchievements(strongest.awardCount)}.</p></div><div><span>{text.nextOpportunity}</span><strong>{translateBuiltin(focus.name)}</strong><p>{text.roomToContribute}</p></div></> : <div><span>{text.readyWhenYouAre}</span><strong>{text.firstAchievementNext}</strong><p>{text.progressExplanation}</p></div>}</aside>
    </div>
  </section>;
}

function TeacherComposer({ onAwarded }: { onAwarded: () => void }) {
  const { text, translateBuiltin } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const visibleStudents = useMemo(() => students.filter((student) => `${student.name} ${student.houseName}`.toLowerCase().includes(search.trim().toLowerCase())), [students, search]);
  useEffect(() => { Promise.all([request<{ categories: Category[] }>("/api/v1/categories"), request<{ students: Student[] }>("/api/v1/students")]).then(([cats, pupils]) => { setCategories(cats.categories); setStudents(pupils.students); }).catch((error: Error) => setMessage(error.message)); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setBusy(true);
    const formElement = event.currentTarget;
    const fields = new FormData(formElement);
    try { await request("/api/v1/awards", { method: "POST", body: JSON.stringify({ studentId: fields.get("studentId"), categoryId: fields.get("categoryId"), points: fields.get("points"), reason: fields.get("reason") }) }); formElement.reset(); setStudentId(""); setCategoryId(""); setMessage(text.awardSuccess); onAwarded(); }
    catch (error) { setMessage(error instanceof Error ? error.message : text.tryAgain); } finally { setBusy(false); }
  }
  return <section className="composer"><div><p className="eyebrow">{text.recognition}</p><h2>{text.awardPoints}</h2><p>{text.awardDescription}</p></div><form onSubmit={submit}><label className="wide-label">{text.findStudent}<input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder={text.searchStudent} /></label><label>{text.studentLabel}<select required name="studentId" value={studentId} onChange={(event) => setStudentId(event.target.value)}><option disabled value="">{text.chooseStudent}</option>{visibleStudents.map((student) => <option key={student.id} value={student.id}>{student.name} — {student.houseName}</option>)}</select></label><label>{text.categoryLabel}<select required name="categoryId" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option disabled value="">{text.chooseCategory}</option>{categories.map((category) => <option key={category.id} value={category.id}>{translateBuiltin(category.name)} · {text.upTo} {category.maxPoints}</option>)}</select></label><div className="quick-categories wide-label" aria-label={text.quickCategory}>{categories.map((category) => <button type="button" className={category.id === categoryId ? "selected" : ""} key={category.id} onClick={() => setCategoryId(category.id)}>{translateBuiltin(category.name)}</button>)}</div><label>{text.pointsLabel}<input required name="points" type="number" min="1" max="10000" placeholder="10" /></label><label className="wide-label">{text.reason}<textarea required name="reason" minLength={3} maxLength={500} placeholder={text.reasonPlaceholder} /></label><button disabled={busy} className="button button-accent">{busy ? text.saving : text.awardPoints} <span>→</span></button>{message && <p className="inline-message" aria-live="polite">{message}</p>}</form></section>;
}

function AdminPanel({ houses, refresh }: { houses: House[]; refresh: () => void }) {
  const { text, language, locale, translateBuiltin, formatPoints, formatStudents } = useLanguage();
  const [tab, setTab] = useState<"people" | "houses" | "categories">("people");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState("");
  const matchingUsers = useMemo(() => users.filter((person) => `${person.name} ${person.username} ${person.role} ${person.houseName ?? ""}`.toLowerCase().includes(peopleSearch.trim().toLowerCase())), [users, peopleSearch]);

  async function loadAdministration() {
    try {
      const [people, cats] = await Promise.all([request<{ users: AdminUser[] }>("/api/v1/admin/users"), request<{ categories: AdminCategory[] }>("/api/v1/admin/categories")]);
      setUsers(people.users); setCategories(cats.categories);
    } catch (error) { setMessage(error instanceof Error ? error.message : language === "cs" ? "Administraci se nepodařilo načíst." : "We could not load administration."); }
  }

  useEffect(() => { void loadAdministration(); }, []);

  async function perform(action: () => Promise<void>, successMessage: string) {
    setBusy(true); setMessage("");
    try { await action(); await loadAdministration(); refresh(); setMessage(successMessage); }
    catch (error) { setMessage(error instanceof Error ? error.message : text.tryAgain); }
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
    }, language === "cs" ? (selected ? "Účet byl aktualizován." : "Účet byl vytvořen.") : (selected ? "Account updated." : "Account created."));
  }

  async function saveHouse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const selected = editingHouse;
    await perform(async () => {
      await request(selected ? `/api/v1/admin/houses/${selected.id}` : "/api/v1/admin/houses", { method: selected ? "PATCH" : "POST", body: JSON.stringify({ name: form.get("name"), color: form.get("color"), meaning: form.get("meaning"), symbol: form.get("symbol"), description: form.get("description") }) });
      setEditingHouse(null); formElement.reset();
    }, language === "cs" ? (selected ? "Tým byl aktualizován." : "Tým byl vytvořen.") : (selected ? "House updated." : "House created."));
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
    }, language === "cs" ? (selected ? "Kategorie byla aktualizována." : "Kategorie byla vytvořena.") : (selected ? "Category updated." : "Category created."));
  }

  async function setAccountStatus(person: AdminUser) {
    await perform(() => request(`/api/v1/admin/users/${person.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !person.isActive }) }), language === "cs" ? (person.isActive ? "Účet byl deaktivován." : "Účet byl aktivován.") : (person.isActive ? "Account deactivated." : "Account activated."));
  }

  async function uploadHouseImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const fields = new FormData(event.currentTarget);
    const houseId = String(fields.get("houseId") ?? "");
    const image = fields.get("image");
    if (!houseId || !(image instanceof File) || image.size === 0) { setMessage(language === "cs" ? "Nejprve vyberte tým a obrázek." : "Choose a house and image first."); return; }
    const body = new FormData(); body.append("image", image);
    try { await request(`/api/v1/admin/houses/${houseId}/media`, { method: "POST", body }); event.currentTarget.reset(); setMessage(language === "cs" ? "Obrázek týmu byl aktualizován." : "House image updated."); refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : text.tryAgain); }
  }
  const roleLabel = (role: AdminUser["role"]) => role === "student" ? text.roleStudent : role === "teacher" ? text.roleTeacher : text.roleAdmin;
  return <section className="admin-panel"><div className="section-heading"><div><p className="eyebrow">{text.schoolControls}</p><h2>{text.keepFair}</h2></div></div><div className="tab-row" role="tablist" aria-label={text.administration}><button className={tab === "people" ? "active" : ""} onClick={() => setTab("people")} role="tab" aria-selected={tab === "people"}>{text.people}</button><button className={tab === "houses" ? "active" : ""} onClick={() => setTab("houses")} role="tab" aria-selected={tab === "houses"}>{text.houses}</button><button className={tab === "categories" ? "active" : ""} onClick={() => setTab("categories")} role="tab" aria-selected={tab === "categories"}>{text.categories}</button></div>
    {tab === "people" && <div className="admin-grid"><div className="data-list"><label className="list-search">{text.findPerson}<input value={peopleSearch} onChange={(event) => setPeopleSearch(event.target.value)} type="search" placeholder={text.searchPeople} /></label>{matchingUsers.map((person) => <article className="admin-list-item" key={person.id}><div><strong>{person.name}</strong><span>{person.username} · {roleLabel(person.role)} · {person.houseName ?? text.noHouse} · {person.isActive ? text.active : text.inactive}</span></div><div className="admin-item-actions"><button type="button" onClick={() => setEditingUser(person)}>{text.edit}</button><button type="button" disabled={busy} onClick={() => void setAccountStatus(person)}>{person.isActive ? text.deactivate : text.activate}</button></div></article>)}{matchingUsers.length === 0 && <p className="muted-block">{text.noMatchingPeople}</p>}</div><form key={editingUser?.id ?? "new-user"} className="compact-form" onSubmit={saveUser}><h3>{editingUser ? text.editAccount : text.addAccount}</h3><input name="name" required defaultValue={editingUser?.name} placeholder={text.fullName} /><input name="username" required defaultValue={editingUser?.username} pattern="[a-z0-9][a-z0-9._-]{2,30}" autoComplete="username" placeholder={text.username} /><input name="email" required defaultValue={editingUser?.email} type="email" placeholder="name@school.edu" /><input name="password" type="password" minLength={14} placeholder={editingUser ? text.optionalPassword : text.temporaryPassword} required={!editingUser} /><select name="role" defaultValue={editingUser?.role ?? "student"}><option value="student">{text.roleStudent}</option><option value="teacher">{text.roleTeacher}</option><option value="admin">{text.roleAdmin}</option></select><select name="houseId" defaultValue={editingUser?.houseId ?? ""}><option value="">{text.chooseStudentHouse}</option>{houses.map((house) => <option key={house.id} value={house.id}>{house.name}</option>)}</select><div className="form-actions">{editingUser && <button type="button" className="secondary-action" onClick={() => setEditingUser(null)}>{text.cancel}</button>}<button disabled={busy} className="button button-dark">{editingUser ? text.saveAccount : text.createAccount} <span>→</span></button></div></form></div>}
    {tab === "houses" && <div className="admin-grid"><div className="data-list">{houses.map((house) => <article className="admin-list-item" key={house.id}><div><strong><i style={{ background: house.color }} />{house.name}</strong><span>{translateBuiltin(house.meaning || text.houses)} · {formatPoints(house.totalPoints)} · {formatStudents(house.studentCount)}</span></div><div className="admin-item-actions"><button type="button" onClick={() => setEditingHouse(house)}>{text.edit}</button></div></article>)}</div><div><form key={editingHouse?.id ?? "new-house"} className="compact-form" onSubmit={saveHouse}><h3>{editingHouse ? text.editHouse : text.addHouse}</h3><input name="name" required defaultValue={editingHouse?.name} placeholder={text.houseName} /><input name="meaning" defaultValue={editingHouse?.meaning} placeholder={text.houseMeaning} /><input name="symbol" defaultValue={editingHouse?.symbol} placeholder={text.houseSymbol} /><textarea name="description" defaultValue={editingHouse?.description} placeholder={text.houseDescription} maxLength={500} /><input name="color" required defaultValue={editingHouse?.color} pattern="^#[0-9A-Fa-f]{6}$" placeholder="#5B5CE2" /><div className="form-actions">{editingHouse && <button type="button" className="secondary-action" onClick={() => setEditingHouse(null)}>{text.cancel}</button>}<button disabled={busy} className="button button-dark">{editingHouse ? text.saveHouse : text.createHouse} <span>→</span></button></div></form>{presentationMode ? <p className="form-note">{text.fixedEmblems}</p> : <form className="compact-form" onSubmit={uploadHouseImage}><h3>{text.houseImage}</h3><select name="houseId" required defaultValue=""><option value="" disabled>{text.chooseAHouse}</option>{houses.map((house) => <option key={house.id} value={house.id}>{house.name}</option>)}</select><input name="image" required type="file" accept="image/png,image/jpeg,image/webp" /><p className="form-note">{text.imageHelp}</p><button className="button button-dark">{text.uploadImage} <span>→</span></button></form>}</div></div>}
    {tab === "categories" && <div className="admin-grid"><div className="data-list">{categories.map((category) => <article className="admin-list-item" key={category.id}><div><strong>{translateBuiltin(category.name)}</strong><span>{text.maximum} {category.maxPoints.toLocaleString(locale)} {text.pointsPerAward} · {category.isActive ? text.active : text.inactive}</span></div><div className="admin-item-actions"><button type="button" onClick={() => setEditingCategory(category)}>{text.edit}</button></div></article>)}</div><form key={editingCategory?.id ?? "new-category"} className="compact-form" onSubmit={saveCategory}><h3>{editingCategory ? text.editCategory : text.addCategory}</h3><input name="name" required defaultValue={editingCategory?.name} placeholder={text.leadershipExample} /><input name="maxPoints" required defaultValue={editingCategory?.maxPoints} type="number" min="1" max="10000" placeholder={text.maximumPoints} />{editingCategory && <label className="checkbox-label"><input name="isActive" type="checkbox" defaultChecked={editingCategory.isActive} /> {text.activeForAwards}</label>}<div className="form-actions">{editingCategory && <button type="button" className="secondary-action" onClick={() => setEditingCategory(null)}>{text.cancel}</button>}<button disabled={busy} className="button button-dark">{editingCategory ? text.saveCategory : text.createCategory} <span>→</span></button></div></form></div>}
    {message && <p className="inline-message" aria-live="polite">{message}</p>}</section>;
}

export function Portal() {
  const { text, locale, translateBuiltin, formatPoints } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [awards, setAwards] = useState<Award[]>([]);
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [houses, setHouses] = useState<House[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"all" | "this-month" | "previous-month">("all");
  async function load() {
    try {
      const [session, ledger, board] = await Promise.all([request<{ user: User }>("/api/v1/auth/me"), request<{ awards: Award[]; totalPoints: number; categorySummary: CategorySummary[] }>("/api/v1/awards/mine"), request<{ houses: House[] }>("/api/v1/houses/leaderboard")]);
      setUser(session.user); setAwards(ledger.awards); setTotal(ledger.totalPoints); setCategorySummary(ledger.categorySummary); setHouses(board.houses); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : localizeApiMessage("Please sign in again.")); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function signOut() { if (presentationMode) { signOutForPresentation(); window.location.assign(presentationPath("/")); return; } await request("/api/v1/auth/logout", { method: "POST" }, false).catch(() => undefined); window.location.assign("/"); }
  async function undoAward(award: Award) {
    const path = presentationMode ? `/api/v1/awards/${award.id}` : `/api/v1/awards/${award.id}/reverse`;
    const method = presentationMode ? "DELETE" : "POST";
    try { await request(path, { method }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : localizeApiMessage("We could not undo that award.")); }
  }
  function resetDemo() { resetPresentationDemo(); window.location.assign(presentationPath("/login")); }
  if (loading) return <main className="loading-screen"><Logo /><p>{text.openingPortal}</p></main>;
  if (!user) return <main className="loading-screen"><Logo /><h1>{text.sessionNeeded}</h1><p>{error}</p><Link className="button button-dark" href="/login">{text.signIn} <span>→</span></Link></main>;
  const roleCopy = user.role === "student" ? text.studentHeadline : user.role === "teacher" ? text.teacherHeadline : text.adminHeadline;
  const hasCategoryProgress = categorySummary.some((category) => category.awardCount > 0);
  const strongestCategory = hasCategoryProgress ? categorySummary[0] : null;
  const focusCategory = hasCategoryProgress ? categorySummary[categorySummary.length - 1] : null;
  const now = new Date();
  const visibleAwards = awards.filter((award) => { if (period === "all") return true; const date = new Date(award.createdAt); const monthOffset = period === "this-month" ? 0 : 1; const target = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1); return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth(); });
  const roleLabel = user.role === "student" ? text.roleStudent : user.role === "teacher" ? text.roleTeacher : text.roleAdmin;
  return <main className="portal"><header className="portal-header"><Logo /><div className="portal-actions"><LanguageToggle /><ThemeToggle /><span className={`role role-${user.role}`}>{roleLabel}</span>{presentationMode && <button className="reset-demo" onClick={resetDemo}>{text.resetDemo}</button>}<button className="signout" onClick={signOut}>{text.signOut}</button></div></header>{presentationMode && <p className="form-note">{text.localDemo}</p>}<section className="portal-intro"><div><p className="eyebrow">{text.hello}, {user.name.split(" ")[0]}</p><h1>{roleCopy}</h1></div><p>{user.role === "student" ? text.studentIntro : text.staffIntro}</p></section>
    <section className="quick-stats">{user.role === "student" ? <><div><span>{text.yourPoints}</span><strong>{total.toLocaleString(locale)}</strong><small>{text.pointsToDate}</small></div><div><span>{text.strongestCategory}</span><strong>{strongestCategory ? translateBuiltin(strongestCategory.name) : "—"}</strong><small>{strongestCategory ? formatPoints(strongestCategory.totalPoints) : text.progressHere}</small></div><div><span>{text.nextOpportunity}</span><strong>{focusCategory ? translateBuiltin(focusCategory.name) : "—"}</strong><small>{focusCategory ? text.categoryToBuild : text.everyContribution}</small></div></> : <><div><span>{user.role === "teacher" ? text.awardsGiven : text.ledgerEntries}</span><strong>{awards.length.toLocaleString(locale)}</strong><small>{text.latestEntries}</small></div><div><span>{text.leadingHouse}</span><strong>{houses[0]?.name ?? "—"}</strong><small>{houses[0] ? formatPoints(houses[0].totalPoints) : text.noPointsYet}</small></div><div><span>{text.builtFor}</span><strong>{user.role === "teacher" ? text.recognition : text.stewardship}</strong><small>{text.clearRecords}</small></div></>}</section>
    {(user.role === "teacher" || user.role === "admin") && <TeacherComposer onAwarded={load} />}
    {user.role === "student" && <StudentProgress categories={categorySummary} />}
    <section className="ledger-section"><div className="section-heading"><div><p className="eyebrow">{user.role === "student" ? text.yourAchievements : text.recentActivity}</p><h2>{user.role === "student" ? text.pointsStory : text.pointsLedger}</h2></div><label className="period-filter">{text.period}<select value={period} onChange={(event) => setPeriod(event.target.value as typeof period)}><option value="all">{text.allActivity}</option><option value="this-month">{text.thisMonth}</option><option value="previous-month">{text.previousMonth}</option></select></label></div><AwardList awards={visibleAwards} onUndo={user.role !== "student" ? undoAward : undefined} /></section>
    {user.role === "admin" && <AdminPanel houses={houses} refresh={load} />}
  </main>;
}
