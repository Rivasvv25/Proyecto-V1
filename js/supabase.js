// FloraID — Supabase Client Init

const SUPABASE_URL = 'https://vzxhrccpkqzqkclezzmm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGhyY2Nwa3F6cWtjbGV6em1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNTMwOTIsImV4cCI6MjA4OTYyOTA5Mn0.fw_-25T0lH8VGwcLTuvojnX0mShe4yXW1QWlGaD8AWg';

const _supabaseLib = window.supabase;

if (_supabaseLib && typeof _supabaseLib.createClient === 'function') {
  // Overwrite the library object with the actual client globally
  window.supabase = _supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.error('Supabase library not loaded. Check the CDN script tag.');
  alert('Error: No se pudo cargar la librería de Supabase. Recarga la página.');
}
