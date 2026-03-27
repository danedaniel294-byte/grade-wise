# Workspace

## Overview

GradeWise GH — A GPA/CGPA calculator web app for Ghanaian university students. Built as a pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, Wouter, React Query
- **Auth**: Session-based (express-session), username only
- **Animations**: Framer Motion

## Features

- Sign up / Sign in with username only (no password)
- 45+ Ghanaian universities with specific grading scales (KNUST, UG, UCC, UDS, UMAT, GIMPA, and standard)
- Level selection (100–600) and semester selection (1st / 2nd)
- GPA & CGPA calculator per semester and cumulative
- Animated intro splash screen (5-step Framer Motion, shown on first visit only via localStorage)
- **Enhanced Goals page**: CGPA progress bar, multi-semester planner, semester-by-semester grade recommendation table, feasibility analysis
- **Achievement badges**: 8 badges (Getting Started, Data Pioneer, Consistent, Scholar, High Achiever, First Class Aspirant, Goal Setter, Goal Achieved) — shown on Dashboard and Goals page
- **AI transcript parsing**: Upload a photo of your transcript → AI (OpenAI vision) extracts courses automatically; "AI Import" button in Dashboard course table header
- Likelihood meter (Very High / High / Moderate / Low / Very Low) for CGPA goal achievement
- Degree classification (First Class, 2nd Upper, 2nd Lower, Third Class, Pass, Fail)
- 15 color themes: ocean, forest, sunset, purple, rose, gold, midnight, crimson, teal, coffee, slate, mint, coral, electric, emerald + custom colors
- CGPA progress chart (Recharts LineChart with First Class reference line)
- Adsterra banner ads + affiliate support button
- Visit counter (count.getloli.com)
- QR share modal (qrcode.react)
- About / Privacy / Terms / Pricing info tabs in footer
- PWA support with install banner (vite-plugin-pwa)
- User profile persistence (university, level, theme, goals, semesters/courses saved to DB)
- Logout functionality

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── gradewise-gh/       # React + Vite frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/gradewise-gh` (`@workspace/gradewise-gh`)

React + Vite frontend. Serves at `/` (root). Uses shadcn/ui components, Wouter for routing, React Query for data fetching. Pages: Welcome (auth), Dashboard (GPA calculator), Goals (CGPA targets).

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes:
- `GET /api/healthz` — health check
- `POST /api/auth/signup` — sign up by username
- `POST /api/auth/signin` — sign in by username
- `POST /api/auth/signout` — sign out (destroy session)
- `GET /api/auth/me` — get current user profile
- `GET /api/universities` — list all Ghanaian universities
- `GET /api/grades/semesters` — get user's semester records
- `POST /api/grades/semesters` — save semester courses and compute GPA
- `GET /api/grades/cgpa-goal` — get CGPA goal and current CGPA
- `POST /api/grades/cgpa-goal` — save CGPA goal with required GPA calculation
- `POST /api/grades/profile` — save user profile (university, level, theme)

### `lib/db` (`@workspace/db`)

Schema:
- `usersTable` — id, username (unique), universityId, currentLevel, themeColor, customPrimaryColor, customSecondaryColor, targetCgpa, remainingCredits
- `semestersTable` — id, userId, level, semesterNumber, gpa
- `coursesTable` — id, semesterId, name, creditHours, grade, score, gradePoints

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` and `lib/api-client-react`

Generated from the OpenAPI spec via Orval.

## Notes

- Auth is session-based using `express-session`. Sessions persist in memory (dev) and use cookies with `credentials: "include"` on the frontend.
- Grading systems: KNUST, UG (University of Ghana), UCC, UDS, UMAT, GIMPA, and STANDARD (used by most other universities).
- Degree classifications are per-university thresholds (First Class ≥ 3.6 for most GH universities).
- `zod` must be imported from `"zod"` (not `"zod/v4"`) in api-server routes since esbuild bundles them.
