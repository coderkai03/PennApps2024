import { createClient } from '@supabase/supabase-js';

// Define environment variables with type checking
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Check if the environment variables are present, if not throw an error
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase URL or Anon Key");
}

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
