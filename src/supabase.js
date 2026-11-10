import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.SUPABASE_URL1
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY1

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL atau Anon Key belum disetel di file .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
