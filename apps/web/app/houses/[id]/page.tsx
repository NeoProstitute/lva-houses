import Link from "next/link";
import type { CSSProperties } from "react";
import { Logo } from "../../../components/logo";
import { ThemeToggle } from "../../../components/theme-toggle";
import { serverApiUrl, type House } from "../../../lib/api";

type HistoryEntry = { period: string; totalPoints: number; awardCount: number };
type HouseProfile = Pick<House, "name" | "color" | "iconUrl" | "meaning" | "symbol" | "description">;

export default async function HouseHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let history: HistoryEntry[] = [];
  let house: HouseProfile | null = null;
  try {
    const response = await fetch(`${serverApiUrl}/api/v1/houses/${id}/history?period=week`, { cache: "no-store" });
    if (response.ok) {
      const payload = await response.json() as { house: HouseProfile; history: HistoryEntry[] };
      house = payload.house;
      history = payload.history;
    }
  } catch { /* The page retains a clear empty state if the API is unavailable. */ }
  const houseStyle = house ? { "--house": house.color } as CSSProperties : undefined;
  return <main className="history-page"><header className="site-header"><Logo /><div className="header-controls"><ThemeToggle /><Link className="button button-dark" href="/"><span aria-hidden="true">←</span><span className="history-back-long">Back to standings</span><span className="history-back-short">Back</span></Link></div></header>{house ? <><section className="house-profile" style={houseStyle}><div className={`house-profile-art${house.iconUrl ? "" : " house-profile-art-color"}`}>{house.iconUrl ? <img src={house.iconUrl} alt="" /> : <span aria-hidden="true" />}</div><div><p className="eyebrow">{house.meaning}</p><h1>{house.name}</h1><p>{house.description}</p><span className="house-symbol">{house.symbol}</span></div></section><section className="history-hero"><p className="eyebrow">House history</p><h2>Progress, one week at a time.</h2><p>Weekly totals reflect the same append-only ledger used by staff and students.</p></section></> : <section className="history-hero"><p className="eyebrow">House</p><h1>House not found.</h1></section>}<section className="history-list">{history.length ? history.map((entry) => <article key={entry.period}><time>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(entry.period))}</time><strong>{entry.totalPoints.toLocaleString("en-US")} points</strong><span>{entry.awardCount} point events</span></article>) : house ? <p className="muted-block">No house activity has been recorded yet.</p> : null}</section></main>;
}
