# MIC Check-in — Architecture (Phase A)

Mobile-first Progressive Web App for event registration and QR check-in.

PostgreSQL is the source of truth. Supabase Realtime is a UI synchronization mechanism only. Dashboards must always be able to refetch authoritative statistics from the database.

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui (minimal)
- Backend: Next.js Route Handlers and server actions, Zod
- Data/Auth: Supabase PostgreSQL, Auth, Realtime, RLS
- Later: `qrcode`, `html5-qrcode`, IndexedDB, Gemini (server-only)

## Folder structure

```
app/                 UI routes and Route Handlers
components/          shadcn-style UI and auth widgets
lib/auth             requireAuth / requireRole
lib/supabase         browser + server clients
lib/validations      Zod schemas
supabase/migrations  SQL source of truth
docs/                architecture and decisions
```

## Data model

- `profiles` 1:1 `auth.users` — `role` is `ATTENDEE` | `ORGANIZER`
- `events` owned by an organizer (`organizer_id`, `capacity`, `registration_count`)
- `registrations` unique `(event_id, attendee_id)`, unique `token_hash`
- `check_in_events` one successful check-in per registration
- `sync_conflicts` explicit offline/online conflicts

Raw QR tokens are never stored. A cryptographically random token is generated once at registration, returned to the attendee once, and stored only as a hash.

## Auth / RBAC

- One Supabase Auth project
- Public signup always creates `ATTENDEE` via `handle_new_user`
- No public organizer signup; promote via dashboard SQL (`supabase/seed.sql`)
- Role lives in `profiles` and is never taken from a request body
- `requireAuth()` / `requireRole()` on the server; UI hiding is not authorization
- Middleware only refreshes the session and requires a login cookie for `/attendee` and `/organizer`
- Wrong role → 403

## RLS (Phase A)

- Attendee: own profile, own registrations
- Organizer: own events (and only if `profiles.role = ORGANIZER`), registrations for those events, related check-in rows and sync conflicts

Client writes for registration and check-in are not granted; later phases will use tight `SECURITY DEFINER` RPCs.

## Later phases (not implemented)

- Atomic capacity: `UPDATE events SET registration_count = registration_count + 1 WHERE registration_count < capacity`
- Atomic check-in: `UPDATE registrations SET status = 'checked_in' WHERE token_hash = $1 AND status = 'registered'`
- Offline IndexedDB queue; first server-confirmed check-in wins; conflicts persisted
- AI insights: SQL stats first, Gemini narrative second, fallback to stats
