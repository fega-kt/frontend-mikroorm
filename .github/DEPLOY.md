# Deployment Setup

The deploy workflow (`.github/workflows/deploy.yml`) runs on every push to `main`. It requires the following GitHub **Secrets** and **Variables** to be configured in the repository settings.

## Secrets

| Name | Description |
|------|-------------|
| `VAULT_TOKEN` | Token to authenticate with HashiCorp Vault |
| `SERVER_SSH_KEY` | Private SSH key used to connect to the production server |
| `SERVER_HOST` | Hostname of the production server (via Cloudflare Access tunnel) |
| `SERVER_USER` | SSH username on the production server |
| `SERVER_DEPLOY_PATH` | Absolute path on the server where `docker-compose.yml` lives |
| `CF_ACCESS_CLIENT_ID` | Cloudflare Access service token client ID (for SSH proxy) |
| `CF_ACCESS_CLIENT_SECRET` | Cloudflare Access service token client secret |
| `GHCR_PAT` | GitHub Personal Access Token with `read:packages` scope (to pull image on server) |

> `GITHUB_TOKEN` is provided automatically by GitHub Actions — no setup needed.

## Variables

| Name | Description |
|------|-------------|
| `VAULT_AUTH_METHOD` | Auth method for Vault (e.g. `token`) |
| `VAULT_SECRET_PATH` | Path to the secret in Vault (e.g. `secret/data/frontend`) |

## Deploy flow

1. **test** — runs `pnpm test`
2. **build-and-push** — fetches env from Vault, builds Docker image, pushes to `ghcr.io`
3. **deploy** — SSHs into server via Cloudflare tunnel, pulls new image, restarts container with `docker compose up -d`
