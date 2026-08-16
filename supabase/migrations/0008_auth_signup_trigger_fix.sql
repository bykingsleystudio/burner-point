-- Fix auth.users provisioning so Burner Point user creation is safe for email,
-- phone, and OAuth signup flows without assuming raw_user_meta_data always
-- contains a populated email.

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
BEGIN
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

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Burner Point signup requires a valid email address for auth.users row %', NEW.id
    USING HINT = 'Ensure the Supabase auth user has an email or the provider metadata includes an email address.';
  END IF;

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

  v_first_name := NULLIF(
    TRIM(
      COALESCE(
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'firstName',
        NEW.raw_user_meta_data->>'given_name',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name'
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
    COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, FALSE),
    COALESCE((NEW.raw_user_meta_data->>'phone_verified')::boolean, FALSE)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone_number = EXCLUDED.phone_number,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email_verified = EXCLUDED.email_verified,
    phone_verified = EXCLUDED.phone_verified;

  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, v_full_name, NULL)
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();
