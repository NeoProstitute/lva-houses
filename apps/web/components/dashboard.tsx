"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { type Leaderboard } from "../lib/api";
import { presentationMode, presentationResponse } from "../lib/presentation-demo";
import { HouseBoard } from "./house-board";
import { LanguageToggle } from "./language-toggle";
import { useLanguage } from "./language-provider";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function Dashboard({ initialLeaderboard }: { initialLeaderboard: Leaderboard }) {
  const { text, formatPoints, formatStudents } = useLanguage();
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  useEffect(() => {
    if (presentationMode) setLeaderboard(presentationResponse("/api/v1/houses/leaderboard") as Leaderboard);
  }, []);
  const schoolName = leaderboard.school?.name ?? "Leonardo V Academy Houses";
  const leadingHouse = leaderboard.houses[0];
  const leadingStudent = leaderboard.studentLeaders[0];
  const leadersByHouse = new Map(leaderboard.houseLeaders.map((leader) => [leader.houseId, leader]));
  return <main className="dashboard-page">
    <header className="site-header"><Logo /><nav aria-label={text.mainNavigation}><a href="#standings">{text.standings}</a><Link href="/login">{text.signIn}</Link><LanguageToggle /><ThemeToggle /><Link className="button button-dark" href="/login"><span className="portal-label-long">{text.openPortal}</span><span className="portal-label-short">{text.portal}</span><span aria-hidden="true">→</span></Link></nav></header>
    <section className="dashboard-hero"><div className="dashboard-intro"><p className="eyebrow">{schoolName}</p><h1>{text.housePoints}<br />{text.atAGlance}</h1><p>{text.overview}</p><div className="hero-actions"><Link className="button button-accent" href="/login">{text.signInPortal} <span>→</span></Link><a className="text-link" href="#standings">{text.viewAll} <span>↓</span></a></div></div><div className="leader-grid" aria-label={text.houseLeaders}><article className="leader-card leader-card-house"><p>{text.leadingHouse}</p>{leadingHouse ? <><div className="leader-main"><span className="leader-mark" style={{ background: leadingHouse.color }}>{leadingHouse.name.slice(0, 1)}</span><div><h2>{leadingHouse.name}</h2><span>{formatStudents(leadingHouse.studentCount)}</span></div></div><strong>{formatPoints(leadingHouse.totalPoints)}</strong></> : <p className="leader-empty">{text.standingsEmpty}</p>}</article><article className="leader-card leader-card-student"><p>{text.leadingStudent}</p>{leadingStudent ? <><div className="leader-main"><span className="leader-mark leader-person" style={{ background: leadingStudent.houseColor }}>{leadingStudent.name.slice(0, 1)}</span><div><h2>{leadingStudent.name}</h2><span>{leadingStudent.houseName}</span></div></div><strong>{formatPoints(leadingStudent.totalPoints)}</strong></> : <p className="leader-empty">{text.achievementsEmpty}</p>}</article></div></section>
    <section className="dashboard-details" aria-label={text.everyPointTitle}><p><strong>{text.studentsTitle}</strong> {text.studentsDescription}</p><p><strong>{text.teachersTitle}</strong> {text.teachersDescription}</p><p><strong>{text.everyPointTitle}</strong> {text.everyPointDescription}</p></section>
    <section className="house-leaders" aria-labelledby="house-leaders-title"><div className="section-heading"><div><p className="eyebrow">{text.houseLeaders}</p><h2 id="house-leaders-title">{text.bestInHouse}</h2></div><span className="updated">{text.recognitionAcademy}</span></div><div className="house-leader-grid">{leaderboard.houses.map((house) => { const leader = leadersByHouse.get(house.id); return <article className="house-leader-card" key={house.id} style={{ "--house": house.color } as CSSProperties}><span className="leader-mark leader-person">{leader?.name.slice(0, 1) ?? "—"}</span><div><p>{house.name}</p><h3>{leader?.name ?? text.noLeader}</h3><span>{leader ? formatPoints(leader.totalPoints) : text.firstAchievement}</span></div></article>; })}</div></section>
    <div id="standings" className="board-wrap"><HouseBoard houses={leaderboard.houses} title={text.everyHouse} isPreview={leaderboard.isPreview} /></div>
    <footer><Logo /><p>© 2026 Leonardo V Academy Houses</p></footer>
  </main>;
}
