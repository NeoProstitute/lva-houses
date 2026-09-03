FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspace=@leonardo-v-academy/api --include-workspace-root

FROM dependencies AS build
COPY apps/api apps/api
RUN npm run build --workspace=@leonardo-v-academy/api

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S school && adduser -S school -G school
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/src/migrations ./apps/api/dist/migrations
COPY apps/api/package.json apps/api/package.json
USER school
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:4000/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["sh", "-c", "node apps/api/dist/migrate.js && node apps/api/dist/server.js"]
