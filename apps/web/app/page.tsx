import Link from "next/link";
import type { CSSProperties } from "react";
import { HouseBoard } from "../components/house-board";
import { Logo } from "../components/logo";
import { ThemeToggle } from "../components/theme-toggle";
import { getLeaderboard } from "../lib/api";

export default async function Home() {
  const leaderboard = await getLeaderboard();
  const schoolName = leaderboard.school?.name ?? "Leonardo V Academy Houses";
  const leadingHouse = leaderboard.houses[0];
  const leadingStudent = leaderboard.studentLeaders[0];
  const leadersByHouse = new Map(leaderboard.houseLeaders.map((leader) => [leader.houseId, leader]));
  return (
    <main className="dashboard-page">
      <header className="site-header"><Logo /><nav aria-label="Main navigation"><a href="#standings">Standings</a><Link href="/login">Sign in</Link><ThemeToggle /><Link className="button button-dark" href="/login"><span className="portal-label-long">Open your portal</span><span className="portal-label-short">Portal</span><span aria-hidden="true">→</span></Link></nav></header>
      <section className="dashboard-hero">
        <div className="dashboard-intro"><p className="eyebrow">{schoolName}</p><h1>House points<br />at a glance.</h1><p>See how every house is progressing, celebrate individual effort, and sign in to explore your own point story.</p><div className="hero-actions"><Link className="button button-accent" href="/login">Sign in to your portal <span>→</span></Link><a className="text-link" href="#standings">View all houses <span>↓</span></a></div></div>
        <div className="leader-grid" aria-label="Current leaders">
          <article className="leader-card leader-card-house"><p>Leading house</p>{leadingHouse ? <><div className="leader-main"><span className="leader-mark" style={{ background: leadingHouse.color }}>{leadingHouse.name.slice(0, 1)}</span><div><h2>{leadingHouse.name}</h2><span>{leadingHouse.studentCount} students</span></div></div><strong>{leadingHouse.totalPoints.toLocaleString("en-US")} <small>points</small></strong></> : <p className="leader-empty">Standings will appear once the school is set up.</p>}</article>
          <article className="leader-card leader-card-student"><p>Leading student</p>{leadingStudent ? <><div className="leader-main"><span className="leader-mark leader-person" style={{ background: leadingStudent.houseColor }}>{leadingStudent.name.slice(0, 1)}</span><div><h2>{leadingStudent.name}</h2><span>{leadingStudent.houseName}</span></div></div><strong>{leadingStudent.totalPoints.toLocaleString("en-US")} <small>points</small></strong></> : <p className="leader-empty">Student achievements will appear here.</p>}</article>
        </div>
      </section>
      <section className="dashboard-details" aria-label="How points work"><p><strong>Students</strong> see their points, achievements and category progress.</p><p><strong>Teachers</strong> recognise a contribution with a clear reason.</p><p><strong>Every point</strong> is recorded in a transparent ledger.</p></section>
      <section className="house-leaders" aria-labelledby="house-leaders-title"><div className="section-heading"><div><p className="eyebrow">House leaders</p><h2 id="house-leaders-title">Best student in every house</h2></div><span className="updated">Recognition across the academy</span></div><div className="house-leader-grid">{leaderboard.houses.map((house) => { const leader = leadersByHouse.get(house.id); return <article className="house-leader-card" key={house.id} style={{ "--house": house.color } as CSSProperties}><span className="leader-mark leader-person">{leader?.name.slice(0, 1) ?? "—"}</span><div><p>{house.name}</p><h3>{leader?.name ?? "No student leader yet"}</h3><span>{leader ? `${leader.totalPoints.toLocaleString("en-US")} points` : "The first achievement will appear here"}</span></div></article>; })}</div></section>
      <div id="standings" className="board-wrap"><HouseBoard houses={leaderboard.houses} title="Every house, at a glance" isPreview={leaderboard.isPreview} /></div>
      <footer><Logo /><p>© 2026 Leonardo V Academy Houses</p></footer>
    </main>
  );
}
