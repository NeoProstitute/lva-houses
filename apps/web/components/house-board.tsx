import Link from "next/link";
import type { CSSProperties } from "react";
import type { House } from "../lib/api";
import { useLanguage } from "./language-provider";

export function HouseBoard({ houses, title = "The house table", isPreview = false }: { houses: House[]; title?: string; isPreview?: boolean }) {
  const { text, translateBuiltin, formatPoints } = useLanguage();
  if (!houses.length) {
    return <section className="empty-state"><p>{text.resultsEmpty}</p></section>;
  }

  return (
    <section aria-labelledby="house-table-title" className="house-board">
      <div className="section-heading"><div><p className="eyebrow">{text.meetHouses}</p><h2 id="house-table-title">{title}</h2></div><span className="updated">{text.chooseHouse}</span></div>
      <div className="house-card-grid">
        {houses.map((house) => {
          const content = <>
            <div className={`house-card-art${house.iconUrl ? "" : " house-card-art-color"}`} style={{ "--house": house.color } as CSSProperties}>
              {house.iconUrl ? <img src={house.iconUrl} alt="" /> : <span aria-hidden="true" />}
            </div>
            <div className="house-card-copy"><p>{translateBuiltin(house.meaning || text.houses)}</p><h3>{house.name}</h3><span>{translateBuiltin(house.description || text.sharedPlace)}</span></div>
            <div className="house-card-meta"><span>{translateBuiltin(house.symbol || text.houseIdentity)}</span><strong>{formatPoints(house.totalPoints)}</strong></div>
          </>;
          const style = { "--house": house.color } as CSSProperties;
          return isPreview ? <article className="house-card" key={house.id} style={style}>{content}</article> : <Link className="house-card" key={house.id} href={`/houses/${house.id}`} style={style} aria-label={`${text.explore}: ${house.name}`}>{content}</Link>;
        })}
      </div>
    </section>
  );
}
