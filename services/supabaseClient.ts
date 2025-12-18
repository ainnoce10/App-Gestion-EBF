
import { createClient } from '@supabase/supabase-js';

// Utilisation de valeurs par défaut pour éviter le crash si les variables ne sont pas encore configurées
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mocking simple pour les fonctions de base si le client n'est pas connecté
// Cela permet à l'interface de s'afficher même sans base de données active
