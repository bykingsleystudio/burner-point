/**
 * Supabase Client Configuration
 * 
 * Initialize Supabase client for both client-side and server-side usage.
 * 
 * For backend (NestJS API):
 * - Use service role key for admin operations
 * - Use user's JWT for user-specific operations
 * 
 * For frontend (Next.js, Expo):
 * - Use anon key only
 * - Never expose service role key
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

// Supabase configuration interface
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

// Get Supabase configuration from environment
export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error(
      'Missing required Supabase environment variables. ' +
      'Ensure SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  return { url, anonKey, serviceRoleKey };
}

// Create Supabase client for server-side usage
export function createSupabaseClient(accessToken?: string): SupabaseClient {
  const { url, anonKey, serviceRoleKey } = getSupabaseConfig();

  // Use service role key for admin operations if no user token provided
  const supabaseKey = accessToken ? anonKey : serviceRoleKey;

  const supabase = createClient(url, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  });

  return supabase;
}

// Create Supabase client with user context (for RLS)
export function createUserSupabaseClient(
  userToken: string,
): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig();

  const supabase = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    },
  });

  return supabase;
}

// NestJS ConfigService helper
export function createSupabaseFromConfig(configService: ConfigService): SupabaseClient {
  const url = configService.get<string>('SUPABASE_URL');
  const anonKey = configService.get<string>('SUPABASE_ANON_KEY');
  const serviceRoleKey = configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error(
      'Missing required Supabase environment variables in ConfigService'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
