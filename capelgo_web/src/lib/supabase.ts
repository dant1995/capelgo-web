import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jazqzijjmnfwntjagpvq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphenF6aWpqbW5md250amFncHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NTMzNjIsImV4cCI6MjA5MzQyOTM2Mn0.yUg5TlET2ZQoye7Mj9Qi7PAT0VjCqFoeObU7UXQi5jQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
