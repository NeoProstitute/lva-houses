"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { presentationHouseHistory, presentationMode } from "../lib/presentation-demo";
import { Logo } from "./logo";
import { LanguageToggle } from "./language-toggle";
import { useLanguage } from "./language-provider";
import { ThemeToggle } from "./theme-toggle";

type HistoryEntry = { period: string; totalPoints: number; awardCount: number };
type HouseProfile = { id: string; name: string; color: string; iconUrl: string | null; meaning: string; symbol: string; description: string };

export function HouseHistory({ house, initialHistory }: { house: HouseProfile | null; initialHistory: HistoryEntry[] }) {
  const { text, locale, translateBuiltin, formatPoints, formatPointEvents } = useLanguage();
  const [history, setHistory] = useState(initialHistory);
  useEffect(() => { if (presentationMode && house) setHistory(presentationHouseHistory(house.id)); }, [house]);
  const houseStyle = house ? { "--house": house.color } as CSSProperties : undefined;
  return <main className="history-page"><header className="site-header"><Logo /><div className="header-controls"><LanguageToggle /><ThemeToggle /><Link className="button button-dark" href="/"><span aria-hidden="true">←</span><span className="history-back-long">{text.backToStandings}</span><span className="history-back-short">{text.back}</span></Link></div></header>{house ? <><section className="house-profile" style={houseStyle}><div className={`house-profile-art${house.iconUrl ? "" : " house-profile-art-color"}`}>{house.iconUrl ? <img src={house.iconUrl} alt="" /> : <span aria-hidden="true" />}</div><div><p className="eyebrow">{translateBuiltin(house.meaning)}</p><h1>{house.name}</h1><p>{translateBuiltin(house.description)}</p><span className="house-symbol">{translateBuiltin(house.symbol)}</span></div></section><section className="history-hero"><p className="eyebrow">{text.houseHistory}</p><h2>{text.progressWeekly}</h2><p>{text.historyDescription}</p></section></> : <section className="history-hero"><p className="eyebrow">{text.houses}</p><h1>{text.houseNotFound}</h1></section>}<section className="history-list">{history.length ? history.map((entry) => <article key={entry.period}><time>{new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(entry.period))}</time><strong>{formatPoints(entry.totalPoints)}</strong><span>{formatPointEvents(entry.awardCount)}</span></article>) : house ? <p className="muted-block">{text.noHouseActivity}</p> : null}</section></main>;
}
