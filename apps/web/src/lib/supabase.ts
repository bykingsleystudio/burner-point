/**
 * Supabase Client for Web (Browser)
 * 
 * Initialize Supabase client for browser usage.
 * Uses anon key only - never expose service role key.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { resolveAuthStorageMode } from './auth-persistence';
import { getPublicSupabaseEnv } from './supabase/env';

let browserClient: SupabaseClient | null = null;
let browserStorageMode: 'localStorage' | 'sessionStorage' | null = null;

export function resetSupabaseClient() {
  browserClient = null;
  browserStorageMode = null;
}

export function getSupabaseClient() {
  const storageMode = resolveAuthStorageMode();

  if (browserClient && browserStorageMode === storageMode) return browserClient;

  const { supabaseUrl, supabasePublishableKey } = getPublicSupabaseEnv();

  browserClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: storageMode === 'localStorage',
      storage: storageMode === 'localStorage' ? window.localStorage : window.sessionStorage,
      detectSessionInUrl: true,
    },
  });
  browserStorageMode = storageMode;

  return browserClient;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseClient() as object, prop, receiver);
  },
}) as SupabaseClient;

export default supabase;
