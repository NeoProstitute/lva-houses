import { HouseHistory } from "../../../components/house-history";
import { getPresentationHouse, presentationHouseIds, serverApiUrl, type House } from "../../../lib/api";
import { presentationHouseHistory } from "../../../lib/presentation-demo";

type HistoryEntry = { period: string; totalPoints: number; awardCount: number };
type HouseProfile = Pick<House, "id" | "name" | "color" | "iconUrl" | "meaning" | "symbol" | "description">;

export function generateStaticParams() {
  return presentationHouseIds();
}

export default async function HouseHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let history: HistoryEntry[] = [];
  let house: HouseProfile | null = getPresentationHouse(id);
  if (house) history = presentationHouseHistory(house.id);
  try {
    const response = house ? null : await fetch(`${serverApiUrl}/api/v1/houses/${id}/history?period=week`, { cache: "no-store" });
    if (response?.ok) {
      const payload = await response.json() as { house: Omit<HouseProfile, "id">; history: HistoryEntry[] };
      house = { ...payload.house, id };
      history = payload.history;
    }
  } catch { /* The page retains a clear empty state if the API is unavailable. */ }
  return <HouseHistory house={house} initialHistory={history} />;
}
