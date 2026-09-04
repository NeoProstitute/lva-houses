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

export type HouseLeader = StudentLeader & { houseId: string };

export type Leaderboard = {
  school: { name: string; slug: string } | null;
  houses: House[];
  studentLeaders: StudentLeader[];
  houseLeaders: HouseLeader[];
  isPreview?: boolean;
};

export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000");
export const serverApiUrl = (process.env.API_INTERNAL_URL ?? apiUrl) || "http://localhost:4000";
export const presentationMode = process.env.NEXT_PUBLIC_PRESENTATION_MODE === "true";

const previewLeaderboard: Leaderboard = {
  school: { name: "Leonardo V Academy Houses", slug: "leonardo-v-academy-houses" },
  houses: [
    { id: "00000000-0000-4000-8000-000000000001", name: "Curiositas", color: "#FFDA61", iconUrl: "/house-emblems/curiositas-mark-v5.png", meaning: "Curiosity", symbol: "Set of keys", description: "Illumination begins with questions, discovery and the courage to unlock new knowledge.", totalPoints: 75, studentCount: 1 },
    { id: "00000000-0000-4000-8000-000000000002", name: "Humanitas", color: "#EE3F6C", iconUrl: null, meaning: "Empathy", symbol: "Hand", description: "Empathy brings people together through care, understanding and shared humanity.", totalPoints: 68, studentCount: 1 },
    { id: "00000000-0000-4000-8000-000000000003", name: "Veritas", color: "#4677E6", iconUrl: "/house-emblems/veritas-mark-v5.png", meaning: "Honesty", symbol: "Mirror", description: "Honesty asks us to reflect clearly, speak truthfully and act with integrity.", totalPoints: 62, studentCount: 1 },
    { id: "00000000-0000-4000-8000-000000000004", name: "Sapientia", color: "#602889", iconUrl: "/house-emblems/sapientia-mark-v5.png", meaning: "Wisdom", symbol: "Owl", description: "Wisdom grows through thoughtful learning, perspective and purposeful choices.", totalPoints: 58, studentCount: 1 }
  ],
  studentLeaders: [
    { name: "Liliana Netland", houseName: "Curiositas", houseColor: "#FFDA61", totalPoints: 75 },
    { name: "Doria the exploria", houseName: "Humanitas", houseColor: "#EE3F6C", totalPoints: 68 },
    { name: "Kanye Wesley", houseName: "Veritas", houseColor: "#4677E6", totalPoints: 62 },
    { name: "Oliver Tree", houseName: "Sapientia", houseColor: "#602889", totalPoints: 58 }
  ],
  houseLeaders: [
    { houseId: "00000000-0000-4000-8000-000000000001", name: "Liliana Netland", houseName: "Curiositas", houseColor: "#FFDA61", totalPoints: 75 },
    { houseId: "00000000-0000-4000-8000-000000000002", name: "Doria the exploria", houseName: "Humanitas", houseColor: "#EE3F6C", totalPoints: 68 },
    { houseId: "00000000-0000-4000-8000-000000000003", name: "Kanye Wesley", houseName: "Veritas", houseColor: "#4677E6", totalPoints: 62 },
    { houseId: "00000000-0000-4000-8000-000000000004", name: "Oliver Tree", houseName: "Sapientia", houseColor: "#602889", totalPoints: 58 }
  ],
  isPreview: true
};

function presentationLeaderboard(): Leaderboard {
  const basePath = process.env.GITHUB_ACTIONS === "true" ? "/lva-houses" : "";
  return {
    ...previewLeaderboard,
    isPreview: false,
    houses: previewLeaderboard.houses.map((house) => ({ ...house, iconUrl: house.iconUrl ? `${basePath}${house.iconUrl}` : null }))
  };
}

export async function getLeaderboard(): Promise<Leaderboard> {
  if (presentationMode) return presentationLeaderboard();
  try {
    const response = await fetch(`${serverApiUrl}/api/v1/houses/leaderboard`, { cache: "no-store" });
    if (!response.ok) return process.env.NODE_ENV === "development" || presentationMode ? { ...previewLeaderboard, isPreview: !presentationMode } : { school: null, houses: [], studentLeaders: [], houseLeaders: [] };
    return response.json() as Promise<Leaderboard>;
  } catch {
    return process.env.NODE_ENV === "development" || presentationMode ? { ...previewLeaderboard, isPreview: !presentationMode } : { school: null, houses: [], studentLeaders: [], houseLeaders: [] };
  }
}

export function getPresentationHouse(id: string): House | null {
  if (!presentationMode) return null;
  return presentationLeaderboard().houses.find((house) => house.id === id) ?? null;
}

export function presentationHouseIds() {
  return previewLeaderboard.houses.map((house) => ({ id: house.id }));
}
