#!/usr/bin/env bash
# Menambah atribut SRI (integrity + crossorigin) ke tag <script> CDN di index.html.
# Cara pakai (di komputer yang punya internet, bash, curl, openssl):  bash tambah-sri.sh
# Hash dihitung dari file asli di CDN saat skrip dijalankan. Jalankan lagi jika versi pustaka diganti.
set -euo pipefail
cd "$(dirname "$0")"
URLS=(
  "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
)
for u in "${URLS[@]}"; do
  h=$(curl -fsSL "$u" | openssl dgst -sha384 -binary | openssl base64 -A)
  [ -n "$h" ] || { echo "Gagal menghitung hash: $u"; exit 1; }
  # ganti tag lama (dengan atau tanpa SRI) memakai tag baru
  python3 - "$u" "$h" <<'PY'
import re,sys
u,h=sys.argv[1],sys.argv[2]
s=open('index.html',encoding='utf-8').read()
new='<script src="%s" integrity="sha384-%s" crossorigin="anonymous"></script>'%(u,h)
s2,n=re.subn(r'<script src="%s"[^>]*></script>'%re.escape(u),new,s)
if n!=1: sys.exit('Tag tidak ditemukan untuk '+u)
open('index.html','w',encoding='utf-8').write(s2)
PY
  echo "OK  sha384-$h  $u"
done
echo "Selesai. Deploy ulang index.html."
