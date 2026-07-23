# GitHub & CI/CD — perform6-admin

## Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR / `develop` | Build, typecheck, Docker test |
| `docker-publish.yml` | `main`, `v*` tags | Push to GHCR |
| `deploy.yml` | After publish / manual | SSH → VPS Docker |

## Secrets

| Secret | Purpose |
|--------|---------|
| `DEPLOY_HOST` | VPS hostname |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_SSH_KEY` | Private key |
| `DEPLOY_PATH` | Optional path (default `/opt/perform6/perform6-admin`) |

## Variables

| Variable | Example |
|----------|---------|
| `VITE_API_BASE_URL` | `https://api.perform6.com/api/v1` |

## Cloudflare

Point `admin.perform6.com` to VPS (nginx container) or use Cloudflare Pages as alternative — this repo defaults to **Docker on VPS** behind Cloudflare proxy.
