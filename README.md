# Leonardo V Academy Houses

Leonardo V Academy Houses is a house-points platform for a school. It makes achievements visible, keeps house standings clear and gives each role a focused portal.

## What it does

- The public dashboard shows every house, its points and the current student leader for each house.
- Students see their own points, achievements and progress by category.
- Teachers award points with a category and a reason.
- Administrators manage people, houses, categories and house imagery.

## Public presentation

The public presentation site is published through GitHub Pages. Its data is illustrative and resets after a new deployment.

## Presentation accounts

| Role | Login | Password |
| --- | --- | --- |
| Student — Liliana Netland | `liliana.netland` | `LilianaHouse!2026` |
| Teacher — Michael Stoner | `michael.stoner` | `MichaelHouse!2026` |
| Administrator | `admin` | `AdminHouses!2026` |

## How to use the site

1. Open the public dashboard to see the house standings and leaders.
2. Select **Sign in** and use one of the presentation accounts above.
3. Sign in as Liliana to view a student portal: points, achievements and category progress.
4. Sign in as Michael to open the teacher portal and demonstrate awarding points.
5. Sign in as Administrator to view people, houses and category controls.
6. Use the theme button in the header to switch between light and dark modes.

## Run locally

```bash
npm install
NEXT_PUBLIC_PRESENTATION_MODE=true npm run dev:web
```

Open `http://localhost:3000`.
