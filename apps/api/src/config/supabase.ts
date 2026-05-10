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
import { resolveConfiguredEnv, type RuntimeEnvSource } from './runtime-env';

// Supabase configuration interface
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

function readSupabasePublicKey(source: RuntimeEnvSource): string | undefined {
  return resolveConfiguredEnv('SUPABASE_ANON_KEY', source);
}

function readSupabaseServerKey(source: RuntimeEnvSource): string | undefined {
  return resolveConfiguredEnv('SUPABASE_SERVICE_ROLE_KEY', source);
}

// Get Supabase configuration from environment
export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL;
  const anonKey = readSupabasePublicKey(process.env);
  const serviceRoleKey = readSupabaseServerKey(process.env);

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error(
      'Missing required Supabase environment variables. ' +
      'Ensure SUPABASE_URL plus a publishable/anon key and a secret/service-role key are set.'
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
  const anonKey = readSupabasePublicKey(configService);
  const serviceRoleKey = readSupabaseServerKey(configService);

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
