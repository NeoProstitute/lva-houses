# Leonardo V Academy Houses

Leonardo V Academy Houses is a school house-points platform. It makes achievements visible, keeps house standings clear, and gives each person a focused portal.

## What the system does

- The public dashboard shows house standings and the current leading student in each house.
- Students see their own points, achievement history and progress by category.
- Teachers recognise contributions with points, a category and a clear reason.
- School administrators manage people, houses, categories and house imagery.
- Password recovery is handled through the school email system once it is configured.

## Public preview

GitHub Pages publishes a browser-only preview of the interface. It uses sample data and keeps any changes in the visitor's browser, so it does not connect to the production database.

| Role | Login | Password |
| --- | --- | --- |
| Student | `liliana.netland` | `LilianaHouse!2026` |
| Teacher | `michael.stoner` | `MichaelHouse!2026` |
| School administrator | `admin` | `AdminHouses!2026` |

Use **Reset demo** in the portal to restore the original sample data.

## Documentation for the school

Start with the guide that matches the reader:

- [System Administrator Guide](docs/SYSTEM_ADMINISTRATOR_GUIDE.md) — production hosting, HTTPS, email delivery, backups, monitoring, first-time setup and updates.
- [Teacher and School Administrator Guide](docs/TEACHER_AND_SCHOOL_ADMIN_GUIDE.md) — daily awarding of points, correcting mistakes, account management and categories.

## Production deployment

The provided production configuration runs the web application, API, PostgreSQL, Redis, automatic HTTPS and scheduled database backups through Docker Compose.

1. Read the [System Administrator Guide](docs/SYSTEM_ADMINISTRATOR_GUIDE.md).
2. Copy `.env.production.example` to `.env.production` and set all real production values.
3. Start the service:

```bash
docker compose -f docker-compose.production.yml up -d --build
```

4. Complete first-time setup at `/setup` on the school domain.

Never commit `.env.production` or use presentation passwords in a school deployment.

## Local development

Install dependencies and start both services locally:

```bash
npm install
npm run dev:api
npm run dev:web
```

For a browser-only presentation version, use:

```bash
NEXT_PUBLIC_PRESENTATION_MODE=true npm run dev:web
```

The presentation version stores its sample changes only in that browser and provides **Reset demo** to restore the sample data. It is not a production database.

## Quality checks

```bash
npm run typecheck
npm test
npm run build
```
