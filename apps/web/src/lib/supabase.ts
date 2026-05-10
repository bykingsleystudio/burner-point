/**
 * Supabase Client for Web (Browser)
 * 
 * Initialize Supabase client for browser usage.
 * Uses anon key only - never expose service role key.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPublicSupabaseEnv } from './supabase/env';

let browserClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (browserClient) return browserClient;

  const { supabaseUrl, supabasePublishableKey } = getPublicSupabaseEnv();

  browserClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseClient() as object, prop, receiver);
  },
}) as SupabaseClient;

export default supabase;
