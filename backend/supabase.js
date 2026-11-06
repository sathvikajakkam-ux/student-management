/**
 * Supabase Client Initialization
 * Connects the Node.js / Express backend to the Supabase PostgreSQL database.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
  console.warn('\n⚠️  WARNING: Supabase URL or Key is not configured in backend/.env!');
  console.warn('   Please create a project at https://supabase.com, copy your credentials,');
  console.warn('   and paste them into backend/.env to connect to your PostgreSQL database.\n');
}

// Initialize the Supabase client
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

module.exports = supabase;

