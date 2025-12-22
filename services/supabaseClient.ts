
import { createClient } from '@supabase/supabase-js';

// Remplacer par vos vraies valeurs dans le tableau de bord Supabase si nécessaire
// Mais l'utilisation de variables d'environnement est préférable
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
