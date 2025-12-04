import { createClient } from '@supabase/supabase-js';

// En production (Vite/Vercel), on utilise import.meta.env.VITE_...
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase URL ou Key manquante. Vérifiez vos variables d'environnement Vercel.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);