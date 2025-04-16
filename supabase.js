import { createClient } from '@supabase/supabase-js'

// Replace these with your actual values from the Supabase dashboard
const SUPABASE_URL = 'https://vddfyefjmhsjwuluigax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZGZ5ZWZqbWhzand1bHVpZ2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTI1MjYsImV4cCI6MjA2MDM4ODUyNn0.RD-sC9R7JOhklYQ7M8DSesJmcRuOXqfveVH8C4vCHDo';

// Initialize Supabase client correctly
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


