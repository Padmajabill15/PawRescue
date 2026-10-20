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

## Conventions
- TypeScript strict, async/await, Zod for validation
- api: routes -> controllers -> services -> models
- Env vars in .env (never commit), provide .env.example
- GeoJSON Point for locations, 2dsphere index

## Working rules
- Write code, skip long explanations. Brief summary of files changed at the end.
- Don't add tests, docs, or extra features unless asked.
- Don't re-read files you just wrote. Only touch files needed for the task.
