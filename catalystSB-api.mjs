import { createClient } from '@supabase/supabase-js';
import fs from 'fs'
let options = JSON.parse(fs.readFileSync('./options.json', 'utf-8'))

export const supabase = createClient(
  options.CATALYST_SUPABASE_URL,
  options.CATALYST_SUPABASE_ANON_KEY
)