FROM oven/bun:1.4
ENV DOCKER_BUILD=true
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/hooks/package.json ./packages/hooks/
COPY packages/components/package.json ./packages/components/
COPY packages/burner-connector/package.json ./packages/burner-connector/
COPY tooling/env/package.json ./tooling/env/

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --linker hoisted

COPY . .

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["bun", "run", "dev"]
