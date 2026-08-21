# Decisions

## PostgreSQL is the source of truth

Check-in status, capacity, and conflicts live in Postgres. Supabase Realtime may fan out `registrations` / `sync_conflicts` changes to the organizer dashboard. The dashboard must refetch aggregates from SQL (or a Route Handler that reads SQL). Multiple Vercel isolates must not keep authoritative state in memory.

## RBAC is server-side

`profiles.role` is assigned by the `handle_new_user` trigger (`ATTENDEE`) or by operator SQL (`ORGANIZER`). `requireAuth()` and `requireRole()` load that row after `auth.getUser()`. Signup and login Zod schemas do not include a role field. A `BEFORE UPDATE` trigger rejects authenticated role changes.

## RLS is defense in depth

Policies are scoped to `auth.uid()`. Event writes additionally require `profiles.role = 'ORGANIZER'` so an attendee cannot insert an event row with themselves as owner. Registration and check-in mutations are not exposed to `authenticated` yet.

## Future SECURITY DEFINER RPCs

Any later RPC will:

- `SET search_path = public` (or an explicit safe path)
- Use `auth.uid()` for the actor; never trust client-supplied user ids or roles
- Verify organizer ownership of the event where relevant
- Expose only one operation (register, check in, etc.)

## Atomic Registration and Capacity Enforcements (Phase B1)

We implemented atomic registration in `register_for_event` RPC function.

- **Application code vs Database constraint**: Checking capacity in Next.js Server Components / Actions is race-prone. Two concurrent isolates could inspect `registration_count < capacity` simultaneously, succeed, and insert two registrations, exceeding the capacity limits.
- **Database invariants**:
  1. `SELECT ... FOR UPDATE` locks the event row to serialize all registrations attempting to target this event.
  2. The `events_registration_count_within_capacity` CHECK constraint guarantees that registration_count can never exceed capacity under any concurrent write conditions.
  3. A database trigger (`events_protect_registration_count`) blocks any direct updates to `registration_count` by authenticated clients, making it a database-maintained invariant. Only trusted database functions (utilizing a transaction-local session variable bypass) are allowed to modify it.
- **Organizer ownership and RLS**:
  1. `events` insert/update RLS policies require that the organizer_id matches the client's `auth.uid()` and that the client's profile role is `ORGANIZER`.
  2. The server-side action enforces the logged-in organizer's ID on creation, ensuring organizers can never submit another user's ID.
  3. Organizers are restricted from viewing or managing other organizers' events by the `events_select_own` policy.


## Future atomic check-in

```sql
UPDATE registrations
SET status = 'checked_in', checked_in_at = now(), checked_in_by = auth.uid()
WHERE token_hash = $hash AND status = 'registered'
RETURNING *;
```

Zero rows: invalid token or already checked in → explicit rejection (`409`), never a silent success. `check_in_events.registration_id` is `UNIQUE`.

## One-time QR token

- 32-byte `crypto.randomBytes`, base64url
- QR payload is opaque (`mic:<token>`), no PII
- Store SHA-256 (optionally HMAC with a server pepper)
- Return the raw token once at registration; do not re-expose it from ticket list APIs
- After check-in the conditional update no longer matches

## Offline-first scanning (later)

IndexedDB queue on the scanner. Sync when online. Server remains authoritative. First confirmed `UPDATE ... AND status = 'registered'` wins. If already checked in, insert `sync_conflicts` instead of dropping the offline scan.

## No service-role browser client

Phase A uses the anon key + user JWT only. A service-role client is not required and is not shipped. Organizer promotion is SQL-editor / seed only.

## Lean Phase A

No scanner, QR, event CRUD UI, dashboard analytics, offline sync, or Gemini. shadcn is represented by a small set of primitives (`button`, `input`, `label`, `card`) rather than a full component dump.
