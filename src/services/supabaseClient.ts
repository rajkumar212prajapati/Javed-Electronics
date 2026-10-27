import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined'
    ? process.env
    : ({} as Record<string, string>);

export const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_CyGqMVMssXIeTzc12Fm58Q_UHVRSukq';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  let storedUrl = '';
  let storedKey = '';

  if (typeof localStorage !== 'undefined') {
    try {
      storedUrl = localStorage.getItem('je_supabase_url') || '';
      storedKey = localStorage.getItem('je_supabase_anon_key') || '';
    } catch {}
  }

  const url = storedUrl || env.VITE_SUPABASE_URL || '';
  const anonKey = storedKey || env.VITE_SUPABASE_ANON_KEY || DEFAULT_PUBLISHABLE_KEY;

  return { url, anonKey };
}

let activeClient: SupabaseClient | null = null;
let currentClientUrl = '';
let currentClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();

  if (!url || !anonKey || !url.startsWith('https://') || url === 'https://your-project.supabase.co') {
    return null;
  }

  if (activeClient && currentClientUrl === url && currentClientKey === anonKey) {
    return activeClient;
  }

  try {
    activeClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      db: {
        schema: 'public',
      },
    });
    currentClientUrl = url;
    currentClientKey = anonKey;
    return activeClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export const isSupabaseConfigured = Boolean(
  getStoredSupabaseConfig().url &&
  getStoredSupabaseConfig().url.startsWith('https://') &&
  getStoredSupabaseConfig().url !== 'https://your-project.supabase.co'
);

export const supabase = getSupabaseClient();

/**
 * Save credentials and update active client
 */
export function saveSupabaseCredentials(url: string, anonKey: string): { success: boolean; message: string } {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('je_supabase_url', url.trim());
      localStorage.setItem('je_supabase_anon_key', anonKey.trim());
    }

    // Reset client to reinitialize
    activeClient = null;
    currentClientUrl = '';
    currentClientKey = '';
    getSupabaseClient();

    return { success: true, message: 'Supabase credentials saved successfully.' };
  } catch (err: any) {
    return { success: false, message: `Failed to save: ${err.message}` };
  }
}

/**
 * Health check helper for database connection
 */
export async function testSupabaseConnection(
  customUrl?: string,
  customKey?: string
): Promise<{ ok: boolean; message: string; tableExists?: boolean }> {
  let clientToTest: SupabaseClient | null = null;

  if (customUrl && customKey) {
    try {
      clientToTest = createClient(customUrl.trim(), customKey.trim());
    } catch (err: any) {
      return { ok: false, message: `Invalid client parameters: ${err.message}` };
    }
  } else {
    clientToTest = getSupabaseClient();
  }

  if (!clientToTest) {
    return {
      ok: false,
      message: 'Supabase Project URL not configured. Enter your project URL (e.g. https://[id].supabase.co).',
    };
  }

  try {
    const { data, error } = await clientToTest
      .from('festival_campaigns')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        // relation does not exist
        return {
          ok: false,
          tableExists: false,
          message: 'Connected to Supabase project, but "festival_campaigns" table is not created yet. Please execute the SQL migration.',
        };
      }
      return {
        ok: false,
        message: `Database responded with error: ${error.message} (${error.code})`,
      };
    }

    return {
      ok: true,
      tableExists: true,
      message: 'Successfully connected to Supabase! Table "festival_campaigns" is ready and active.',
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Failed to reach Supabase API: ${err.message}. Check your Project URL and network.`,
    };
  }
}
