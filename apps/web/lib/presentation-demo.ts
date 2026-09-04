export type PresentationRole = "student" | "teacher" | "admin";

type PresentationUser = {
  id: string;
  name: string;
  role: PresentationRole;
  houseId: string | null;
};

const storageKey = "lva-presentation-user";

export const presentationMode = process.env.NEXT_PUBLIC_PRESENTATION_MODE === "true";

const accounts: Array<PresentationUser & { login: string; password: string }> = [
  { id: "demo-student", name: "Liliana Netland", role: "student", houseId: "curiositas", login: "liliana.netland", password: "LilianaDemo!2026" },
  { id: "demo-teacher", name: "Michael Stoner", role: "teacher", houseId: null, login: "michael.stoner", password: "MichaelDemo!2026" },
  { id: "demo-admin", name: "School Administrator", role: "admin", houseId: null, login: "admin", password: "AdminDemo!2026" }
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
  { id: "curiositas", name: "Curiositas", color: "#FFDA61", iconUrl: "/house-emblems/curiositas-mark-v5.png", meaning: "Curiosity", symbol: "Set of keys", description: "Illumination begins with questions, discovery and the courage to unlock new knowledge.", totalPoints: 1280, studentCount: 38 },
  { id: "humanitas", name: "Humanitas", color: "#EE3F6C", iconUrl: null, meaning: "Empathy", symbol: "Hand", description: "Empathy brings people together through care, understanding and shared humanity.", totalPoints: 1175, studentCount: 40 },
  { id: "veritas", name: "Veritas", color: "#4677E6", iconUrl: "/house-emblems/veritas-mark-v5.png", meaning: "Honesty", symbol: "Mirror", description: "Honesty asks us to reflect clearly, speak truthfully and act with integrity.", totalPoints: 1090, studentCount: 37 },
  { id: "sapientia", name: "Sapientia", color: "#602889", iconUrl: "/house-emblems/sapientia-mark-v5.png", meaning: "Wisdom", symbol: "Owl", description: "Wisdom grows through thoughtful learning, perspective and purposeful choices.", totalPoints: 960, studentCount: 39 }
];

const categories = [
  { id: "learning", name: "Learning", maxPoints: 100 },
  { id: "behaviour", name: "Behaviour", maxPoints: 100 },
  { id: "projects", name: "Projects", maxPoints: 100 },
  { id: "participation", name: "Participation", maxPoints: 100 }
];

const awards = [
  { id: "award-1", points: 35, reason: "Excellent research and thoughtful questions", createdAt: "2026-09-02T09:00:00.000Z", categoryName: "Learning", studentName: "Liliana Netland", awardedByName: "Michael Stoner", houseName: "Curiositas", houseColor: "#FFDA61", reversalOf: null },
  { id: "award-2", points: 25, reason: "Clear and confident project presentation", createdAt: "2026-08-28T09:00:00.000Z", categoryName: "Projects", studentName: "Liliana Netland", awardedByName: "Michael Stoner", houseName: "Curiositas", houseColor: "#FFDA61", reversalOf: null },
  { id: "award-3", points: 15, reason: "Helpful contribution during group work", createdAt: "2026-08-23T09:00:00.000Z", categoryName: "Behaviour", studentName: "Liliana Netland", awardedByName: "Michael Stoner", houseName: "Curiositas", houseColor: "#FFDA61", reversalOf: null }
];

export function presentationResponse(path: string): unknown {
  const user = presentationUser();
  if (path === "/api/v1/auth/me") {
    if (!user) throw new Error("Please sign in to open the presentation portal.");
    return { user };
  }
  if (path === "/api/v1/houses/leaderboard") return { houses, studentLeaders: [{ name: "Liliana Netland", houseName: "Curiositas", houseColor: "#FFDA61", totalPoints: 75 }] };
  if (path === "/api/v1/awards/mine") return {
    awards: user?.role === "student" ? awards : awards.slice().reverse(),
    totalPoints: user?.role === "student" ? 75 : 0,
    categorySummary: [
      { id: "learning", name: "Learning", totalPoints: 35, awardCount: 1 },
      { id: "projects", name: "Projects", totalPoints: 25, awardCount: 1 },
      { id: "behaviour", name: "Behaviour", totalPoints: 15, awardCount: 1 },
      { id: "participation", name: "Participation", totalPoints: 0, awardCount: 0 }
    ]
  };
  if (path === "/api/v1/categories") return { categories };
  if (path === "/api/v1/students") return { students: [{ id: "demo-student", name: "Liliana Netland", houseId: "curiositas", houseName: "Curiositas", houseColor: "#FFDA61" }] };
  if (path === "/api/v1/admin/users") return { users: accounts.map(({ login, password, ...person }) => ({ ...person, username: login, email: `${login}@lva-demo.local`, houseName: person.houseId ? "Curiositas" : null, isActive: true })) };
  if (path === "/api/v1/admin/categories") return { categories: categories.map((category) => ({ ...category, isActive: true })) };
  return {};
}
