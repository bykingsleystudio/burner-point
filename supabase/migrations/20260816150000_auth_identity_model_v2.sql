-- ============================================================
-- Burner Point - Authentication Identity Model (v2)
-- ============================================================
-- This migration corrects the user provisioning architecture to support
-- email/password, phone/OTP, and Google OAuth as first-class authentication
-- methods without inventing fake email addresses.
--
-- Final architecture:
-- - public.users.email may be NULL for phone-only or provider-only users
-- - public.users.phone_number remains nullable but unique where present
-- - each user must have at least one identity (email or phone)
-- - auth.users insert triggers a single provider-agnostic provisioning function
-- - wallet/profile creation remains preserved and idempotent
-- ============================================================

BEGIN;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_email_key;

ALTER TABLE public.users
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_requires_identity;

ALTER TABLE public.users
  ADD CONSTRAINT users_requires_identity
    CHECK (email IS NOT NULL OR phone_number IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
  ON public.users (email)
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique
  ON public.users (phone_number)
  WHERE phone_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_email_lookup
  ON public.users (email)
  WHERE email IS NOT NULL;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_email TEXT;
  v_phone TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
  v_email_verified BOOLEAN;
  v_phone_verified BOOLEAN;
BEGIN
  v_email := NULLIF(
    TRIM(COALESCE(
      NEW.email,
      NEW.raw_user_meta_data->>'email',
      NEW.raw_user_meta_data->>'email_address',
      NEW.raw_user_meta_data->>'e_mail'
    )),
    ''
  );

  v_phone := NULLIF(
    TRIM(COALESCE(
      NEW.phone,
      NEW.raw_user_meta_data->>'phone_number',
      NEW.raw_user_meta_data->>'phoneNumber',
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'mobile_number'
    )),
    ''
  );

  IF v_email IS NULL AND v_phone IS NULL THEN
    RAISE EXCEPTION 'Burner Point user % has no usable email or phone number in auth.users', NEW.id
    USING HINT = 'A user must have either an email or phone identity. Do not invent fake email addresses.';
  END IF;

  v_first_name := NULLIF(
    TRIM(COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'firstName',
      NEW.raw_user_meta_data->>'given_name',
      ''
    )),
    ''
  );

  v_last_name := NULLIF(
    TRIM(COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'lastName',
      NEW.raw_user_meta_data->>'family_name',
      ''
    )),
    ''
  );

  v_full_name := NULLIF(
    TRIM(COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      CONCAT_WS(' ', v_first_name, v_last_name),
      ''
    )),
    ''
  );

  v_email_verified := COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, FALSE);
  v_phone_verified := COALESCE((NEW.raw_user_meta_data->>'phone_verified')::boolean, FALSE);

  INSERT INTO public.users (
    id,
    email,
    phone_number,
    first_name,
    last_name,
    email_verified,
    phone_verified
  )
  VALUES (
    NEW.id,
    v_email,
    v_phone,
    COALESCE(v_first_name, ''),
    COALESCE(v_last_name, ''),
    v_email_verified,
    v_phone_verified
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.users.email),
    phone_number = COALESCE(EXCLUDED.phone_number, public.users.phone_number),
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.users.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.users.last_name),
    email_verified = EXCLUDED.email_verified OR public.users.email_verified,
    phone_verified = EXCLUDED.phone_verified OR public.users.phone_verified;

  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, v_full_name, NULL)
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

COMMIT;
