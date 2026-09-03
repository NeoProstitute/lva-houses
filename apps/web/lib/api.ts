export type House = {
  id: string;
  name: string;
  color: string;
  iconUrl: string | null;
  meaning: string;
  symbol: string;
  description: string;
  totalPoints: number;
  studentCount: number;
};

export type StudentLeader = {
  name: string;
  houseName: string;
  houseColor: string;
  totalPoints: number;
};

export type Leaderboard = {
  school: { name: string; slug: string } | null;
  houses: House[];
  studentLeaders: StudentLeader[];
  isPreview?: boolean;
};

export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000");
export const serverApiUrl = (process.env.API_INTERNAL_URL ?? apiUrl) || "http://localhost:4000";

const previewLeaderboard: Leaderboard = {
  school: { name: "Leonardo V Academy Houses", slug: "leonardo-v-academy-houses" },
  houses: [
    { id: "00000000-0000-4000-8000-000000000001", name: "Curiositas", color: "#FFDA61", iconUrl: "/house-emblems/curiositas-mark-v5.png", meaning: "Curiosity", symbol: "Set of keys", description: "Illumination begins with questions, discovery and the courage to unlock new knowledge.", totalPoints: 1280, studentCount: 38 },
    { id: "00000000-0000-4000-8000-000000000002", name: "Humanitas", color: "#EE3F6C", iconUrl: null, meaning: "Empathy", symbol: "Hand", description: "Empathy brings people together through care, understanding and shared humanity.", totalPoints: 1175, studentCount: 40 },
    { id: "00000000-0000-4000-8000-000000000003", name: "Veritas", color: "#4677E6", iconUrl: "/house-emblems/veritas-mark-v5.png", meaning: "Honesty", symbol: "Mirror", description: "Honesty asks us to reflect clearly, speak truthfully and act with integrity.", totalPoints: 1090, studentCount: 37 },
    { id: "00000000-0000-4000-8000-000000000004", name: "Sapientia", color: "#602889", iconUrl: "/house-emblems/sapientia-mark-v5.png", meaning: "Wisdom", symbol: "Owl", description: "Wisdom grows through thoughtful learning, perspective and purposeful choices.", totalPoints: 960, studentCount: 39 }
  ],
  studentLeaders: [
    { name: "Jordan L.", houseName: "Aster", houseColor: "#5B5CE2", totalPoints: 215 },
    { name: "Mia R.", houseName: "Cedar", houseColor: "#0E8F6A", totalPoints: 202 },
    { name: "Kai S.", houseName: "Ember", houseColor: "#D65A34", totalPoints: 194 }
  ],
  isPreview: true
};

export async function getLeaderboard(): Promise<Leaderboard> {
  try {
    const response = await fetch(`${serverApiUrl}/api/v1/houses/leaderboard`, { cache: "no-store" });
    if (!response.ok) return process.env.NODE_ENV === "development" ? previewLeaderboard : { school: null, houses: [], studentLeaders: [] };
    return response.json() as Promise<Leaderboard>;
  } catch {
    return process.env.NODE_ENV === "development" ? previewLeaderboard : { school: null, houses: [], studentLeaders: [] };
  }
}
