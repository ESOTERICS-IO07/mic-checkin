-- Phase A foundation: schema, constraints, RLS, profile bootstrap.
-- Registration / check-in business logic is intentionally not implemented here.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.user_role AS ENUM ('ATTENDEE', 'ORGANIZER');
CREATE TYPE public.registration_status AS ENUM ('registered', 'checked_in');
CREATE TYPE public.check_in_source AS ENUM ('online', 'offline_sync');
CREATE TYPE public.sync_conflict_reason AS ENUM (
  'already_checked_in',
  'unknown_token',
  'event_mismatch'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'ATTENDEE',
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name text NOT NULL,
  starts_at timestamptz NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  registration_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_registration_count_within_capacity
    CHECK (registration_count >= 0 AND registration_count <= capacity)
);

CREATE TABLE public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  attendee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  token_hash bytea NOT NULL,
  token_lookup_prefix char(8),
  status public.registration_status NOT NULL DEFAULT 'registered',
  checked_in_at timestamptz,
  checked_in_by uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT registrations_event_attendee_unique UNIQUE (event_id, attendee_id),
  CONSTRAINT registrations_token_hash_unique UNIQUE (token_hash)
);

CREATE TABLE public.check_in_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL UNIQUE REFERENCES public.registrations (id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES public.profiles (id),
  source public.check_in_source NOT NULL,
  client_scan_id uuid,
  scanned_at_client timestamptz,
  confirmed_at_server timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sync_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events (id) ON DELETE SET NULL,
  registration_id uuid REFERENCES public.registrations (id) ON DELETE SET NULL,
  token_hash bytea,
  client_scan_id uuid,
  scanned_at_client timestamptz,
  device_id text,
  winning_check_in_id uuid REFERENCES public.check_in_events (id) ON DELETE SET NULL,
  reason public.sync_conflict_reason NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX events_organizer_id_idx ON public.events (organizer_id);
CREATE INDEX events_starts_at_idx ON public.events (starts_at);
CREATE INDEX registrations_event_id_idx ON public.registrations (event_id);
CREATE INDEX registrations_attendee_id_idx ON public.registrations (attendee_id);
CREATE INDEX registrations_status_idx ON public.registrations (status);
CREATE INDEX check_in_events_event_id_idx ON public.check_in_events (event_id);
CREATE INDEX sync_conflicts_event_id_idx ON public.sync_conflicts (event_id);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER events_set_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER registrations_set_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profile bootstrap: every auth user gets ATTENDEE. Organizer is seed-only.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    'ATTENDEE',
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Block authenticated users from changing their own role.
-- Dashboard / postgres role (auth.uid() IS NULL) may promote organizers in seed SQL.
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'profile role cannot be changed by the authenticated user';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_protect_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- Grants (RLS still applies)
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO authenticated;
GRANT SELECT ON TABLE public.registrations TO authenticated;
GRANT SELECT ON TABLE public.check_in_events TO authenticated;
GRANT SELECT ON TABLE public.sync_conflicts TO authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_in_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY events_select_own
  ON public.events
  FOR SELECT
  TO authenticated
  USING (
    organizer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ORGANIZER'
    )
  );

CREATE POLICY events_insert_own
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ORGANIZER'
    )
  );

CREATE POLICY events_update_own
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    organizer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ORGANIZER'
    )
  )
  WITH CHECK (
    organizer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ORGANIZER'
    )
  );

CREATE POLICY events_delete_own
  ON public.events
  FOR DELETE
  TO authenticated
  USING (
    organizer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'ORGANIZER'
    )
  );

CREATE POLICY registrations_select_own_or_organizer
  ON public.registrations
  FOR SELECT
  TO authenticated
  USING (
    attendee_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = registrations.event_id
        AND e.organizer_id = auth.uid()
    )
  );

CREATE POLICY check_in_events_select_attendee_or_organizer
  ON public.check_in_events
  FOR SELECT
  TO authenticated
  USING (
    organizer_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.registrations r
      WHERE r.id = check_in_events.registration_id
        AND r.attendee_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = check_in_events.event_id
        AND e.organizer_id = auth.uid()
    )
  );

CREATE POLICY sync_conflicts_select_organizer
  ON public.sync_conflicts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = sync_conflicts.event_id
        AND e.organizer_id = auth.uid()
    )
  );

-- Realtime is a UI fan-out only. PostgreSQL remains the source of truth.
ALTER TABLE public.registrations REPLICA IDENTITY FULL;
ALTER TABLE public.sync_conflicts REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations';
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_conflicts';
  END IF;
END;
$$;
