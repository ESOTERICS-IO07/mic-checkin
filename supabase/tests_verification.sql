-- Phase B1 Hardening Verification Script
-- Run this in the Supabase SQL editor to verify database security rules and privileges.

BEGIN;

-- 1. Setup mock profiles (Organizer and 2 Attendees)
INSERT INTO public.profiles (id, role, display_name)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'ORGANIZER', 'Test Organizer'),
  ('00000000-0000-0000-0000-000000000002', 'ATTENDEE', 'Test Attendee 1'),
  ('00000000-0000-0000-0000-000000000003', 'ATTENDEE', 'Test Attendee 2')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- 2. Create test event (owned by the test organizer)
INSERT INTO public.events (id, organizer_id, name, starts_at, capacity, registration_count)
VALUES ('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000001', 'Atomic Test Event', now(), 1, 0)
ON CONFLICT (id) DO UPDATE SET capacity = 1, registration_count = 0;

DELETE FROM public.registrations WHERE event_id = '99999999-9999-9999-9999-999999999999';

-- Switch to authenticated role and set organizer context for direct edits
SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000001"}', true);

-- Verification tests block
DO $$
DECLARE
  v_res text;
  v_count integer;
BEGIN
  -- TEST A: Direct write to registration_count (Should Fail)
  BEGIN
    UPDATE public.events 
    SET registration_count = 10 
    WHERE id = '99999999-9999-9999-9999-999999999999';
    
    RAISE EXCEPTION 'TEST A FAILED: Direct update to registration_count was allowed!';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'TEST A PASSED: Direct write to registration_count rejected successfully.';
  END;

  -- TEST B: Modify allowed event fields (Should Succeed)
  BEGIN
    UPDATE public.events 
    SET name = 'Legit Event Edit', capacity = 5 
    WHERE id = '99999999-9999-9999-9999-999999999999';
    
    RAISE NOTICE 'TEST B PASSED: Organizer successfully modified name and capacity.';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'TEST B FAILED: Organizer could not update legitimate fields: %', SQLERRM;
  END;
END;
$$;

-- Switch back to postgres (owner) role to set up/run registrations
RESET ROLE;

-- TEST C: register_for_event can increment registration_count (Should Succeed)
-- Simulate Attendee 1
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000002"}', true);

SELECT register_for_event(
  '99999999-9999-9999-9999-999999999999',
  '\x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
  'prefix12'
) AS registration_1_status;

-- Verify count is 1
SELECT registration_count FROM public.events WHERE id = '99999999-9999-9999-9999-999999999999';

-- TEST D: duplicate registration does not increment it (Should return already_registered)
SELECT register_for_event(
  '99999999-9999-9999-9999-999999999999',
  '\x2122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f40',
  'prefix34'
) AS registration_duplicate_status;

-- Verify count remains 1
SELECT registration_count FROM public.events WHERE id = '99999999-9999-9999-9999-999999999999';

-- Reset capacity back to 1 (postgres/owner role is not constrained)
UPDATE public.events SET capacity = 1 WHERE id = '99999999-9999-9999-9999-999999999999';

-- TEST E: full event rejects registration (Should return event_full)
-- Simulate Attendee 2
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000003"}', true);

SELECT register_for_event(
  '99999999-9999-9999-9999-999999999999',
  '\x4142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f60',
  'prefix56'
) AS registration_full_status;

-- Verify count remains 1
SELECT registration_count FROM public.events WHERE id = '99999999-9999-9999-9999-999999999999';

ROLLBACK;
