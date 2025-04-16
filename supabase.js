import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://vddfyefjmhsjwuluigax.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZGZ5ZWZqbWhzand1bHVpZ2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTI1MjYsImV4cCI6MjA2MDM4ODUyNn0.RD-sC9R7JOhklYQ7M8DSesJmcRuOXqfveVH8C4vCHDo'

export const supabase = createClient(supabaseUrl, supabaseKey)


