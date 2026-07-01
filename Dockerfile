FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc* ./
RUN pnpm install --frozen-lockfile

ARG GIT_COMMIT=unknown
ARG GIT_BRANCH=unknown
ARG BUILD_TIME=unknown

ENV GIT_COMMIT=$GIT_COMMIT \
    GIT_BRANCH=$GIT_BRANCH \
    BUILD_TIME=$BUILD_TIME

COPY . .
RUN --mount=type=secret,id=vault_token \
    VAULT_TOKEN=$(cat /run/secrets/vault_token) \
    VAULT_AUTH_METHOD=token \
    node_modules/.bin/vault-start prod -- pnpm build

# ---

FROM nginx:alpine AS runner
COPY --from=builder /app/build /usr/share/nginx/html
COPY .docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
