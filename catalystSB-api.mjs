import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  "https://wdlhlyygpndwbbwzauuv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkbGhseXlncG5kd2Jid3phdXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjM4NDA1OTksImV4cCI6MTk3OTQxNjU5OX0.fyq2VRYStjd4qe6r6a5RCQ1L79MrFvptvQKqbVRCnI4"
)