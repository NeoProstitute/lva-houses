export type PresentationRole = "student" | "teacher" | "admin";

export type PresentationUser = { id: string; name: string; role: PresentationRole; houseId: string | null };
type PresentationAccount = PresentationUser & { login: string; password: string; email: string; isActive: boolean };
export type PresentationHouse = { id: string; name: string; color: string; iconUrl: string | null; meaning: string; symbol: string; description: string };
type PresentationCategory = { id: string; name: string; maxPoints: number; isActive: boolean };
export type PresentationAward = { id: string; studentId: string; points: number; reason: string; createdAt: string; categoryName: string; studentName: string; awardedByName: string; houseName: string; houseColor: string; reversalOf: string | null };
type PresentationState = { accounts: PresentationAccount[]; houses: PresentationHouse[]; categories: PresentationCategory[]; awards: PresentationAward[] };

const sessionStorageKey = "lva-presentation-user";
const stateStorageKey = "lva-presentation-state-v3";
export const presentationMode = process.env.NEXT_PUBLIC_PRESENTATION_MODE === "true";
const presentationBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function presentationPath(path: string) { return `${presentationBasePath}${path}`; }
function presentationAssetPath(path: string | null) {
  if (!path || !presentationBasePath || /^(?:https?:|data:)/.test(path) || path.startsWith(`${presentationBasePath}/`)) return path;
  return `${presentationBasePath}${path.startsWith("/") ? path : `/${path}`}`;
}

const initialState: PresentationState = {
  accounts: [
    { id: "demo-liliana", name: "Liliana Netland", role: "student", houseId: "00000000-0000-4000-8000-000000000001", login: "liliana.netland", password: "LilianaHouse!2026", email: "liliana.netland@lva-demo.local", isActive: true },
    { id: "demo-teacher", name: "Michael Stoner", role: "teacher", houseId: null, login: "michael.stoner", password: "MichaelHouse!2026", email: "michael.stoner@lva-demo.local", isActive: true },
    { id: "demo-admin", name: "School Administrator", role: "admin", houseId: null, login: "admin", password: "AdminHouses!2026", email: "admin@lva-demo.local", isActive: true }
  ],
  houses: [
    { id: "00000000-0000-4000-8000-000000000001", name: "Curiositas", color: "#FFDA61", iconUrl: "/house-emblems/curiositas-mark-v5.png", meaning: "Curiosity", symbol: "Set of keys", description: "Illumination begins with questions, discovery and the courage to unlock new knowledge." },
    { id: "00000000-0000-4000-8000-000000000002", name: "Humanitas", color: "#AA2626", iconUrl: "/house-emblems/humanitas-mark-v3.png", meaning: "Empathy", symbol: "Hand", description: "Empathy brings people together through care, understanding and shared humanity." },
    { id: "00000000-0000-4000-8000-000000000003", name: "Veritas", color: "#4677E6", iconUrl: "/house-emblems/veritas-mark-v5.png", meaning: "Honesty", symbol: "Mirror", description: "Honesty asks us to reflect clearly, speak truthfully and act with integrity." },
    { id: "00000000-0000-4000-8000-000000000004", name: "Sapientia", color: "#602889", iconUrl: "/house-emblems/sapientia-mark-v5.png", meaning: "Wisdom", symbol: "Owl", description: "Wisdom grows through thoughtful learning, perspective and purposeful choices." }
  ],
  categories: [
    { id: "learning", name: "Learning", maxPoints: 100, isActive: true }, { id: "behaviour", name: "Behaviour", maxPoints: 100, isActive: true }, { id: "projects", name: "Projects", maxPoints: 100, isActive: true }, { id: "participation", name: "Participation", maxPoints: 100, isActive: true }
  ],
  awards: []
};

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function readState(): PresentationState {
  if (typeof window === "undefined") return clone(initialState);
  try {
    const saved = window.localStorage.getItem(stateStorageKey);
    if (!saved) return clone(initialState);
    const state = JSON.parse(saved) as Partial<PresentationState>;
    return Array.isArray(state.accounts) && Array.isArray(state.houses) && Array.isArray(state.categories) && Array.isArray(state.awards) ? state as PresentationState : clone(initialState);
  } catch { return clone(initialState); }
}
function writeState(state: PresentationState) { if (typeof window !== "undefined") window.localStorage.setItem(stateStorageKey, JSON.stringify(state)); }
function sessionId(): string | null {
  if (typeof window === "undefined") return null;
  try { const saved = window.localStorage.getItem(sessionStorageKey); return saved ? (JSON.parse(saved) as { id?: string }).id ?? null : null; } catch { return null; }
}
function currentUser(state = readState()): PresentationUser | null {
  const account = state.accounts.find((candidate) => candidate.id === sessionId() && candidate.isActive);
  return account ? { id: account.id, name: account.name, role: account.role, houseId: account.houseId } : null;
}
function parseBody(options?: RequestInit): Record<string, unknown> {
  if (!options?.body || typeof options.body !== "string") return {};
  try { return JSON.parse(options.body) as Record<string, unknown>; } catch { return {}; }
}
function assertRole(user: PresentationUser | null, roles: PresentationRole[]) { if (!user || !roles.includes(user.role)) throw new Error("This action is not available for your role."); }
function houseSummaries(state: PresentationState) {
  return state.houses.map((house) => {
    const memberIds = state.accounts.filter((account) => account.role === "student" && account.isActive && account.houseId === house.id).map((account) => account.id);
    const totalPoints = state.awards.filter((award) => memberIds.includes(award.studentId) && !award.reversalOf).reduce((total, award) => total + award.points, 0);
    return { ...house, iconUrl: presentationAssetPath(house.iconUrl), totalPoints, studentCount: memberIds.length };
  }).sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
}
function studentLeaders(state: PresentationState) {
  return state.accounts.filter((account) => account.role === "student" && account.isActive).map((account) => {
    const house = state.houses.find((candidate) => candidate.id === account.houseId)!;
    const totalPoints = state.awards.filter((award) => award.studentId === account.id && !award.reversalOf).reduce((total, award) => total + award.points, 0);
    return { id: account.id, name: account.name, houseId: house.id, houseName: house.name, houseColor: house.color, totalPoints };
  }).sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
}

