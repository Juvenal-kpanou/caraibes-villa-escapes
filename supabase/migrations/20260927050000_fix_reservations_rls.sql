-- Fix reservations schema and RLS policies for client reservation submission

-- 1. Ensure guest_address column exists
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS guest_address text;

-- 2. Ensure RLS policies allow public/anon reservation insertion and selection
DROP POLICY IF EXISTS "public_can_insert_reservations" ON public.reservations;
CREATE POLICY "public_can_insert_reservations"
ON public.reservations
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "public_can_select_reservations" ON public.reservations;
CREATE POLICY "public_can_select_reservations"
ON public.reservations
FOR SELECT
TO public
USING (true);

-- 3. Security definer RPC function as bulletproof fallback for public reservation creation
CREATE OR REPLACE FUNCTION public.create_reservation_public(
  _reference text,
  _villa_id uuid,
  _guest_name text,
  _guest_email text,
  _guest_phone text,
  _guest_address text DEFAULT NULL,
  _guests integer DEFAULT 1,
  _check_in date DEFAULT NULL,
  _check_out date DEFAULT NULL,
  _nights integer DEFAULT 1,
  _price_per_night numeric DEFAULT 0,
  _price_per_person numeric DEFAULT 0,
  _cleaning_fee numeric DEFAULT 0,
  _deposit numeric DEFAULT 0,
  _total_amount numeric DEFAULT 0,
  _amount_due_now numeric DEFAULT 0,
  _payment_option text DEFAULT 'full_with_deposit',
  _deposit_required boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _res_id uuid;
  _result jsonb;
BEGIN
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
    _reference,
    _villa_id,
    _guest_name,
    _guest_email,
    _guest_phone,
    _guest_address,
    _guests,
    _check_in,
    _check_out,
    _nights,
    _price_per_night,
    _price_per_person,
    _cleaning_fee,
    _deposit,
    _total_amount,
    _amount_due_now,
    0,
    _payment_option,
    _deposit_required,
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

GRANT EXECUTE ON FUNCTION public.create_reservation_public TO anon, authenticated, public;
