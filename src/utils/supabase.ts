import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://octduxtmterurkdkqtur.supabase.co'
const supabaseAnonKey = 'sb_publishable_MYEh8xfPAeMWQXXYUPcimw_hSL5HBbL'

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