export function presentationHouseHistory(houseId: string) {
  const state = readState(); const members = state.accounts.filter((account) => account.role === "student" && account.houseId === houseId).map((account) => account.id); const groups = new Map<string, { period: string; totalPoints: number; awardCount: number }>();
  state.awards.filter((award) => members.includes(award.studentId) && !award.reversalOf).forEach((award) => { const date = new Date(award.createdAt); const period = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString(); const entry = groups.get(period) ?? { period, totalPoints: 0, awardCount: 0 }; entry.totalPoints += award.points; entry.awardCount += 1; groups.set(period, entry); });
  return [...groups.values()].sort((a, b) => a.period.localeCompare(b.period));
}
export function signInForPresentation(login: string, password: string): boolean {
  const account = readState().accounts.find((candidate) => candidate.isActive && candidate.login === login.trim().toLowerCase() && candidate.password === password);
  if (!account || typeof window === "undefined") return false; window.localStorage.setItem(sessionStorageKey, JSON.stringify({ id: account.id })); return true;
}
export function presentationUser(): PresentationUser | null { return currentUser(); }
export function signOutForPresentation() { if (typeof window !== "undefined") window.localStorage.removeItem(sessionStorageKey); }
export function resetPresentationDemo() { if (typeof window !== "undefined") { window.localStorage.removeItem(stateStorageKey); window.localStorage.removeItem(sessionStorageKey); } }

