import Link from "next/link";
import type { CSSProperties } from "react";
import type { House } from "../lib/api";

export function HouseBoard({ houses, title = "The house table", isPreview = false }: { houses: House[]; title?: string; isPreview?: boolean }) {
  if (!houses.length) {
    return <section className="empty-state"><p>Results will appear here once the school is set up.</p></section>;
  }

  return (
    <section aria-labelledby="house-table-title" className="house-board">
      <div className="section-heading"><div><p className="eyebrow">Meet the houses</p><h2 id="house-table-title">{title}</h2></div><span className="updated">Choose a house to learn what it stands for</span></div>
      <div className="house-card-grid">
        {houses.map((house) => {
          const content = <>
            <div className={`house-card-art${house.iconUrl ? "" : " house-card-art-color"}`} style={{ "--house": house.color } as CSSProperties}>
              {house.iconUrl ? <img src={house.iconUrl} alt="" /> : <span aria-hidden="true" />}
            </div>
            <div className="house-card-copy"><p>{house.meaning || "House"}</p><h3>{house.name}</h3><span>{house.description || "A shared place to contribute and grow."}</span></div>
            <div className="house-card-meta"><span>{house.symbol || "House identity"}</span><strong>{house.totalPoints.toLocaleString("en-US")} <small>points</small></strong></div>
          </>;
          const style = { "--house": house.color } as CSSProperties;
          return isPreview ? <article className="house-card" key={house.id} style={style}>{content}</article> : <Link className="house-card" key={house.id} href={`/houses/${house.id}`} style={style} aria-label={`Explore ${house.name}`}>{content}</Link>;
        })}
      </div>
    </section>
  );
}
