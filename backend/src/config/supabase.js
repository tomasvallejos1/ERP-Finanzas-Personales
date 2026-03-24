import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

class SupabaseSingleton {
  constructor() {
    if (!SupabaseSingleton.instance) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Las credenciales de Supabase no están definidas en .env');
      }

      SupabaseSingleton.instance = createClient(supabaseUrl, supabaseKey);
    }
  }

  getInstance() {
    return SupabaseSingleton.instance;
  }
}

const supabaseClient = new SupabaseSingleton().getInstance();
export default supabaseClient;
