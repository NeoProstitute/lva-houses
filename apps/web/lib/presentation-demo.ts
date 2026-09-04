export type PresentationRole = "student" | "teacher" | "admin";

type PresentationUser = {
  id: string;
  name: string;
  role: PresentationRole;
  houseId: string | null;
};

const storageKey = "lva-presentation-user";

export const presentationMode = process.env.NEXT_PUBLIC_PRESENTATION_MODE === "true";
const presentationBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function presentationPath(path: string) {
  return `${presentationBasePath}${path}`;
}

const accounts: Array<PresentationUser & { login: string; password: string }> = [
  { id: "demo-liliana", name: "Liliana Netland", role: "student", houseId: "curiositas", login: "liliana.netland", password: "LilianaHouse!2026" },
  { id: "demo-doria", name: "Doria the exploria", role: "student", houseId: "humanitas", login: "doria.exploria", password: "DoriaHouses!2026" },
  { id: "demo-kanye", name: "Kanye Wesley", role: "student", houseId: "veritas", login: "kanye.wesley", password: "KanyeHouses!2026" },
  { id: "demo-oliver", name: "Oliver Tree", role: "student", houseId: "sapientia", login: "oliver.tree", password: "OliverHouse!2026" },
  { id: "demo-teacher", name: "Michael Stoner", role: "teacher", houseId: null, login: "michael.stoner", password: "MichaelHouse!2026" },
  { id: "demo-admin", name: "School Administrator", role: "admin", houseId: null, login: "admin", password: "AdminHouses!2026" }
];

export function signInForPresentation(login: string, password: string): boolean {
  const account = accounts.find((candidate) => candidate.login === login.trim().toLowerCase() && candidate.password === password);
  if (!account || typeof window === "undefined") return false;
  const { login: _login, password: _password, ...user } = account;
  window.localStorage.setItem(storageKey, JSON.stringify(user));
  return true;
}

export function presentationUser(): PresentationUser | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) as PresentationUser : null;
  } catch {
    return null;
  }
}

export function signOutForPresentation() {
  if (typeof window !== "undefined") window.localStorage.removeItem(storageKey);
}

const houses = [
  { id: "curiositas", name: "Curiositas", color: "#FFDA61", iconUrl: "/house-emblems/curiositas-mark-v5.png", meaning: "Curiosity", symbol: "Set of keys", description: "Illumination begins with questions, discovery and the courage to unlock new knowledge.", totalPoints: 75, studentCount: 1 },
  { id: "humanitas", name: "Humanitas", color: "#EE3F6C", iconUrl: null, meaning: "Empathy", symbol: "Hand", description: "Empathy brings people together through care, understanding and shared humanity.", totalPoints: 68, studentCount: 1 },
  { id: "veritas", name: "Veritas", color: "#4677E6", iconUrl: "/house-emblems/veritas-mark-v5.png", meaning: "Honesty", symbol: "Mirror", description: "Honesty asks us to reflect clearly, speak truthfully and act with integrity.", totalPoints: 62, studentCount: 1 },
  { id: "sapientia", name: "Sapientia", color: "#602889", iconUrl: "/house-emblems/sapientia-mark-v5.png", meaning: "Wisdom", symbol: "Owl", description: "Wisdom grows through thoughtful learning, perspective and purposeful choices.", totalPoints: 58, studentCount: 1 }
];

const categories = [
  { id: "learning", name: "Learning", maxPoints: 100 },
  { id: "behaviour", name: "Behaviour", maxPoints: 100 },
  { id: "projects", name: "Projects", maxPoints: 100 },
  { id: "participation", name: "Participation", maxPoints: 100 }
];

