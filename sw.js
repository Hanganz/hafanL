/* Hafan Laundry - service worker (v1.3.16)
   Strategi: jaringan dulu, cadangan dari cache bila offline. Sehingga pembaruan selalu langsung terpakai saat online.
   Hanya file milik situs sendiri (GET). Permintaan ke Supabase, CDN, dan font TIDAK disentuh. Data aplikasi tetap butuh internet. */
const V='hl-1.3.16';
self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    try{
      const c=await caches.open(V);
      const r=await fetch('/',{cache:'reload'});
      const t=await r.clone().text();
      await c.put('/',r);
      const urls=[...t.matchAll(/(?:src|href)="(\/[^"#]+)"/g)].map(m=>m[1]).filter(u=>!u.startsWith('//'));
      await Promise.all(urls.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})));
    }catch(err){}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys())if(k!==V&&k.startsWith('hl-'))await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',e=>{
  const q=e.request;if(q.method!=='GET')return;
  const u=new URL(q.url);if(u.origin!==location.origin||u.pathname==='/sw.js')return;
  e.respondWith((async()=>{
    try{
      const r=await fetch(q);
      if(r&&r.ok&&r.type==='basic'){const c=await caches.open(V);c.put(q,r.clone())}
      return r;
    }catch(err){
      const c=await caches.open(V);
      const m=await c.match(q);if(m)return m;
      if(q.mode==='navigate'){const s=await c.match('/');if(s)return s}
      return new Response('Tidak ada koneksi internet.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
    }
  })());
});

/* Web Push: handler siap pakai, TIDAK aktif sampai ada langganan push dan pengirim di server (lihat PANDUAN-NOTIFIKASI.md).
   Payload yang diharapkan: {"judul":"...","isi":"...","url":"/dashboard"} */
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{}}catch(err){d={isi:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(String(d.judul||'Hafan Laundry').slice(0,80),{body:String(d.isi||'').slice(0,200),icon:'/icons/icon-192.png',badge:'/icons/favicon-48.png',data:{url:/^\//.test(d.url||'')?d.url:'/'}}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();const u=(e.notification.data&&e.notification.data.url)||'/';
  e.waitUntil((async()=>{const l=await clients.matchAll({type:'window',includeUncontrolled:true});for(const c of l){if('focus' in c){await c.focus();if('navigate' in c)try{await c.navigate(u)}catch(x){}return}}if(clients.openWindow)await clients.openWindow(u)})());
});
