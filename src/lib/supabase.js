import { createClient } from '@supabase/supabase-js';

// Variables d'environnement Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Vérification des credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Variables Supabase manquantes. Créez un fichier .env avec:\n' +
    'VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key'
  );
}

// Création du client Supabase
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
});

// Vérifier la connexion à Supabase
export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.from('visites').select('id').limit(1);
    if (error) throw error;
    return { connected: true };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}
