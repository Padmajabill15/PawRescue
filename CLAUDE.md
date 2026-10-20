# PawRescue – Animal Rescue Platform

## What it is
Users report injured animals (photos + GPS). Nearest verified NGOs accept, rescue,
treat, and post status updates with images. Admin verifies/approves NGOs and
oversees everything. Emergency mode: SOS report via Google sign-in, no full registration.

## Stack
- web/: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Framer Motion
- api/: Node + Express + TypeScript + Mongoose (MongoDB Atlas)
- ml/: Python FastAPI (later phase)
- Monorepo with npm workspaces. Dev OS: Windows 11 (PowerShell).

## Roles & auth (Phase 2 done)
user | ngo | admin. JWT in httpOnly cookie `token`; web proxies /api -> API (next.config rewrites).
- Dashboards: /dashboard/user, /dashboard/ngo, /dashboard/admin; web/src/middleware.ts redirects by role (jose, shared JWT_SECRET)
- api: requireAuth + requireRole() in api/src/middleware/auth.ts
- NGO applies at /ngo/apply -> User(role ngo) + Ngo(pending); login blocked until admin approves
- First admin auto-created from ADMIN_EMAIL/ADMIN_PASSWORD in api/.env
- Google sign-in (users only, emergency flag) via GOOGLE_CLIENT_ID / NEXT_PUBLIC_GOOGLE_CLIENT_ID

## Rescue flow (Phase 3 done)
- api/src/services/request.service.ts: create (geo-match approved NGOs by their serviceRadiusKm), nearby ($geoNear), accept (atomic), status flow, treatment updates
- Photos: multer -> Cloudinary if CLOUDINARY_* set, else api/uploads served at /api/uploads
- Severity: rule-based utils/triage.ts (ML replaces later)
- web: Leaflet/OSM maps in components/map (dynamic, ssr:false); ReportForm used by /dashboard/user/report and /sos

## Realtime & alerts (Phase 4 done)
- socket.io on the API (services/realtime.ts); rooms user:<id> and admins. Client gets a 5-min socket token from /api/auth/socket-token (session cookie stays httpOnly) and connects to NEXT_PUBLIC_SOCKET_URL
- Events: request:new, request:taken, request:updated, notification:new. Web hook: useRealtime(event, fn)
- Notifications persisted (models/Notification.ts, 60-day TTL) + bell in navbar + sonner toasts + optional desktop alerts
- Escalation job (services/escalation.service.ts, every 60s): unaccepted after 10 min (SOS 5 min) -> NGOs within 30 km + admins; second level -> admins again

## AI service (Phase 5 done)
- ml/: FastAPI + CLIP (openai/clip-vit-base-patch32, zero-shot, prompt ensembles in app/labels.py). Endpoints /health, /species, /analyze
- Severity = explainable score 0-100 (app/severity.py): text rules + photo injury prob + SOS flag, with reasons
- API calls it via services/ml.service.ts (timeout, null on failure -> keyword fallback utils/triage.ts); stores request.ai + embedding (select:false)
- Duplicates: same area (500 m) + 48 h + open + cosine >= 0.9 -> duplicateOf; NGOs not re-alerted, duplicate reporters follow the original
- Setup: npm run setup:ml (Python 3.12 venv in ml/.venv); npm run dev starts web + api + ml

## Analytics (Phase 6 done)
- api/src/services/analytics.service.ts: one $facet aggregation (KPIs, daily trend, species, severity, weekday x hour, response times, map points) + NGO leaderboard + rule-based insights; CSV export
- Demo data: services/demo.service.ts (seeded PRNG, isDemo flag, @demo.pawrescue.dev users); POST /api/admin/demo-data {action: seed|purge}; excluded from NGO lists + escalation
- web: /dashboard/admin/analytics (Recharts, CSS chart vars in globals.css, Leaflet PointsMap)

## Phase 7 (polish/deploy)
- middleware/rateLimit.ts (in-memory): auth 20/15min, reports 10/10min, api 600/min
- render.yaml (API), ml/Dockerfile (HF Spaces, port 7860), Vercel root = web. README has the deploy table

## Conventions
- TypeScript strict, async/await, Zod for validation
- api: routes -> controllers -> services -> models
- Env vars in .env (never commit), provide .env.example
- GeoJSON Point for locations, 2dsphere index

## Working rules
- Write code, skip long explanations. Brief summary of files changed at the end.
- Don't add tests, docs, or extra features unless asked.
- Don't re-read files you just wrote. Only touch files needed for the task.
