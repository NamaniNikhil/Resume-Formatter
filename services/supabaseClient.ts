
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://txzlnucvtxdkewbblgra.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4emxudWN2dHhka2V3YmJsZ3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzODUzNTIsImV4cCI6MjA3Nzk2MTM1Mn0.lKuTbYJA7xFmi0WuDu3FPcQ0jXhkEVgGypotma62hdQ';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
