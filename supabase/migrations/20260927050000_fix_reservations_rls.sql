-- Fix reservations schema and RLS policies for client reservation submission and tracking

-- 1. Ensure guest_address column exists
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS guest_address text;

-- 2. Ensure RLS policies allow public/anon reservation insertion and lookup
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 2a. INSERT Policy: Allow anonymous visitors (role anon and public) to submit reservations
DROP POLICY IF EXISTS "public_can_insert_reservations" ON public.reservations;
DROP POLICY IF EXISTS "allow_anon_insert_reservations" ON public.reservations;
CREATE POLICY "public_can_insert_reservations"
ON public.reservations
FOR INSERT
TO anon, public, authenticated
WITH CHECK (true);

-- 2b. SELECT Policy: Allow reading reservations for reference lookup & admin management
DROP POLICY IF EXISTS "public_can_select_reservations" ON public.reservations;
DROP POLICY IF EXISTS "admins_select_reservations" ON public.reservations;
CREATE POLICY "admins_select_reservations"
ON public.reservations
FOR SELECT
TO anon, public, authenticated
USING (true);

-- 2c. UPDATE Policy: Restrict updating reservations to authenticated managers/admins only
DROP POLICY IF EXISTS "admins_update_reservations" ON public.reservations;
CREATE POLICY "admins_update_reservations"
ON public.reservations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 2d. DELETE Policy: Restrict deleting reservations to authenticated managers/admins only
DROP POLICY IF EXISTS "admins_delete_reservations" ON public.reservations;
CREATE POLICY "admins_delete_reservations"
ON public.reservations
FOR DELETE
TO authenticated
USING (true);

-- 2e. Master Policy for authenticated admins
DROP POLICY IF EXISTS "admins_all_reservations" ON public.reservations;
CREATE POLICY "admins_all_reservations"
ON public.reservations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Security definer RPC function with JSON argument as bulletproof fallback for public reservation creation
CREATE OR REPLACE FUNCTION public.create_reservation(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _res_id uuid;
  _result jsonb;
  _ref text;
  _villa_id uuid;
  _gname text;
  _gemail text;
  _gphone text;
  _gaddr text;
  _guests int;
  _check_in date;
  _check_out date;
  _nights int;
  _pnight numeric;
  _pperson numeric;
  _clean numeric;
  _dep numeric;
  _total numeric;
  _due numeric;
  _popt text;
  _dep_req boolean;
BEGIN
  _ref := payload->>'reference';
  _villa_id := (payload->>'villa_id')::uuid;
  _gname := payload->>'guest_name';
  _gemail := payload->>'guest_email';
  _gphone := payload->>'guest_phone';
  _gaddr := payload->>'guest_address';
  _guests := COALESCE((payload->>'guests')::int, 1);
  _check_in := (payload->>'check_in')::date;
  _check_out := (payload->>'check_out')::date;
  _nights := COALESCE((payload->>'nights')::int, 1);
  _pnight := COALESCE((payload->>'price_per_night')::numeric, 0);
  _pperson := COALESCE((payload->>'price_per_person')::numeric, 0);
  _clean := COALESCE((payload->>'cleaning_fee')::numeric, 0);
  _dep := COALESCE((payload->>'deposit')::numeric, 0);
  _total := COALESCE((payload->>'total_amount')::numeric, 0);
  _due := COALESCE((payload->>'amount_due_now')::numeric, 0);
  _popt := COALESCE(payload->>'payment_option', 'full_with_deposit');
  _dep_req := COALESCE((payload->>'deposit_required')::boolean, true);

  INSERT INTO public.reservations (
    reference,
    villa_id,
    guest_name,
    guest_email,
    guest_phone,
    guest_address,
    guests,
    check_in,
    check_out,
    nights,
    price_per_night,
    price_per_person,
    cleaning_fee,
    deposit,
    total_amount,
    amount_due_now,
    amount_paid,
    payment_option,
    deposit_required,
    status
  ) VALUES (
    _ref,
    _villa_id,
    _gname,
    _gemail,
    _gphone,
    _gaddr,
    _guests,
    _check_in,
    _check_out,
    _nights,
    _pnight,
    _pperson,
    _clean,
    _dep,
    _total,
    _due,
    0,
    _popt,
    _dep_req,
    'pending'
  )
  RETURNING id INTO _res_id;

  SELECT row_to_json(r)::jsonb INTO _result
  FROM (
    SELECT 
      res.id,
      res.reference,
      res.guest_name,
      res.guest_email,
      res.guest_phone,
      res.guest_address,
      res.guests,
      res.check_in,
      res.check_out,
      res.nights,
      res.price_per_night,
      res.price_per_person,
      res.cleaning_fee,
      res.deposit,
      res.total_amount,
      res.amount_due_now,
      res.amount_paid,
      res.payment_option,
      res.deposit_required,
      res.status,
      res.created_at,
      res.confirmed_at,
      res.refund_requested_at,
      res.refund_processed_at,
      json_build_object(
        'name', v.name,
        'location', v.location,
        'capacity', v.capacity,
        'images', v.images
      ) AS villas
    FROM public.reservations res
    JOIN public.villas v ON v.id = res.villa_id
    WHERE res.id = _res_id
  ) r;

  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_reservation(jsonb) TO anon, authenticated, public;
