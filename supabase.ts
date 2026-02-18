
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qaflbpqhxozelynsmuem.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZmxicHFoeG96ZWx5bnNtdWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MzAxOTcsImV4cCI6MjA4NzAwNjE5N30.XRO305UgK-cDImE6C6TIUEqMYMApQ7fNjkCIJYGhQ0M';

export const supabase = createClient(supabaseUrl, supabaseKey);
