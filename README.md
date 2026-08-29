# EMS Check-in System

Event check-in PWA (MIC Development Department recruitment task).

Phase A is foundation only: Next.js App Router, Supabase Auth, profiles/RBAC, RLS, and four proof pages.

## Local setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor.
4. Authentication → Providers: keep **Email** enabled. Optionally disable “Confirm email” while developing.
5. Create an organizer: add a user in Authentication → Users, then run the `UPDATE` in `supabase/seed.sql`.
6. `npm install` and `npm run dev`.

## Scripts

- `npm run dev` — local server
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Routes

- `/login` — email/password (Google control is present but disabled)
- `/signup` — attendee only
- `/attendee` — `requireRole('ATTENDEE')` (403 for organizers)
- `/organizer` — `requireRole('ORGANIZER')` (403 for attendees)
- `GET /api/me` — session + profile JSON (`401` if signed out)

Do not commit `.env.local`.