export function presentationResponse(path: string, options?: RequestInit): unknown {
  const state = readState(); const user = currentUser(state); const method = options?.method?.toUpperCase() ?? "GET"; const body = parseBody(options); const board = houseSummaries(state); const leaders = studentLeaders(state);
  if (path === "/api/v1/auth/me") { if (!user) throw new Error("Please sign in to open the presentation portal."); return { user }; }
  if (path === "/api/v1/houses/leaderboard") return { houses: board, studentLeaders: leaders.map(({ name, houseName, houseColor, totalPoints }) => ({ name, houseName, houseColor, totalPoints })), houseLeaders: board.flatMap((house) => { const leader = leaders.find((candidate) => candidate.houseId === house.id); return leader ? [{ houseId: house.id, name: leader.name, houseName: leader.houseName, houseColor: leader.houseColor, totalPoints: leader.totalPoints }] : []; }) };
  if (path === "/api/v1/awards/mine") {
    if (!user) throw new Error("Please sign in to open the presentation portal."); const visibleAwards = (user.role === "student" ? state.awards.filter((award) => award.studentId === user.id) : state.awards).filter((award) => !award.reversalOf).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const categorySummary = state.categories.filter((category) => category.isActive).map((category) => { const matching = visibleAwards.filter((award) => award.categoryName === category.name); return { id: category.id, name: category.name, totalPoints: matching.reduce((total, award) => total + award.points, 0), awardCount: matching.length }; }).sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
    return { awards: visibleAwards, totalPoints: user.role === "student" ? visibleAwards.reduce((total, award) => total + award.points, 0) : 0, categorySummary };
  }
  if (path === "/api/v1/categories") return { categories: state.categories.filter((category) => category.isActive) };
  if (path === "/api/v1/students") return { students: state.accounts.filter((account) => account.role === "student" && account.isActive).map((account) => { const house = state.houses.find((candidate) => candidate.id === account.houseId)!; return { id: account.id, name: account.name, houseId: house.id, houseName: house.name, houseColor: house.color }; }) };
  if (path === "/api/v1/awards" && method === "POST") {
    assertRole(user, ["teacher", "admin"]); const student = state.accounts.find((account) => account.id === body.studentId && account.role === "student" && account.isActive); const category = state.categories.find((candidate) => candidate.id === body.categoryId && candidate.isActive); const points = Number(body.points); const reason = String(body.reason ?? "").trim();
    if (!student || !category || !Number.isInteger(points) || points < 1 || points > category.maxPoints || reason.length < 3) throw new Error("Choose a student and category, then enter a clear reason and a valid point value.");
    const house = state.houses.find((candidate) => candidate.id === student.houseId)!; const award: PresentationAward = { id: `award-${Date.now()}`, studentId: student.id, points, reason, createdAt: new Date().toISOString(), categoryName: category.name, studentName: student.name, awardedByName: user?.name ?? "School staff", houseName: house.name, houseColor: house.color, reversalOf: null }; state.awards.push(award); writeState(state); return { award };
  }
  if (path.startsWith("/api/v1/awards/") && method === "DELETE") { assertRole(user, ["teacher", "admin"]); const awardId = path.split("/").pop(); if (!state.awards.some((award) => award.id === awardId)) throw new Error("This award could not be found."); state.awards = state.awards.filter((award) => award.id !== awardId); writeState(state); return { ok: true }; }
  if (path === "/api/v1/admin/users" && method === "GET") return { users: state.accounts.map(({ password: _password, login, ...account }) => ({ ...account, username: login, houseName: state.houses.find((house) => house.id === account.houseId)?.name ?? null })) };
  if (path === "/api/v1/admin/categories" && method === "GET") return { categories: state.categories };
  if (path === "/api/v1/admin/users" && method === "POST") {
    assertRole(user, ["admin"]); const login = String(body.username ?? "").trim().toLowerCase(); const password = String(body.password ?? ""); const name = String(body.name ?? "").trim(); if (!name || !login || password.length < 14 || state.accounts.some((account) => account.login === login)) throw new Error("Use a unique username and a password of at least 14 characters.");
    state.accounts.push({ id: `demo-user-${Date.now()}`, name, login, password, email: String(body.email ?? ""), role: body.role === "admin" || body.role === "teacher" ? body.role : "student", houseId: typeof body.houseId === "string" && state.houses.some((house) => house.id === body.houseId) ? body.houseId : null, isActive: true }); writeState(state); return { ok: true };
  }
  const userMatch = path.match(/^\/api\/v1\/admin\/users\/([^/]+)$/);
  if (userMatch && method === "PATCH") {
    assertRole(user, ["admin"]); const account = state.accounts.find((candidate) => candidate.id === userMatch[1]); if (!account) throw new Error("Account not found."); if (typeof body.name === "string") account.name = body.name.trim(); if (typeof body.username === "string") account.login = body.username.trim().toLowerCase(); if (typeof body.email === "string") account.email = body.email.trim(); if (body.role === "student" || body.role === "teacher" || body.role === "admin") account.role = body.role; if (typeof body.houseId === "string" || body.houseId === null) account.houseId = typeof body.houseId === "string" && state.houses.some((house) => house.id === body.houseId) ? body.houseId : null; if (typeof body.isActive === "boolean") account.isActive = body.isActive; if (typeof body.password === "string" && body.password.length) { if (body.password.length < 14) throw new Error("Passwords must have at least 14 characters."); account.password = body.password; } writeState(state); return { ok: true };
  }
  if (path === "/api/v1/admin/houses" && method === "POST") { assertRole(user, ["admin"]); const name = String(body.name ?? "").trim(); if (!name) throw new Error("House name is required."); state.houses.push({ id: `house-${Date.now()}`, name, color: String(body.color ?? "#496B94"), iconUrl: null, meaning: String(body.meaning ?? ""), symbol: String(body.symbol ?? ""), description: String(body.description ?? "") }); writeState(state); return { ok: true }; }
  const houseMatch = path.match(/^\/api\/v1\/admin\/houses\/([^/]+)$/);
  if (houseMatch && method === "PATCH") { assertRole(user, ["admin"]); const house = state.houses.find((candidate) => candidate.id === houseMatch[1]); if (!house) throw new Error("House not found."); if (typeof body.name === "string") house.name = body.name.trim(); if (typeof body.color === "string") house.color = body.color; if (typeof body.meaning === "string") house.meaning = body.meaning; if (typeof body.symbol === "string") house.symbol = body.symbol; if (typeof body.description === "string") house.description = body.description; writeState(state); return { ok: true }; }
  if (path === "/api/v1/admin/categories" && method === "POST") { assertRole(user, ["admin"]); const name = String(body.name ?? "").trim(); const maxPoints = Number(body.maxPoints); if (!name || !Number.isInteger(maxPoints) || maxPoints < 1) throw new Error("Enter a category name and a valid maximum point value."); state.categories.push({ id: `category-${Date.now()}`, name, maxPoints, isActive: true }); writeState(state); return { ok: true }; }
  const categoryMatch = path.match(/^\/api\/v1\/admin\/categories\/([^/]+)$/);
  if (categoryMatch && method === "PATCH") { assertRole(user, ["admin"]); const category = state.categories.find((candidate) => candidate.id === categoryMatch[1]); if (!category) throw new Error("Category not found."); if (typeof body.name === "string") category.name = body.name.trim(); if (body.maxPoints !== undefined) { const maxPoints = Number(body.maxPoints); if (!Number.isInteger(maxPoints) || maxPoints < 1) throw new Error("Enter a valid maximum point value."); category.maxPoints = maxPoints; } if (typeof body.isActive === "boolean") category.isActive = body.isActive; writeState(state); return { ok: true }; }
  return {};
}