const awards = [
  { id: "award-1", studentId: "demo-liliana", points: 35, reason: "Excellent research and thoughtful questions", createdAt: "2026-09-02T09:00:00.000Z", categoryName: "Learning", studentName: "Liliana Netland", awardedByName: "Michael Stoner", houseName: "Curiositas", houseColor: "#FFDA61", reversalOf: null },
  { id: "award-2", studentId: "demo-liliana", points: 25, reason: "Clear and confident project presentation", createdAt: "2026-08-28T09:00:00.000Z", categoryName: "Projects", studentName: "Liliana Netland", awardedByName: "Michael Stoner", houseName: "Curiositas", houseColor: "#FFDA61", reversalOf: null },
  { id: "award-3", studentId: "demo-liliana", points: 15, reason: "Helpful contribution during group work", createdAt: "2026-08-23T09:00:00.000Z", categoryName: "Behaviour", studentName: "Liliana Netland", awardedByName: "Michael Stoner", houseName: "Curiositas", houseColor: "#FFDA61", reversalOf: null },
  { id: "award-4", studentId: "demo-doria", points: 40, reason: "Kind leadership during a team project", createdAt: "2026-09-01T09:00:00.000Z", categoryName: "Behaviour", studentName: "Doria the exploria", awardedByName: "Michael Stoner", houseName: "Humanitas", houseColor: "#EE3F6C", reversalOf: null },
  { id: "award-5", studentId: "demo-doria", points: 28, reason: "Helpful project contribution", createdAt: "2026-08-27T09:00:00.000Z", categoryName: "Projects", studentName: "Doria the exploria", awardedByName: "Michael Stoner", houseName: "Humanitas", houseColor: "#EE3F6C", reversalOf: null },
  { id: "award-6", studentId: "demo-kanye", points: 32, reason: "Honest and constructive class reflection", createdAt: "2026-08-31T09:00:00.000Z", categoryName: "Learning", studentName: "Kanye Wesley", awardedByName: "Michael Stoner", houseName: "Veritas", houseColor: "#4677E6", reversalOf: null },
  { id: "award-7", studentId: "demo-kanye", points: 30, reason: "Reliable lesson participation", createdAt: "2026-08-26T09:00:00.000Z", categoryName: "Participation", studentName: "Kanye Wesley", awardedByName: "Michael Stoner", houseName: "Veritas", houseColor: "#4677E6", reversalOf: null },
  { id: "award-8", studentId: "demo-oliver", points: 38, reason: "Thoughtful solution to a complex task", createdAt: "2026-08-30T09:00:00.000Z", categoryName: "Learning", studentName: "Oliver Tree", awardedByName: "Michael Stoner", houseName: "Sapientia", houseColor: "#602889", reversalOf: null },
  { id: "award-9", studentId: "demo-oliver", points: 20, reason: "Useful perspective in discussion", createdAt: "2026-08-25T09:00:00.000Z", categoryName: "Participation", studentName: "Oliver Tree", awardedByName: "Michael Stoner", houseName: "Sapientia", houseColor: "#602889", reversalOf: null }
];

export function presentationResponse(path: string): unknown {
  const user = presentationUser();
  if (path === "/api/v1/auth/me") {
    if (!user) throw new Error("Please sign in to open the presentation portal.");
    return { user };
  }
  if (path === "/api/v1/houses/leaderboard") return { houses, studentLeaders: [{ name: "Liliana Netland", houseName: "Curiositas", houseColor: "#FFDA61", totalPoints: 75 }, { name: "Doria the exploria", houseName: "Humanitas", houseColor: "#EE3F6C", totalPoints: 68 }, { name: "Kanye Wesley", houseName: "Veritas", houseColor: "#4677E6", totalPoints: 62 }, { name: "Oliver Tree", houseName: "Sapientia", houseColor: "#602889", totalPoints: 58 }] };
  if (path === "/api/v1/awards/mine") { const studentAwards = user?.role === "student" ? awards.filter((award) => award.studentId === user.id) : awards.slice().reverse(); return { awards: studentAwards, totalPoints: user?.role === "student" ? studentAwards.reduce((total, award) => total + award.points, 0) : 0, categorySummary: categories.map((category) => { const matching = studentAwards.filter((award) => award.categoryName === category.name); return { id: category.id, name: category.name, totalPoints: matching.reduce((total, award) => total + award.points, 0), awardCount: matching.length }; }).sort((a, b) => b.totalPoints - a.totalPoints) }; }
  if (path === "/api/v1/categories") return { categories };
  if (path === "/api/v1/students") return { students: accounts.filter((person) => person.role === "student").map((person) => { const house = houses.find((candidate) => candidate.id === person.houseId)!; return { id: person.id, name: person.name, houseId: house.id, houseName: house.name, houseColor: house.color }; }) };
  if (path === "/api/v1/admin/users") return { users: accounts.map(({ login, password, ...person }) => ({ ...person, username: login, email: `${login}@lva-demo.local`, houseName: houses.find((house) => house.id === person.houseId)?.name ?? null, isActive: true })) };
  if (path === "/api/v1/admin/categories") return { categories: categories.map((category) => ({ ...category, isActive: true })) };
  return {};
}
