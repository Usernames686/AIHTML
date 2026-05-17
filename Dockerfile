# syntax=docker/dockerfile:1.7

FROM python:3.11-slim-trixie AS fastapi-builder

WORKDIR /app/servers/fastapi

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

RUN python -m venv --without-pip /opt/venv \
    && pip install --no-cache-dir uv

COPY servers/fastapi/pyproject.toml servers/fastapi/uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv export --frozen --no-dev --no-emit-project -o /tmp/requirements.txt \
    && uv pip install --python /opt/venv/bin/python -r /tmp/requirements.txt

COPY servers/fastapi /app/servers/fastapi
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --python /opt/venv/bin/python --no-deps .

FROM node:20-bookworm-slim AS nextjs-builder

WORKDIR /app/servers/nextjs

ENV NEXT_TELEMETRY_DISABLED=1

COPY servers/nextjs/package.json servers/nextjs/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY servers/nextjs /app/servers/nextjs
RUN npm run build \
    && rm -rf .next-build/cache


FROM python:3.11-slim-trixie AS runtime

WORKDIR /app

ENV APP_DATA_DIRECTORY=/app_data \
    TEMP_DIRECTORY=/tmp/presenton \
    PRESENTON_APP_ROOT=/app \
    PATH="/opt/venv/bin:${PATH}" \
    NODE_ENV=production \
    MEM0_ENABLED=false \
    START_OLLAMA=false

RUN set -eux; \
    packages="ca-certificates curl nginx fontconfig"; \
    apt-get update; \
    apt-get install -y --no-install-recommends $packages; \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -; \
    apt-get install -y --no-install-recommends nodejs; \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/scripts /app/servers/fastapi /app/servers/nextjs
RUN mkdir -p /app_data/exports /app_data/images /app_data/uploads /app_data/fonts /app_data/pptx-to-html \
    && chmod -R a+rX /app_data

COPY --from=fastapi-builder /opt/venv /opt/venv
COPY --from=fastapi-builder /app/servers/fastapi /app/servers/fastapi

COPY --from=nextjs-builder /app/servers/nextjs/.next-build/standalone/ /app/servers/nextjs/
COPY --from=nextjs-builder /app/servers/nextjs/public /app/servers/nextjs/public
COPY --from=nextjs-builder /app/servers/nextjs/.next-build/static /app/servers/nextjs/.next-build/static

COPY start.js LICENSE NOTICE ./
COPY scripts/presenton-terminal-banner.mjs /app/scripts/presenton-terminal-banner.mjs
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["node", "/app/start.js"]
