/* Hafan Laundry - notifikasi in-app (v1.3.16), window.NT
   - Sumber data: RPC (kl_notif_daftar untuk staf, kl_notif_publik untuk pelanggan). RPC SELALU jadi sumber kebenaran.
   - Real-time (hanya staf): WebSocket Realtime Supabase sebagai "pemicu" untuk mengambil ulang lewat RPC.
     Bila tidak tersambung, polling berjalan (30 dtk staf, 60 dtk pelanggan; 120 dtk bila real-time hidup).
   - Pelanggan memakai polling saja (menjaga batas koneksi Realtime paket gratis).
   - Notifikasi saat aplikasi tertutup (Web Push) belum tersedia; lihat PANDUAN-NOTIFIKASI.md. */
(function(){
'use strict';
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const staf=()=>{try{return SB_ROLE==='staf'}catch(e){return false}};
const own=()=>{try{return owner()}catch(e){return false}};
const IK=(n,s)=>(window.ikt&&window.IK&&window.IK[n])?window.ikt(n,s||40):'';
const TIPE={pengumuman:['Pengumuman','megafon'],operasional:['Informasi operasional','toko'],pesanan:['Pesanan','order'],pembayaran:['Pembayaran','bayar'],aplikasi:['Pembaruan aplikasi','info']};
const TARGET={semua:'Semua pengguna (staf dan pelanggan)',staf:'Semua staf',owner:'Owner saja',kasir:'Kasir saja',pelanggan:'Semua pelanggan'};
const N={buka2:new Set(),items:[],tak:0,ada:false,load:false,err:'',ok:false,filter:'semua',terbaru:0,seen:0,last:0,off:false,
  live:false,ws:null,hb:0,tk:0,bo:0,rt:0,start:false,
  adm:{tab:'tulis',judul:'',isi:'',tipe:'pengumuman',target:'staf',kunci:'',busy:false,riw:[],riwAda:false,riwLoad:false,riwErr:'',riwOk:false}};
const LSK='kl_nt_c_baca';
const lsG=()=>{try{return +localStorage.getItem(LSK)||0}catch(e){return 0}};
const lsS=v=>{try{localStorage.setItem(LSK,String(v))}catch(e){}};
const kunciBaru=()=>{try{return crypto.randomUUID()}catch(e){return 'k'+Date.now().toString(36)+Math.random().toString(36).slice(2,10)}};
function rel(t){const d=(Date.now()-new Date(t).getTime())/1000;if(!(d>=0))return '';if(d<60)return 'baru saja';if(d<3600)return Math.floor(d/60)+' mnt lalu';if(d<86400)return Math.floor(d/3600)+' jam lalu';
  if(d<172800)return 'kemarin';try{return new Date(t).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}catch(e){return ''}}
function errMsg(e){const m=String((e&&e.message)||e||'');
  if((e&&e.status===404)||/Could not find|PGRST202|does not exist|42883/i.test(m))return 'Fitur notifikasi belum aktif di server. Jalankan sql/20_notifikasi.sql di Supabase.';
  if(/DITOLAK|42501/i.test(m))return 'Akses ditolak.';
  if(/TERLALU_SERING/i.test(m))return 'Terlalu banyak kiriman. Tunggu sekitar satu menit.';
  if(/DATA_TIDAK_VALID|22023/i.test(m))return 'Isi notifikasi tidak valid. Periksa judul dan isi.';
  if(/fetch|network|load failed|abort|timeout|JARINGAN/i.test(m))return 'Tidak ada koneksi internet. Periksa jaringan lalu coba lagi.';
  return 'Terjadi kesalahan. '+m.slice(0,80)}
const hilang=e=>(e&&e.status===404)||/Could not find|PGRST202|does not exist|42883/i.test(String((e&&e.message)||e||''));

/* ---------- data ---------- */
async function ambil(sebelum){
  return staf()?await sbRpc('kl_notif_daftar',{p_sebelum:sebelum||null,p_limit:20},true):await sbRpc('kl_notif_publik',{p_sebelum:sebelum||null,p_limit:20})}
function hitungTak(){if(!staf()){const lr=lsG();N.tak=N.items.filter(x=>x.id>lr).length}}
async function refresh(o){
  o=o||{};if(N.off||N.load&&!o.paksa)return;N.load=true;if(!o.diam){N.err='';paintCenter()}
  try{
    const j=await ambil(null);const it=(j&&j.items)||[];
    const min=it.length?Math.min.apply(null,it.map(x=>x.id)):Infinity;
    const lama=N.items.filter(x=>x.id<min&&j&&j.ada_lagi);       // pertahankan halaman lama yang sudah dimuat
    const terbaruLama=N.seen;
    N.items=it.concat(lama);N.ada=!!(j&&j.ada_lagi)||lama.length>0&&N.ada;N.terbaru=(j&&j.terbaru)||0;
    if(staf())N.tak=(j&&j.tak_dibaca)||0;else hitungTak();
    N.ok=true;N.err='';N.last=Date.now();
    if(terbaruLama>0&&N.terbaru>terbaruLama){const baru=it.filter(x=>x.id>terbaruLama&&(staf()?!x.dibaca:x.id>lsG()));if(baru.length)datang(baru)}
    if(N.terbaru>N.seen)N.seen=N.terbaru;
  }catch(e){if(hilang(e)){N.off=true;N.err=errMsg(e)}else N.err=o.diam?N.err:errMsg(e)}
  N.load=false;paint();paintCenter()}
function datang(baru){
  const x=baru[0];try{PF.toast((baru.length>1?baru.length+' notifikasi baru: ':'')+x.judul,'warn')}catch(e){}
  try{if(PF.pref('getar')&&navigator.vibrate)navigator.vibrate(30)}catch(e){}
  try{if(document.hidden&&PF.pref('sistem')&&'Notification' in window&&Notification.permission==='granted')new Notification(x.judul,{body:String(x.isi).slice(0,120),icon:'/icons/icon-192.png'})}catch(e){}}
async function lagi(){
  if(N.load||!N.ada||!N.items.length)return;N.load=true;paintCenter();
  try{const j=await ambil(Math.min.apply(null,N.items.map(x=>x.id)));N.items=N.items.concat((j&&j.items)||[]);N.ada=!!(j&&j.ada_lagi);hitungTak()}
  catch(e){PF.toast(errMsg(e),true)}
  N.load=false;paintCenter()}

/* ---------- status baca ---------- */
async function tandai(ids){   // ids = array id, atau null = semua
  const target=ids?N.items.filter(x=>ids.includes(x.id)&&!x.dibaca):N.items.filter(x=>!x.dibaca);
  if(!staf()){const mx=Math.max(lsG(),...N.items.map(x=>x.id));lsS(mx);hitungTak();paint();paintCenter();return}
  if(!target.length&&ids)return;
  const lama=N.tak;target.forEach(x=>{x.dibaca=true});N.tak=ids?Math.max(0,N.tak-target.length):0;paint();paintCenter();
  try{await sbRpc('kl_notif_tandai',{p_ids:ids||null},true)}
  catch(e){target.forEach(x=>{x.dibaca=false});N.tak=lama;paint();paintCenter();PF.toast('Gagal menandai dibaca. '+errMsg(e),true)}}
function klik(id){
  const el=document.querySelector('.nt-it[data-id="'+id+'"]');if(N.buka2.has(id))N.buka2.delete(id);else N.buka2.add(id);if(el)el.classList.toggle('open');
  const x=N.items.find(z=>z.id===id);if(x&&!x.dibaca&&staf())tandai([id]);
  else if(x&&!staf()&&x.id>lsG()){lsS(Math.max(lsG(),x.id));hitungTak();paint();if(el)el.classList.remove('baru')}}

/* ---------- tampilan ---------- */
const BELL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>';
function bell(){const n=N.tak;return `<button class="nt-bell" onclick="NT.buka()" aria-label="Notifikasi${n?', '+n+' belum dibaca':''}">${BELL}<i class="nt-n"${n?'':' hidden'}>${n>99?'99+':n}</i></button>`}
function paint(){document.querySelectorAll('.nt-bell').forEach(b=>{const i=b.querySelector('.nt-n');if(!i)return;i.hidden=!N.tak;i.textContent=N.tak>99?'99+':N.tak;b.setAttribute('aria-label','Notifikasi'+(N.tak?', '+N.tak+' belum dibaca':''))});
  document.querySelectorAll('.nt-rowbadge').forEach(i=>{i.hidden=!N.tak;i.textContent=N.tak>99?'99+':N.tak})}
function itemHtml(x){
  const t=TIPE[x.tipe]||TIPE.pengumuman,baru=staf()?!x.dibaca:x.id>lsG();
  return `<button class="nt-it${baru?' baru':''}${N.buka2.has(x.id)?' open':''}" data-id="${x.id}" onclick="NT.klik(${x.id})"><span class="nt-ic">${IK(t[1],40)}</span><span class="nt-t"><b>${E(x.judul)}</b><span class="nt-b">${E(x.isi)}</span><small>${rel(x.dibuat)} · ${t[0]}${x.oleh?' · '+E(x.oleh):''}</small></span>${baru?'<i class="nt-dot" aria-label="Belum dibaca"></i>':''}</button>`}
function centerHtml(){
  if(N.off)return `<div class="pf-empty">${PF.ico('info')}<p>${E(N.err||'Fitur notifikasi belum aktif.')}</p></div>`;
  const staff=staf(),list=N.filter==='baru'?N.items.filter(x=>staff?!x.dibaca:x.id>lsG()):N.items;
  const bar=`<div class="nt-bar"><div class="pf-chips" style="margin:0"><button class="${N.filter==='semua'?'on':''}" onclick="NT.saring('semua')">Semua</button><button class="${N.filter==='baru'?'on':''}" onclick="NT.saring('baru')">Belum dibaca${N.tak?' ('+N.tak+')':''}</button></div>${N.tak?`<button class="pf-lnk" onclick="NT.bacaSemua()">Baca semua</button>`:''}</div>`;
  let body;
  if(N.err&&!N.items.length)body=`<div class="pf-empty">${PF.ico('info')}<p>${E(N.err)}</p><button class="pf-btn sec" onclick="NT.coba()">Coba lagi</button></div>`;
  else if(!N.ok&&N.load&&!N.items.length)body=Array.from({length:4},()=>`<div class="nt-it"><span class="pf-sk" style="width:40px;height:40px;border-radius:13px"></span><span class="nt-t"><span class="pf-sk" style="width:60%"></span><br><span class="pf-sk" style="width:90%;margin-top:8px"></span></span></div>`).join('');
  else if(!list.length)body=`<div class="pf-empty">${PF.ico('bell')}<p>${N.filter==='baru'?'Semua notifikasi sudah dibaca.':'Belum ada notifikasi.'}</p></div>`;
  else body=list.map(itemHtml).join('')+(N.ada&&N.filter==='semua'?`<button class="pf-btn sec" onclick="NT.lagi()"${N.load?' disabled':''}>${N.load?'Memuat…':'Muat lebih banyak'}</button>`:'');
  const adm=staff&&own()?`<button class="pf-btn" onclick="NT.kirim()">${PF.ico('edit')}Kirim pengumuman</button>`:'';
  const st=staff?`<p class="nt-st">${N.live?'Terhubung real-time':'Diperbarui otomatis tiap 30 detik'}</p>`:'';
  return bar+`<div class="nt-list">${body}</div>${adm}${st}`}
function paintCenter(){const e=$('#nt-body');if(e)e.innerHTML=centerHtml()}
function buka(){
  PF.sheet('Notifikasi',staf()?'Pengumuman untuk akun Anda':'Pengumuman dari Hafan Laundry','<div id="nt-body"></div>');N.filter='semua';paintCenter();
  if(!N.ok||Date.now()-N.last>15000)refresh({diam:N.ok,paksa:true})}
function saring(f){N.filter=f;paintCenter()}
function coba(){N.off=false;refresh({paksa:true})}

/* ---------- admin: kirim & riwayat (owner) ---------- */
function admHtml(){
  const A=N.adm;
  const tab=`<div class="pf-seg"><button class="${A.tab==='tulis'?'on':''}" onclick="NT.admTab('tulis')">Tulis</button><button class="${A.tab==='riwayat'?'on':''}" onclick="NT.admTab('riwayat')">Riwayat</button></div>`;
  if(A.tab==='riwayat'){
    let b;
    if(A.riwErr)b=`<div class="pf-empty"><p>${E(A.riwErr)}</p><button class="pf-btn sec" onclick="NT.riw(true)">Coba lagi</button></div>`;
    else if(A.riwLoad&&!A.riw.length)b=`<div class="nt-it"><span class="pf-sk" style="width:70%"></span></div>`;
    else if(!A.riw.length)b=`<div class="pf-empty"><p>Belum ada notifikasi yang dikirim.</p></div>`;
    else b=A.riw.map(x=>{const t=TIPE[x.tipe]||TIPE.pengumuman;
      return `<div class="nt-it nt-adm"><span class="nt-ic">${IK(t[1],40)}</span><span class="nt-t"><b>${E(x.judul)}</b><span class="nt-b" style="-webkit-line-clamp:2">${E(x.isi)}</span><small>${rel(x.dibuat)} · ${E(TARGET[x.target]||x.target)}${x.target==='pelanggan'?'':' · dibaca '+x.dibaca_n+' dari '+x.staf_n+' staf'}</small>${x.status==='ditarik'?'<small><i class="by-p mut">Ditarik</i></small>':`<small><button class="pf-lnk" style="padding:0" onclick="NT.tarik(${x.id})">Tarik notifikasi</button></small>`}</span></div>`}).join('')+(A.riwAda?`<button class="pf-btn sec" onclick="NT.riw(false)"${A.riwLoad?' disabled':''}>Muat lebih banyak</button>`:'');
    return tab+b}
  const ops=(o,v)=>Object.keys(o).map(k=>`<option value="${k}"${k===v?' selected':''}>${E(Array.isArray(o[k])?o[k][0]:o[k])}</option>`).join('');
  return tab+`<div class="pf-f" data-h=""><label for="nt-j">Judul</label><input id="nt-j" maxlength="120" value="${E(A.judul)}" oninput="NT.ketik()" placeholder="Contoh: Toko libur Jumat"><small>Maksimal 120 karakter</small></div>
   <div class="pf-f" data-h=""><label for="nt-i">Isi pesan</label><textarea id="nt-i" maxlength="2000" oninput="NT.ketik()" placeholder="Tulis pengumuman yang jelas dan singkat">${E(A.isi)}</textarea><span class="pf-cnt" id="nt-ic" style="top:2px">${A.isi.length}/2000</span><small>Maksimal 2000 karakter</small></div>
   <div class="pf-f" data-h=""><label for="nt-tp">Jenis</label><select id="nt-tp" class="nt-sel" onchange="NT.ketik()">${ops(TIPE,A.tipe)}</select></div>
   <div class="pf-f" data-h=""><label for="nt-tg">Penerima</label><select id="nt-tg" class="nt-sel" onchange="NT.ketik()">${ops(TARGET,A.target)}</select><small>${A.tipe==='pembayaran'?'Pelunasan order terjadi otomatis dari sistem. Jangan memakai ini sebagai bukti bayar.':'Penerima melihatnya di pusat notifikasi.'}</small></div>
   <button class="pf-btn" onclick="NT.tinjau()">Tinjau dan kirim</button>`}
function kirim(){
  if(!staf()||!own())return;const A=N.adm;if(!A.kunci)A.kunci=kunciBaru();
  PF.sheet('Kirim notifikasi','Hanya owner yang dapat mengirim.','<div id="nt-adm"></div>');paintAdm();if(A.tab==='riwayat'&&!A.riwOk)riw(true)}
function paintAdm(){const e=$('#nt-adm');if(e)e.innerHTML=admHtml()}
function baca(){const A=N.adm;const g=id=>($('#'+id)||{value:''}).value;if($('#nt-j'))A.judul=g('nt-j');if($('#nt-i'))A.isi=g('nt-i');if($('#nt-tp'))A.tipe=g('nt-tp');if($('#nt-tg'))A.target=g('nt-tg')}
function ketik(){baca();const c=$('#nt-ic');if(c)c.textContent=N.adm.isi.length+'/2000'}
function admTab(t){baca();N.adm.tab=t;paintAdm();if(t==='riwayat'&&!N.adm.riwOk)riw(true)}
async function riw(ulang){
  const A=N.adm;if(A.riwLoad)return;if(ulang){A.riw=[];A.riwAda=false}A.riwLoad=true;A.riwErr='';paintAdm();
  try{const j=await sbRpc('kl_notif_riwayat',{p_sebelum:A.riw.length?Math.min.apply(null,A.riw.map(x=>x.id)):null,p_limit:20},true);A.riw=A.riw.concat((j&&j.items)||[]);A.riwAda=!!(j&&j.ada_lagi);A.riwOk=true}
  catch(e){A.riwErr=errMsg(e)}
  A.riwLoad=false;paintAdm()}
function tinjau(){
  baca();const A=N.adm,j=A.judul.trim(),i=A.isi.trim();
  const f=(id,m)=>{const el=$('#'+id);if(!el)return;const w=el.closest('.pf-f');w.classList.toggle('err',!!m);w.querySelector('small').textContent=m||w.getAttribute('data-h')||w.querySelector('small').textContent};
  let bad=false;
  if(!j){f('nt-j','Judul wajib diisi');bad=true}else if(j.length>120){f('nt-j','Judul terlalu panjang');bad=true}else f('nt-j','');
  if(!i){f('nt-i','Isi pesan wajib diisi');bad=true}else if(i.length>2000){f('nt-i','Isi terlalu panjang');bad=true}else f('nt-i','');
  if(bad)return;
  const t=TIPE[A.tipe];
  PF.sheet('Kirim notifikasi ini?','Periksa sebelum dikirim. Notifikasi tidak bisa diedit, hanya ditarik.',
   `<div class="nt-it open" style="pointer-events:none"><span class="nt-ic">${IK(t[1],40)}</span><span class="nt-t"><b>${E(j)}</b><span class="nt-b">${E(i)}</span><small>${t[0]}</small></span></div>
    <div class="pf-info">${PF.ico('info')}<span>Penerima: <b>${E(TARGET[A.target])}</b>.${A.target==='semua'||A.target==='pelanggan'?' Pesan ini akan terlihat oleh pelanggan.':''}</span></div>
    <button class="pf-btn" id="nt-go" onclick="NT.kirimSekarang()">Kirim sekarang</button><button class="pf-btn sec" onclick="NT.kirim()">Kembali mengubah</button>`)}
async function kirimSekarang(){
  const A=N.adm;if(A.busy)return;A.busy=true;const b=$('#nt-go');if(b){b.disabled=true;b.innerHTML='<i class="pf-sp"></i>Mengirim…'}
  try{
    const r=await sbRpc('kl_notif_kirim',{p_judul:A.judul.trim(),p_isi:A.isi.trim(),p_tipe:A.tipe,p_target:A.target,p_kunci:A.kunci},true);
    A.judul='';A.isi='';A.kunci=kunciBaru();A.riwOk=false;A.tab='riwayat';A.busy=false;
    PF.toast(r&&r.baru===false?'Notifikasi ini sudah terkirim sebelumnya':'Notifikasi terkirim');kirim();refresh({diam:true,paksa:true});
  }catch(e){A.busy=false;if(b){b.disabled=false;b.textContent='Kirim sekarang'}PF.toast(errMsg(e),true)}}   // kunci tetap: kirim ulang tidak membuat ganda
function tarik(id){
  PF.sheet('Tarik notifikasi?','Notifikasi tidak tampil lagi bagi penerima. Riwayat tetap tersimpan.',`<button class="pf-btn bad" id="nt-tr" onclick="NT.doTarik(${id})">Tarik notifikasi</button><button class="pf-btn sec" onclick="NT.kirim()">Batal</button>`)}
async function doTarik(id){
  const b=$('#nt-tr');if(b){b.disabled=true;b.innerHTML='<i class="pf-sp"></i>Memproses…'}
  try{await sbRpc('kl_notif_tarik',{p_id:id},true);N.adm.riwOk=false;PF.toast('Notifikasi ditarik');kirim();refresh({diam:true,paksa:true})}
  catch(e){if(b){b.disabled=false;b.textContent='Tarik notifikasi'}PF.toast(errMsg(e),true)}}

/* ---------- baris di menu Profil ---------- */
function baris(){
  const rows=[PF.row({ic:'bell',t:'Pusat notifikasi',s:N.tak?N.tak+' belum dibaca':'Pengumuman untuk Anda',act:"NT.buka()",end:`<i class="nt-rowbadge"${N.tak?'':' hidden'}>${N.tak>99?'99+':N.tak}</i>${'<svg class="pf-ch" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>'}`})];
  if(staf()&&own())rows.push(PF.row({ic:'edit',t:'Kirim pengumuman',s:'Ke staf atau pelanggan',act:"NT.kirim()"}));
  return rows}

/* ---------- real-time (staf) ---------- */
function sambung(){
  if(!staf()||N.ws||N.off||typeof WebSocket==='undefined')return;
  let ws;try{ws=new WebSocket(SB_URL.replace(/^http/,'ws')+'/realtime/v1/websocket?apikey='+encodeURIComponent(SB_KEY)+'&vsn=1.0.0')}catch(e){return}
  N.ws=ws;let ref=0;const topik='realtime:hl-notif';
  const kirimWs=(t,ev,p)=>{try{if(ws.readyState===1)ws.send(JSON.stringify({topic:t,event:ev,payload:p,ref:String(++ref),join_ref:'1'}))}catch(e){}};
  ws.onopen=async()=>{let tok=null;try{tok=await sbToken()}catch(e){}
    kirimWs(topik,'phx_join',{config:{broadcast:{ack:false,self:false},presence:{key:''},postgres_changes:[{event:'INSERT',schema:'public',table:'kl_notif'},{event:'UPDATE',schema:'public',table:'kl_notif'}],private:false},access_token:tok||SB_KEY});
    clearInterval(N.hb);N.hb=setInterval(()=>kirimWs('phoenix','heartbeat',{}),25000);
    clearInterval(N.tk);N.tk=setInterval(async()=>{let t2=null;try{t2=await sbToken()}catch(e){}if(t2)kirimWs(topik,'access_token',{access_token:t2})},45*60000)};
  ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}
    if(m.event==='phx_reply'&&m.topic===topik){
      if(m.payload&&m.payload.status==='ok'){N.live=true;N.bo=0;paintCenter();refresh({diam:true,paksa:true})}
      else{N.live=false;try{ws.close()}catch(e){}N.rt=Date.now()+10*60000}}      // gagal bergabung (mis. SQL 20 belum jalan): polling saja, coba lagi 10 menit
    else if(m.event==='postgres_changes')refresh({diam:true,paksa:true})};
  ws.onclose=()=>{clearInterval(N.hb);clearInterval(N.tk);N.live=false;N.ws=null;paintCenter();
    const tunggu=Math.max(0,N.rt-Date.now())||Math.min(30000,1000*Math.pow(2,N.bo++));setTimeout(sambung,tunggu)};
  ws.onerror=()=>{try{ws.close()}catch(e){}}}

/* ---------- mulai ---------- */
function init(){
  if(N.start)return;N.start=true;
  refresh({diam:true,paksa:true});sambung();
  setInterval(()=>{if(document.hidden||N.off)return;const jeda=N.live?120000:(staf()?30000:60000);if(Date.now()-N.last>=jeda)refresh({diam:true,paksa:true})},10000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-N.last>10000)refresh({diam:true,paksa:true});if(!document.hidden)sambung()});
  window.addEventListener('online',()=>{refresh({diam:true,paksa:true});sambung()})}

window.NT={init,bell,buka,klik,saring,coba,lagi,bacaSemua:()=>tandai(null),kirim,admTab,riw,ketik,tinjau,kirimSekarang,tarik,doTarik,baris,paint,refresh,state:N};
})();
