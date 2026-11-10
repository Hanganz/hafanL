/* Hafan Laundry - pasang sebagai aplikasi (PWA) v1.3.14. Dipakai tombol "Pasang aplikasi" di halaman Profil. */
(function(){
'use strict';
const W=window;let ev=null;
const ua=navigator.userAgent||'';
const standalone=()=>{try{return W.matchMedia('(display-mode: standalone)').matches||W.matchMedia('(display-mode: fullscreen)').matches||W.navigator.standalone===true}catch(e){return false}};
const ios=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const ping=()=>{try{document.dispatchEvent(new Event('pwa-change'))}catch(e){}};
W.addEventListener('beforeinstallprompt',e=>{e.preventDefault();ev=e;ping()});
W.addEventListener('appinstalled',()=>{ev=null;ping();try{PF.toast('Aplikasi berhasil dipasang')}catch(e){}});
W.PWA={installed:standalone,ios:()=>ios,can:()=>!!ev,
  async install(){if(!ev)return 'manual';ev.prompt();let r={};try{r=await ev.userChoice}catch(e){}ev=null;ping();return r.outcome||'x'}};
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
  const had=!!navigator.serviceWorker.controller;
  W.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had&&!W._pwaR){W._pwaR=1;try{PF.toast('Versi baru terpasang. Muat ulang untuk memakainya','warn')}catch(e){}}});
}
})();
