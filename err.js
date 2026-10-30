/* Penangkap error: jika aplikasi gagal jalan, pesan errornya tampil di layar (bukan layar kosong) */
(function(){function t(m){try{var d=document.getElementById('klerr');if(!d){d=document.createElement('pre');d.id='klerr';d.style.cssText='position:fixed;left:0;right:0;top:0;z-index:999;margin:0;padding:12px 14px;background:#7f1d1d;color:#fff;font:12px/1.4 monospace;white-space:pre-wrap;max-height:50vh;overflow:auto';(document.body||document.documentElement).appendChild(d)}d.textContent+=m+'\n'}catch(e){}}
window.addEventListener('error',function(e){t('Error: '+(e.message||'')+' ('+String(e.filename||'').split('/').pop()+':'+(e.lineno||'?')+')')});
window.addEventListener('unhandledrejection',function(e){t('Error: '+((e.reason&&e.reason.message)||e.reason))})})();
