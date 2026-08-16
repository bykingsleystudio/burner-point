-- ============================================================
-- Burner Point - Authentication Identity Model (v2)
-- ============================================================
-- This migration corrects the user provisioning architecture to support
-- email/password, phone/OTP, and Google OAuth as first-class authentication
-- methods without requiring fake email generation.
--
-- Changes:
-- 1. Make public.users.email nullable (was NOT NULL)
-- 2. Ensure every public.users row has at least one identity (email OR phone)
-- 3. Preserve existing users and data
-- 4. Make the signup trigger provider-agnostic
-- 5. Support email, phone, and OAuth flows through one trigger
-- ============================================================

-- ============================================================
-- STEP 1: Alter public.users to support email-optional accounts
-- ============================================================

-- Add a CHECK constraint to ensure at least one identity exists
-- This prevents the problem where neither email nor phone is set
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_email_key;

ALTER TABLE public.users
  ALTER COLUMN email DROP NOT NULL;

-- Add back uniqueness but allow NULL (PostgreSQL treats NULLs as distinct)
ALTER TABLE public.users
  ADD CONSTRAINT users_email_unique UNIQUE (email)
  DEFERRABLE INITIALLY DEFERRED;

-- Add CHECK constraint: at least one identity is required
ALTER TABLE public.users
  ADD CONSTRAINT users_requires_identity 
    CHECK (email IS NOT NULL OR phone_number IS NOT NULL);

-- Ensure phone_number remains unique where present
-- (it already is via the original index/constraint, but make it explicit)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique 
  ON public.users(phone_number)
  WHERE phone_number IS NOT NULL;

-- Create an index for finding users by email (including NULLs)
CREATE INDEX IF NOT EXISTS idx_users_email_lookup 
  ON public.users(email)
  WHERE email IS NOT NULL;

-- ============================================================
-- STEP 2: Replace the signup trigger to be provider-agnostic
-- ============================================================

-- Drop the old trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Replace the function with one that handles multiple identity sources
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_phone TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
BEGIN
  -- Extract email from multiple possible sources
  -- Preference: auth.users.email > metadata keys > NULL
  v_email := NULLIF(
    TRIM(
      COALESCE(
        NEW.email,
        NEW.raw_user_meta_data->>'email',
        NEW.raw_user_meta_data->>'email_address',
        NEW.raw_user_meta_data->>'e_mail'
      )
    ),
    ''
  );

  -- Extract phone from multiple possible sources
  -- Preference: auth.users.phone > metadata keys > NULL
  v_phone := NULLIF(
    TRIM(
      COALESCE(
        NEW.phone,
        NEW.raw_user_meta_data->>'phone_number',
        NEW.raw_user_meta_data->>'phoneNumber',
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'mobile_number'
      )
    ),
    ''
  );

  -- Validate: at least one identity must exist
  -- This is also enforced by the CHECK constraint, but fail early here
  IF v_email IS NULL AND v_phone IS NULL THEN
    RAISE EXCEPTION 'Burner Point signup requires either an email address or phone number for auth.users row %', NEW.id
    USING HINT = 'Ensure the Supabase auth user has an email or phone, or the provider metadata includes one of these.';
  END IF;

  -- Extract name fields from metadata
  v_first_name := NULLIF(
    TRIM(
      COALESCE(
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'firstName',
        NEW.raw_user_meta_data->>'given_name'
      )
    ),
    ''
  );

  v_last_name := NULLIF(
    TRIM(
      COALESCE(
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'lastName',
        NEW.raw_user_meta_data->>'family_name'
      )
    ),
    ''
  );

  v_full_name := NULLIF(
    TRIM(
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        CONCAT_WS(' ', v_first_name, v_last_name)
      )
    ),
    ''
  );

  -- Insert or update public.users row
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
    v_email,                    -- may be NULL (phone-only user)
    v_phone,                    -- may be NULL (email-only user)
    COALESCE(v_first_name, ''),
    COALESCE(v_last_name, ''),
    COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, FALSE),
    COALESCE((NEW.raw_user_meta_data->>'phone_verified')::boolean, FALSE)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.users.email),
    phone_number = COALESCE(EXCLUDED.phone_number, public.users.phone_number),
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.users.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.users.last_name),
    email_verified = EXCLUDED.email_verified OR public.users.email_verified,
    phone_verified = EXCLUDED.phone_verified OR public.users.phone_verified;

  -- Insert or update profile
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, v_full_name, NULL)
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- ============================================================
-- STEP 3: Ensure wallet creation still works for new users
-- ============================================================
-- The existing create_wallet_for_new_user trigger on public.users
-- should still fire correctly. No changes needed there.

-- ============================================================
-- STEP 4: Verify RLS policies support nullable email
-- ============================================================
-- RLS policies in 0002_rls_policies.sql use auth.uid() = id,
-- which is identity-agnostic. They do not need changes.

-- ============================================================
-- STEP 5: Summary of changes
-- ============================================================
-- After this migration:
--
-- ✓ public.users.email is nullable
-- ✓ public.users.phone_number remains nullable (already was)
-- ✓ At least one identity is guaranteed by CHECK constraint
-- ✓ Email and phone are separately unique where present
-- ✓ Trigger handles auth.users, auth.users.email, auth.users.phone, and metadata
-- ✓ Trigger does not manufacture fake emails
-- ✓ Existing users are preserved
-- ✓ Email-only, phone-only, and multi-identity users are all supported
-- ✓ RLS policies continue to work unchanged
-- ✓ Wallet provisioning continues to work unchanged
--
-- Still supported flows:
-- - Email + password signup
-- - Email + password login
-- - Phone + OTP signup
-- - Phone + OTP login
-- - Google OAuth signup (email extracted from provider)
-- - Google OAuth login
-- - Password reset (for email users)
-- - Account recovery (for email users)
--
-- Architecture remains:
-- auth.users → handle_new_user_signup() → public.users + public.profiles + public.wallets
