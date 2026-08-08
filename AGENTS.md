<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PureRun — AI Runner Companion

## Architecture
- **Framework**: Next.js 16 (App Router, React 19, TypeScript strict)
- **Database**: Local SQLite via Prisma ORM + `@prisma/adapter-libsql`. Schema at `prisma/schema.prisma`
- **AI**: Google Gemini (`gemini-2.0-flash`) via `@google/generative-ai`
- **Data Source**: Garmin Connect via `garmin-connect` package
- **Charts**: ECharts (`echarts-for-react`). Maps: Leaflet (`react-leaflet`, must be `ssr: false`)
- **Styling**: Tailwind CSS 4. Dark theme. Primary color: emerald green
- **Deploy**: Docker (standalone output) / Vercel / Local Node.js

## Core Data Flow
```
Garmin Connect → /api/garmin/sync → SQLite (GarminActivity, GarminStats)
                                        ↓
                              Science Engine (VDOT, TRIMP, PMC)
                                        ↓
                              FitnessStatus (CTL/ATL/TSB)
                                        ↓
                    scheduler.ts generates base plan (rule-based)
                                        ↓
                    Gemini AI enriches descriptions (keeps scheduler's paces/types)
                                        ↓
                              TrainingPlan + Workout → Calendar UI
```

## Data Models (5 tables in Prisma)
- **GarminStats** — Aggregated stats. Always one row (`id = 'latest'`), overwritten on sync
- **GarminActivity** — Per-run data. PK: `activityId` (BigInt from Garmin). Includes `hrZones`, `splits`, `metricsData`, `routeData` as JSON
- **TrainingPlan** → has many **Workout** — AI-generated plans. Workout has `status`: Pending / Completed / Missed
- **FitnessStatus** — PMC indicators. Always one row (`id = 'latest'`)

## Science Engine (`src/lib/science/`)
- `vdot.ts` — Jack Daniels VDOT estimation + pace zones (E/M/T/I/R)
- `load.ts` — TRIMP (Banister) and hrTSS calculation
- `pmc.ts` — PMC model: CTL (42-day EWMA), ATL (7-day EWMA), TSB = CTL - ATL
- `scheduler.ts` — Rule-based weekly planner. Periodization: Base→Build→Peak→Taper. Adjusts load by TSB

## Key Design Decisions
- **Privacy First**: Garmin credentials stored in browser `localStorage` only, never persisted server-side
- **Dual Engine**: Science engine produces hard schedule → Gemini only adds coaching descriptions → safety override layer forces science values back into AI output to prevent hallucination
- **Leaflet SSR**: All Leaflet components must use `next/dynamic` with `ssr: false` (`RealMapWrapper.tsx` pattern)
- **Singleton DB**: `src/lib/db.ts` caches PrismaClient on `globalThis` to survive HMR in dev
- **Rate Limit**: Garmin sync inserts 2-second delays between activity fetches

## Conventions
- Language: TypeScript strict. UI text in Traditional Chinese (繁體中文)
- Server Components for data fetching; Client Components (`'use client'`) for interactivity
- DB queries in `src/lib/` or inline in Server Components, never in Client Components
- API routes return `NextResponse.json()`. Errors return appropriate HTTP status codes
- Garmin activity IDs are `BigInt` — must convert to `string` before passing to Client Components

## Hard Constraints
- Never modify `prisma/dev.db` directly — always use Prisma Client or `prisma db push`
- Never import Leaflet in a Server Component — always use dynamic import with `ssr: false`
- Never persist Garmin passwords to database or filesystem
- Never let AI override science engine's pace/type values — always apply safety overwrite after Gemini response
- All science module changes must pass existing Vitest tests (`*.test.ts`)

## Commands
```
npm run dev          # Start dev server
npm run build        # Prisma db push + Next.js build
npm run setup        # Install deps + init DB + start dev
npm run test         # Vitest (science modules)
npm run test:watch   # Vitest watch mode
npm run lint         # ESLint
npm run tunnel       # Cloudflare tunnel to localhost:3000
```

## Directory Layout
```
src/app/           → Pages (/, /activity, /activity/[id], /plan, /settings)
src/app/api/       → API routes (auth, garmin sync, ai generate, activities)
src/components/    → React components (Calendar, ScienceEngine, AiPanel, charts/)
src/lib/           → Core logic (db, credentials, garmin, gemini, science/)
prisma/            → Schema + SQLite database file
public/gpx/        → Downloaded GPX route files
```