# 1. Dependencias de desenvolvimento e compilacao
FROM node:24-bookworm-slim AS deps
WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY apps/server/package*.json ./apps/server/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/engine/package*.json ./packages/engine/

RUN --mount=type=cache,target=/root/.npm npm ci

# 2. Compilacao de pacotes e aplicacoes
FROM deps AS build
WORKDIR /app

COPY . .
RUN npm run build
RUN npx esbuild apps/server/src/index.ts --platform=node --format=esm --packages=external --bundle --outfile=apps/server/dist/index.js && \
    mkdir -p packages/shared/dist

# 3. Dependencias de producao exclusivas para o servidor
FROM node:24-bookworm-slim AS prod-deps
WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY apps/server/package*.json ./apps/server/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/engine/package*.json ./packages/engine/

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --workspace @sgm/server

# 4. Imagem final de runtime
FROM node:24-bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends tini && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3001

LABEL org.opencontainers.image.title="Sistema Gerenciador de Mesas" \
      org.opencontainers.image.description="VTT e Ferramenta do Mestre para RPG" \
      org.opencontainers.image.vendor="SGM" \
      org.opencontainers.image.licenses="UNLICENSED"

COPY --chown=node:node --from=prod-deps /app/package.json ./package.json
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=prod-deps /app/apps/server/package.json ./apps/server/package.json
COPY --chown=node:node --from=prod-deps /app/packages/shared/package.json ./packages/shared/package.json
COPY --chown=node:node --from=build /app/apps/server/dist ./apps/server/dist
COPY --chown=node:node --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --chown=node:node --from=build /app/apps/web/dist ./apps/web/dist

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3001) + '/healthz').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "apps/server/dist/index.js"]
