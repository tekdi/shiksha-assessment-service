# Node.js Upgrade Test Report – LMS Assessment Service

Date: 2026-11-05 · Branch: `ass-3nov`

## Upgrade
Node.js `20-alpine` → `24.22.1-alpine` (resolved to Node v24.22.1 in containers).

## Files changed
| File | Change |
|---|---|
| `Dockerfile` (repo root; there is no `app/` directory) | All three `FROM node:20-alpine` lines (`base`, `development`, `production`) changed to `FROM node:24.22.1-alpine`. |

The request named only the `base` stage. I changed all three so the build and runtime stages use the same Node version (`node_modules` is copied from `base` into `production`). No other files were modified.

## Docker build results
| Command | Result |
|---|---|
| `docker build --target production` | Success. Image tag `assessment-node24:prod`. `npm install --legacy-peer-deps` and `nest build` both succeeded. |
| `docker build --target development` | Success. Image tag `assessment-node24:dev`. |
| `node -v` inside both images | `v24.22.1` |

Build warnings (none caused by Node 24, no action taken):
- npm deprecation notices for `inflight`, `glob@7` and `cache-manager-redis-yet`.
- An npm notice about install scripts not covered by `allowScripts` (`@nestjs/core`, `msgpackr-extract`, `unrs-resolver`).
- The legacy Docker builder deprecation notice.

## Issues and fixes
No Node 24 compatibility issues were found, so no code changes were needed.

Observations unrelated to the upgrade (not changed):
- `src/config/database.config.ts:40` forces SSL to Postgres when `NODE_ENV=production`. My non-SSL test DB rejected the connection ("The server does not support SSL connections"). I ran the smoke test with `NODE_ENV=development` instead.
- `docker-compose.yml` uses `version: "3.6"`, which is obsolete. I did not run compose.

## Tests actually executed
| Test | Result |
|---|---|
| `npx tsc --noEmit` (local, on the host's Node 20) | Passed, no errors. It checks the types only and is not a Node 24 test. |
| `npx jest` inside the Node 24 dev image | **No tests exist.** There are 0 `*.spec.ts` files and no `test/` directory, so Jest exited with "No tests found". The unit and e2e suites are not run and not verified. |
| Runtime smoke test of the Node 24 production image against throwaway `postgres:15-alpine` and `redis:7-alpine` containers | See below. |

Smoke test results:
- The app booted and logged "Nest application successfully started". All routes were mapped. The Swagger page was reported at `/api`.
- `GET /health/ready` returned 200 with database up.
- `GET /health/live` returned 200.
- `GET /api-json` returned 200.
- `GET /health` returned 503 because `USER_SERVICE_URL` and `LMS_SERVICE_URL` were not configured. This is expected in the test setup. The database and redis checks inside it were both "up".
- The Docker `HEALTHCHECK` reported `healthy`.
- The only warning in the logs was `DEVREV_AGENT_ID or DEVREV_WEBHOOK_ID not set`, which is a missing-config message.
- The BullMQ repeatable AI-feedback retry job registered.

## Services verified
- NestJS application bootstrap on Node 24.
- PostgreSQL connectivity (TypeORM).
- Redis connectivity (health check reports up).
- Health endpoints, the Swagger JSON endpoint, and the container healthcheck.

## Remaining issues and not verified
- No automated tests exist, so there is no unit or e2e coverage of business logic under Node 24.
- The test database had no tables (`\dt` showed none), so I did not run migrations and did not call any database-backed API endpoints. Query and CRUD behaviour under Node 24 is unverified.
- The external integrations were not tested: user-service, lms-service, DevRev and the AI feedback webhook. No URLs or credentials were available.
- I did not test file uploads (the `uploads` volume) or authenticated flows.
- The `docker-compose` flow was not run.
- The test containers have been removed.
