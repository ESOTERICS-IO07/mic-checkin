-- Phase B1: Atomic Registration RPC Function
-- This function handles the capacity check and registration creation atomically.

CREATE OR REPLACE FUNCTION public.register_for_event(
  p_event_id uuid,
  p_token_hash bytea,
  p_token_lookup_prefix text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role user_role;
  v_capacity integer;
  v_reg_count integer;
  v_already_exists boolean;
BEGIN
  -- 1. Get authenticated user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN 'unauthorized';
  END IF;

  -- 2. Verify user has ATTENDEE role
  SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
  IF v_role IS DISTINCT FROM 'ATTENDEE' THEN
    RETURN 'unauthorized';
  END IF;

  -- 3. Verify event exists and lock the event row to serialize registrations on this event
  SELECT capacity, registration_count INTO v_capacity, v_reg_count
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'event_not_found';
  END IF;

  -- 4. Check if already registered
  SELECT EXISTS (
    SELECT 1 FROM public.registrations
    WHERE event_id = p_event_id AND attendee_id = v_user_id
  ) INTO v_already_exists;

  IF v_already_exists THEN
    RETURN 'already_registered';
  END IF;

  -- 5. Check if event is full
  IF v_reg_count >= v_capacity THEN
    RETURN 'event_full';
  END IF;

  -- 6. Insert registration
  INSERT INTO public.registrations (
    event_id,
    attendee_id,
    token_hash,
    token_lookup_prefix
  )
  VALUES (
    p_event_id,
    v_user_id,
    p_token_hash,
    p_token_lookup_prefix
  );

  -- 7. Increment registration count
  UPDATE public.events
  SET registration_count = registration_count + 1
  WHERE id = p_event_id;

  RETURN 'success';
END;
$$;
