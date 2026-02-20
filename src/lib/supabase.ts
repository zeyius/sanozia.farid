import { createClient } from '@supabase/supabase-js';
import type { Database } from './database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Créer un client factice si les variables d'environnement ne sont pas configurées
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === '' || supabaseAnonKey === '') {
    console.warn('Supabase environment variables not configured. Using mock client.');
    return null;
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  });
};

export const supabase = createSupabaseClient();

export type { Database };