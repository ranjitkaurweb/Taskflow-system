// src/lib/supabase.js
// ─────────────────────────────────────────────────────────────
// This file creates ONE shared Supabase connection for your app.
// Every hook and component imports from this file.
// ─────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

// These come from your .env file (see .env.example)
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env and fill in your values.'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
