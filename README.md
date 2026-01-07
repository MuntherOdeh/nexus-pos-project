# NexusPoint Website

Marketing website + lightweight admin portal for **NexusPoint** (Smart POS Solutions in UAE). Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma**, and **PostgreSQL**.

## What's included

- Public website pages: `/`, `/services`, `/about`, `/contact`, `/privacy`, `/terms`
- Contact form API: `POST /api/contact` (stores submissions in Postgres and sends email notifications)
- Admin portal: `/admin/*` (login + dashboard + contact submissions management)
- Email delivery via **Resend** (configurable recipients)
- Basic security hardening: security headers + input validation + rate limiting

## Tech stack

- Next.js 14, React 18, TypeScript
- Tailwind CSS, Radix UI, Framer Motion
- Prisma ORM + PostgreSQL
- Resend (email), jose (JWT), bcryptjs (password hashing)

## Getting started (local)

### Prerequisites

- Node.js `>= 18`
- A PostgreSQL database (local or hosted)

### Setup

1. Install dependencies:
   - `npm install`
2. Create local env file:
   - Copy `.env.example` to `.env` and update values
3. Set up the database schema and seed an admin user:
   - `npm run db:push`
   - `npm run db:seed`
4. Start the dev server:
   - `npm run dev`
5. Open:
   - Website: `http://localhost:3000`
   - Admin login: `http://localhost:3000/admin/login`

## Environment variables

Create `.env` (see `.env.example`).

Required:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: secret used to sign admin session JWTs

Email (optional, but recommended in production):

- `RESEND_API_KEY`: Resend API key
- `RESEND_FROM`: from address, e.g. `NexusPoint <noreply@nexuspoint.ae>`
- `ADMIN_EMAIL_RECIPIENTS`: comma-separated list of recipients for contact notifications (defaults are in `src/lib/email.ts`)

Debug endpoints (optional):

- `DEBUG_KEY`: key required for `/api/debug/*` endpoints

## Customization

- Company/contact details and most page content live in `src/lib/constants.ts`
- Global metadata/SEO is configured in `src/app/layout.tsx`
- Static files (images, icons, `manifest.json`) live in `public/`

## Admin portal

- Login: `/admin/login`
- The seed script (`prisma/seed.ts`) creates a default admin account for local development.
- Change the admin password after first login (Admin -> Settings).

## Useful scripts

- `npm run dev`: start Next.js dev server
- `npm run build`: build for production
- `npm run start`: run the production server
- `npm run lint`: run Next.js/ESLint linting
- `npm run db:generate`: generate Prisma client
- `npm run db:push`: push schema to the database (no migrations)
- `npm run db:migrate`: create/apply migrations (if/when migrations are introduced)
- `npm run db:studio`: open Prisma Studio
- `npm run db:seed`: seed database (`prisma/seed.ts`)

## Email debugging

These endpoints are protected with `DEBUG_KEY`:

- `GET /api/debug/smtp?key=DEBUG_KEY`: verifies Resend configuration
- `GET /api/debug/test-email?key=DEBUG_KEY&to=you@example.com`: sends a real test email

## Deployment notes

- Set production env vars (`DATABASE_URL`, `JWT_SECRET`, and email config if needed).
- Build/run: `npm run build` then `npm run start`.
- Rate limiting is in-memory (`src/lib/rate-limit.ts`); use a shared store (e.g. Redis) if you run multiple instances.

## Deploy to Vercel

1. Vercel Dashboard → **New Project** → import `MuntherOdeh/nexus-pos-project`
2. Framework preset: **Next.js** (auto-detected)
3. Add environment variables (Project → Settings → Environment Variables):
   - `DATABASE_URL`
   - `JWT_SECRET` (required for admin login)
   - `NEXT_PUBLIC_APP_URL` (your production URL)
   - Email (optional): `RESEND_API_KEY`, `RESEND_FROM`, `ADMIN_EMAIL_RECIPIENTS`
   - Debug (optional): `DEBUG_KEY` (if not set, `/api/debug/*` returns 404)
4. Deploy

Database setup:

- Run `npm run db:push` against your production database once (from your machine or CI).
- Only run `npm run db:seed` if you understand what it creates (see `prisma/seed.ts`).

## Project structure

- `src/app`: routes, pages, and API handlers (Next.js App Router)
- `src/components`: UI and page sections
- `src/lib`: utilities, validation, email, Prisma client
- `prisma/schema.prisma`: database schema
- `prisma/seed.ts`: seed script (creates an admin + sample data)
