/* =====================================================================
   >>> SUPABASE: ISI BAGIAN INI SAJA <<<
   1. SB_URL : Project URL             (Supabase > Project Settings > API)
   2. SB_KEY : anon / publishable key  (JANGAN service_role!)
   File ini boleh terlihat publik; keamanan data ada di SQL (supabase_keamanan.sql).
   ===================================================================== */
window.KL_CONFIG = {
  SB_URL: 'https://neposhpkamrfvbwvbjcv.supabase.co',
  SB_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcG9zaHBrYW1yZnZid3ZiamN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MjMwMjgsImV4cCI6MjEwODQ5OTAyOH0.wCu3nEHaBR5X0fLmcrAuyYyVoF08GIcO1y2lT9zViWA', // kunci anon (boleh publik)
  // true  = login staf diingat di perangkat ini, tidak perlu masuk ulang (localStorage).
  // false = login hilang saat tab ditutup. Pakai true hanya di HP/komputer toko sendiri.
  INGAT_LOGIN: true,
  VERSI: '1.1'
};
