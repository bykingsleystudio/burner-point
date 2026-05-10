import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "../../src/lib/supabase/env";

const { supabaseUrl, supabasePublishableKey: supabaseKey } = getPublicSupabaseEnv();

export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey);
