/* Konfigurasi Supabase dibaca dari config.js (isi URL dan anon key di sana). */
const SB_URL = String((window.KL_CONFIG || {}).SB_URL || 'ISI_SUPABASE_URL_DI_SINI');
const SB_KEY = String((window.KL_CONFIG || {}).SB_KEY || 'ISI_SUPABASE_ANON_KEY_DI_SINI');

const sbOk = () => /^https:\/\//.test(SB_URL) && SB_KEY.length > 20 && !/ISI_/.test(SB_URL + SB_KEY);
let SB_ROLE = 'tamu';   // 'staf' = sudah login akun staf dan data penuh termuat; 'tamu' = pelanggan
let SB_PERAN = '', SB_NAMA = '', SB_EM = '', SB_VER = 0, SB_PH = '';
const S=JSON.parse(document.getElementById('data').textContent);
const DEF=[{k:'reg',n:'Kiloan Reguler',h:7000,u:'kg',j:48,on:1},{k:'exp',n:'Kiloan Express',h:10000,u:'kg',j:6,on:1},{k:'sel',n:'Selimut',h:25000,u:'pcs',j:72,on:1},{k:'bed',n:'Bedcover',h:35000,u:'pcs',j:72,on:1},{k:'spt',n:'Sepatu',h:30000,u:'pasang',j:72,on:1},{k:'krp',n:'Karpet Besar',h:15000,u:'m2',j:96,on:1}];
if(!S.svc)S.svc=DEF;
const SV={};S.svc.forEach(s=>SV[s.k]=s);S.prd=S.prd||[];S.prd.forEach(p=>{SV[p.k]=p});
const ST=['Diterima','Diproses','Selesai','Diambil'],STN=['Diterima','Diproses','Selesai','Diambil','Dibatalkan'];
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rp=n=>'Rp'+Number(n||0).toLocaleString('id-ID');
const fmt=t=>new Date(t).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const dig=s=>String(s).replace(/\D/g,'');
let per='h',ed=null,delId=null,q='',cscr='home',qid=null,lid=null,fl='',pid=null,pm=null,qpop=false,tu=null,ds='ord',rt={n:0,c:''},acOpen={},mnId=null,okId=null,ln=[],feT=false,lm='k',tsr=0,dirty=false,cbk=null,vcOn=0,newOid=null;
const nomor=w=>{let n=dig(w);if(n[0]==='0')n='62'+n.slice(1);return n};
let adm=false,tab='home',scr='cust',found=null;
try{adm=sessionStorage.getItem('adm')==='1'}catch(e){}
const ss=(k,v)=>{try{v==null?sessionStorage.removeItem(k):sessionStorage.setItem(k,v)}catch(e){}};
const sg=k=>{try{return sessionStorage.getItem(k)}catch(e){return null}};
function toast(m){const t=$('#toast');t.textContent=m;t.style.opacity=1;setTimeout(()=>t.style.opacity=0,2500)}
let _a,_d;
async function cap(n){try{if(window.claude)return await claude.use(n)}catch(e){}
  if(n==='downloads')return {save:async({filename,data})=>{const b=data instanceof Blob?data:new Blob([data],{type:'application/octet-stream'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}};
  return null}
let _sv=false,_t0=0,_infl=0,_q=false;
function tampilSimpan(on,msg){let e=document.getElementById('svg');if(!on){if(e)e.remove();_sv=false;return}if(!e){document.body.insertAdjacentHTML('beforeend','<div id="svg"><i class="spin3"></i><span></span></div>');e=document.getElementById('svg')}e.querySelector('span').textContent=msg||'Menyimpan…'}
/* =====================================================================
   TAG: PENYIMPANAN UTAMA = SUPABASE (menggantikan publish artifact)
   Staf  : login Supabase Auth -> kl_muat / kl_simpan (data penuh)
   Tamu  : fungsi publik terbatas (info toko, lacak kode, akun sendiri)
   ===================================================================== */
const SB_SESI='kl_sb';
let _sesiMem=null;
function _stSesi(){try{return (window.KL_CONFIG||{}).INGAT_LOGIN?localStorage:sessionStorage}catch(e){return null}}
function sbSesiGet(){if(_sesiMem)return _sesiMem;try{const st=_stSesi(),x=st?JSON.parse(st.getItem(SB_SESI)||'null'):null;if(x)_sesiMem=x;return x}catch(e){return null}}
function sbSesiSet(s){_sesiMem=s||null;try{const st=_stSesi();if(st)s?st.setItem(SB_SESI,JSON.stringify(s)):st.removeItem(SB_SESI)}catch(e){}}
try{if(!(window.KL_CONFIG||{}).INGAT_LOGIN)localStorage.removeItem(SB_SESI)}catch(e){}
async function sbAuth(path,body,tok){
  const h={apikey:SB_KEY,'Content-Type':'application/json'};if(tok)h.Authorization='Bearer '+tok;
  const r=await fetch(SB_URL+'/auth/v1/'+path,{method:'POST',headers:h,body:JSON.stringify(body||{})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(j.error_description||j.msg||j.message||('HTTP '+r.status));e.status=r.status;throw e}
  return j}
const sbMk=(j,em0)=>({at:j.access_token,rt:j.refresh_token,exp:Date.now()+(j.expires_in||3600)*1000,em:(j.user&&j.user.email)||em0||''});
async function sbLogin(em,pw){sbSesiSet(sbMk(await sbAuth('token?grant_type=password',{email:em,password:pw})))}
let _rf=null;
async function sbToken(){
  const s=sbSesiGet();if(!s)return null;if(s.exp-Date.now()>60000)return s.at;
  if(!_rf)_rf=(async()=>{try{const n=sbMk(await sbAuth('token?grant_type=refresh_token',{refresh_token:s.rt}),s.em);sbSesiSet(n);return n.at}
    catch(e){if(e.status===400||e.status===401||e.status===403)sbSesiSet(null);return null}finally{_rf=null}})();
  return _rf}
async function sbRpc(fn,args,staf){
  const h={apikey:SB_KEY,'Content-Type':'application/json'};
  if(staf){const t=await sbToken();if(!t){const e=new Error('SESI_HABIS');e.status=401;throw e}h.Authorization='Bearer '+t}
  else if(SB_KEY.indexOf('eyJ')===0)h.Authorization='Bearer '+SB_KEY;
  const ac=typeof AbortController!=='undefined'?new AbortController():null,tm=ac?setTimeout(()=>ac.abort(),12000):0;
  let r,tx;try{r=await fetch(SB_URL+'/rest/v1/rpc/'+fn,{method:'POST',headers:h,body:JSON.stringify(args||{}),cache:'no-store',signal:ac?ac.signal:undefined});tx=await r.text()}
  catch(e){const x=new Error(e&&e.name==='AbortError'?'WAKTU_HABIS':'JARINGAN');x.status=0;throw x}finally{if(tm)clearTimeout(tm)}let j=null;try{j=tx?JSON.parse(tx):null}catch(e){}
  if(!r.ok){const e=new Error((j&&(j.message||j.hint))||('HTTP '+r.status));e.status=r.status;throw e}
  return j}
function replaceS(d){Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,d);if(!S.svc)S.svc=DEF;S.prd=S.prd||[];S.orders=S.orders||[];
  Object.keys(SV).forEach(k=>delete SV[k]);S.svc.forEach(s=>SV[s.k]=s);S.prd.forEach(p=>{SV[p.k]=p})}

/* ---- sisi TAMU: pasang data terbatas milik pelanggan ke S (hanya di memori) ---- */
function sbInject(o,ctx,lim){
  S._lim=lim?1:0;S._pt=S._pt||{};
  const add=x=>{if(x&&!S.orders.some(z=>z.id===x.id))S.orders.push(x)};
  if(ctx){(ctx.orders||[]).forEach(add);const k=ctx.k;S.sal=S.sal||{};S.sal[k]=ctx.sal||0;S.tebus=S.tebus||{};S.tebus[k]=ctx.tebus||0;S.vc=S.vc||{};S.vc[k]=ctx.vc||0;
    if(ctx.pt!=null)S._pt[k]=ctx.pt;S.tu=(S.tu||[]).filter(x=>x.k!==k).concat(ctx.tu||[])}
  add(o);return o?S.orders.find(z=>z.id===o.id):null}
function sbPasang(d){if(!d)return;sbInject(null,d.ctx,0);S._me={n:d.n,w:d.ctx?d.ctx.k:'',tw:d.tw}}
function sbBersih(){S.orders=[];S.sal={};S.tebus={};S.vc={};S.tu=[];S._pt={};S._me=null;S._lim=0}

async function sbBoot(){
  if(!sbOk()){toast('Supabase belum diisi (lihat bagian >>> SUPABASE <<< di atas kode)');return}
  if(sbSesiGet()){
    try{
      const r=await sbRpc('kl_muat',{},true);
      if(r&&r.data&&Array.isArray(r.data.orders)){replaceS(r.data);_base=deltaSnap()}
      SB_VER=+r.versi||0;SB_PH=r.ph||'';SB_PERAN=r.peran||'';SB_NAMA=r.nama||'';SB_EM=(sbSesiGet()||{}).em||'';SB_ROLE='staf';return
    }catch(e){
      if(e.status===401||e.status===403){sbSesiSet(null);toast('Akun ini tidak punya akses staf')}
      else toast('Gagal memuat data: '+(e.message||e)+'. Muat ulang halaman.')
    }
  }
  try{const p=await sbRpc('kl_publik',{});replaceS(Object.assign({orders:[],seq:0},p||{nama:S.nama}))}catch(e){toast('Gagal memuat info toko: '+(e.message||e))}
  sbLanjut();   // pemulihan sesi/pelacakan terakhir berjalan di latar belakang, tidak menahan tampilan
}
async function sbLanjut(){
  let ada=false;
  try{const t=localStorage.getItem('kl_at');if(t){const d=await sbRpc('kl_akun_sesi',{p_token:t});if(d){sbPasang(d);ada=true}else localStorage.removeItem('kl_at')}}catch(e){}
  try{const l=bacaKodeUrl()?null:JSON.parse(localStorage.getItem('lc2')||'null');if(l){const r=l.m==='k'?await sbRpc('kl_lacak_kode',{p_kode:l.k}):await sbRpc('kl_lacak_nota',{p_nota:l.n,p_wa4:l.w});if(r&&r.o){sbInject(r.o,r.ctx,r.lim);ada=true}}}catch(e){}
  if(ada&&SB_ROLE!=='staf'&&!lcMsg)try{draw()}catch(e){}
}

/* ---- sisi STAF: proyeksi data publik (dikirim bersama simpan) ---- */
function kKey(w){const k=nw(w);if(!S.ksl)S.ksl=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
  return '9'+(String(h32(S.ksl+'|'+k+'|a')).padStart(10,'0')+String(h32(S.ksl+'|'+k+'|b')).padStart(10,'0')).slice(0,12)}
const SB_KEEP=['id','no','nama','jb','jem','ant','jj','ja','sv','qty','hs','total','disk','dn','cat','masuk','est','sel','st','bayar','dp','met','vc','jual'];
function pubO(o,k,lim){const x={};SB_KEEP.forEach(f=>{if(o[f]!==undefined)x[f]=o[f]});x.wa=k;
  if(o.it)x.it=o.it.map(i=>Object.assign({},i));
  if(o.pay)x.pay=o.pay.map(p=>({t:p.t,a:p.a,m:p.m}));
  x.log=(o.log||[]).map(l=>({t:l.t,s:l.s}));
  if(o.batal)x.batal={t:o.batal.t,alasan:o.batal.alasan};
  if(lim)delete x.cat;else if(o.alm)x.alm=o.alm;
  return x}
function sbProyeksi(){
  const now=Date.now(),W=45*864e5,ctx={},lac=[];
  const mkCtx=wa=>{const n=nw(wa),k=kKey(wa);if(ctx[k])return k;
    const os=S.orders.filter(o=>nw(o.wa)===n).sort((a,b)=>a.masuk-b.masuk).slice(-20);
    ctx[k]={k,orders:os.map(o=>pubO(o,k,0)),sal:(S.sal&&S.sal[n])||0,tebus:(S.tebus&&S.tebus[n])||0,vc:(S.vc&&S.vc[n])||0,pt:poin(wa),
      tu:(S.tu||[]).filter(x=>nw(x.k)===n).slice(-30).map(x=>({t:x.t,a:x.a,k}))};return k};
  S.orders.forEach(o=>{if(!(o.st<3||now-o.masuk<W))return;const k=mkCtx(o.wa);
    lac.push({kode:tkc(o),nota:o.no||null,idn:String(o.id),wa4:dig(o.wa).slice(-4),k,o:pubO(o,k,0),lim:pubO(o,k,1)})});
  const akun=(S.acc||[]).map(a=>({wa:a.w,s:a.s,h:a.h,n:a.n,tw:'******'+String(a.w).slice(-4),k:mkCtx(a.w)}));
  const c=Object.keys(ctx).map(k=>ctx[k]),js=JSON.stringify([lac,c,akun]);
  return {lac,c,akun,ph:h32(js)+'.'+h32(js.length+js.slice(-400))+'.'+js.length}}

let _base=null,_noDelta=false;
function deltaSnap(){const t={},o=new Map();Object.keys(S).forEach(k=>{if(k==='orders'||k.charAt(0)==='_')return;t[k]=JSON.stringify(S[k])});(S.orders||[]).forEach(x=>o.set(String(x.id),JSON.stringify(x)));return {t,o}}
function buangPin(){if(SB_PERAN!=='owner')return;delete S.pin;(S.kar||[]).forEach(k=>{delete k.pin})}
async function save(){
  if(_sv){S.stamp=Date.now();try{localStorage.setItem('kl_bk',JSON.stringify({stamp:S.stamp,t:S.stamp,from:_infl,ver:SB_VER,data:S}))}catch(e){}_q=true;tampilSimpan(true,'Menyimpan… perubahan berikutnya menunggu');return false}
  if(SB_ROLE!=='staf'){toast('Masuk sebagai admin/karyawan dulu untuk menyimpan data');return false}
  buangPin();kKey('0');
  _sv=true;_t0=Date.now();ss('t0',_t0);S.stamp=_t0;_infl=_t0;_q=false;try{localStorage.setItem('kl_bk',JSON.stringify({stamp:_t0,t:_t0,ver:SB_VER,data:S}))}catch(e){}tampilSimpan(true);
  setTimeout(()=>{if(_sv)tampilSimpan(true,'Masih menyimpan… jangan tutup halaman')},8000);
  setTimeout(()=>{if(_sv){tampilSimpan(false);toast('Penyimpanan lambat. Periksa koneksi, lalu cek apakah data sudah tersimpan.')}},30000);
  const px=sbProyeksi(),kirim=px.ph!==SB_PH,nb=deltaSnap();
  const fullBody=()=>'{"p_data":'+JSON.stringify(S)+',"p_basis":'+SB_VER+',"p_ph":'+JSON.stringify(px.ph)+',"p_lacak":'+(kirim?JSON.stringify(px.lac):'null')+',"p_ctx":'+(kirim?JSON.stringify(px.c):'null')+',"p_akun":'+(kirim?JSON.stringify(px.akun):'null')+'}';
  let fn='kl_simpan',body=null;
  if(_base&&!_noDelta&&SB_VER>0&&!Object.keys(_base.t).some(k=>!(k in nb.t))){
    const set={},up=[],hp=[];
    Object.keys(nb.t).forEach(k=>{if(_base.t[k]!==nb.t[k])set[k]=S[k]});
    S.orders.forEach(x=>{const id=String(x.id);if(_base.o.get(id)!==nb.o.get(id))up.push(x)});
    _base.o.forEach((v,id)=>{if(!nb.o.has(id))hp.push(id)});
    fn='kl_simpan_delta';
    body=JSON.stringify({p_basis:SB_VER,p_set:set,p_orders:up,p_hapus:hp,p_ph:px.ph,p_lacak:kirim?px.lac:null,p_ctx:kirim?px.c:null,p_akun:kirim?px.akun:null});
  }
  try{draw()}catch(e){}
  try{
    const t=await sbToken();if(!t){const e=new Error('SESI_HABIS');throw e}
    const post=(f,b)=>fetch(SB_URL+'/rest/v1/rpc/'+f,{method:'POST',headers:{apikey:SB_KEY,'Content-Type':'application/json',Authorization:'Bearer '+t},body:b});
    let r=await post(fn,body||fullBody());
    if(!r.ok&&fn==='kl_simpan_delta'&&r.status===404){_noDelta=true;fn='kl_simpan';r=await post(fn,fullBody())}
    if(!r.ok){let j=null;try{j=await r.json()}catch(e){}const e=new Error((j&&(j.message||j.hint))||('HTTP '+r.status));e.status=r.status;throw e}
    if(!_q){try{localStorage.removeItem('kl_bk')}catch(e){}}
    /* berhasil: tidak perlu muat ulang. Versi dan hash lacak dicatat di memori, layar digambar ulang di tempat */
    let nv=null;try{const j=await r.json();nv=(j&&typeof j==='object')?(j.versi!=null?j.versi:j.ver):j}catch(_){}
    SB_VER=(nv!=null&&isFinite(+nv)&&+nv>SB_VER)?+nv:SB_VER+1;SB_PH=px.ph;_base=nb;dirty=false;
    ss('t0',null);tampilSimpan(false);setTimeout(()=>{try{waFlush()}catch(_){}},50);
    toast('Tersimpan dalam '+((Date.now()-_t0)/1000).toFixed(1)+' detik');
    try{draw()}catch(_){}
    if(_q){_q=false;setTimeout(save,100)}
    return true
  }catch(e){tampilSimpan(false);const m=String(e.message||e);
    if(/KONFLIK/.test(m)){_q=false;konflikAsk();return false}
    if(/DITOLAK_PERAN/.test(m)){_q=false;toast('Peran Anda tidak boleh melakukan perubahan ini. Muat ulang halaman untuk mengambil data terbaru.');return false}
    toast(/SESI_HABIS/.test(m)||e.status===401?'Sesi berakhir. Masuk lagi sebagai staf. Perubahan Anda aman di perangkat ini.':'Gagal menyimpan: '+m);
    if(_q){_q=false;setTimeout(save,400)}
    return false}
}

/* ---- konflik simpan: jangan buang perubahan pengguna ---- */
function konflikAsk(){ask('Data sudah diubah dari perangkat lain, jadi simpanan ini ditolak agar data terbaru tidak tertimpa. Perubahan Anda belum hilang: unduh salinannya dulu, lalu muat ulang data terbaru dan ketik ulang perubahan yang perlu.',async()=>{
  try{await dlf('perubahan-belum-tersimpan-'+Date.now()+'.json',JSON.stringify({app:'kasir-laundry',v:2,t:Date.now(),data:S}))}catch(e){}location.reload()},'Unduh & muat ulang')}

/* ---- layar & aksi login staf ---- */
function dSbLogin(){$('#app').innerHTML=`<div class="pg"><div class="hero">${logoH()}<h1>Masuk Staf</h1><p class="mut">Khusus admin dan karyawan. Cukup sekali masuk dengan email dan kata sandi.</p></div><div class="card"><label>Email</label><input id="sbe" type="email" autocomplete="username" onkeydown="entSb(event)"><label>Kata sandi</label><input id="sbp" type="password" autocomplete="current-password" onkeydown="entSb(event)"><button class="b" style="width:100%;margin:14px 0 0" onclick="sbMasuk()">Masuk</button></div><p class="lnk" onclick="go('pin')">← Kembali</p></div>`}
function entSb(e){if(e.key==='Enter')sbMasuk()}
async function sbMasuk(){const em=$('#sbe').value.trim(),pw=$('#sbp').value;if(!sbOk()){toast('Supabase belum diisi di kode');return}if(!em||!pw){toast('Isi email dan kata sandi');return}
  toast('Memeriksa…');try{await sbLogin(em,pw);try{localStorage.removeItem('kl_at');localStorage.removeItem('acc')}catch(e){}location.reload()}
  catch(e){toast(/invalid login|credentials/i.test(e.message)?'Email atau kata sandi salah':'Gagal masuk: '+e.message)}}
function sbKeluar(){
  const belum=dirty||_sv||_q||!!bkLocal();
  ask(belum?'Ada perubahan yang belum tersimpan dan akan hilang kalau keluar. Tetap keluar?':'Keluar dari akun '+(me()||SB_EM||'staf')+'? Sesi Supabase di perangkat ini diakhiri.',sbKeluarGo,'Keluar')}
async function sbKeluarGo(){
  toast('Keluar…');
  try{const t=await Promise.race([sbToken(),new Promise(r=>setTimeout(()=>r(null),4000))]);
    if(t)await Promise.race([fetch(SB_URL+'/auth/v1/logout?scope=local',{method:'POST',headers:{apikey:SB_KEY,Authorization:'Bearer '+t}}),new Promise(r=>setTimeout(r,4000))])}catch(e){}
  sbSesiSet(null);
  try{['kl_sb','kl_bk','kl_at','lc','lc2','acc'].forEach(k=>localStorage.removeItem(k));sessionStorage.clear()}catch(e){}
  location.replace(location.pathname)}

/* ---- login pelanggan (diverifikasi server) ---- */
async function cekPin(){
  if(SB_ROLE==='staf'){toast('Keluar dari akun staf dulu untuk masuk sebagai pelanggan');return}
  const v=$('#pn').value,no=$('#pno').value,w=nw(no);
  if(!v||!dig(no)){toast('Isi nomor dan kata sandi');return}
  toast('Memeriksa…');
  try{const salt=await sbRpc('kl_akun_salt',{p_wa:w}),h=await hpw(v,ub64(salt)),r=await sbRpc('kl_akun_masuk',{p_wa:w,p_hash:h});
    if(r&&r.token){try{localStorage.setItem('kl_at',r.token)}catch(e){}sbPasang(r.data);scr='cust';cscr='akun';draw();return}
  }catch(e){toast(/TERLALU_BANYAK/.test(e.message)?'Terlalu banyak percobaan. Coba lagi 15 menit lagi.':'Gagal terhubung. Coba lagi.');return}
  toast('No. HP/WA atau kata sandi salah')}
function lcErr(e){const m=String((e&&e.message)||e),st=e&&e.status;
  if(/TERLALU_BANYAK/.test(m))return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.';
  if(m==='WAKTU_HABIS')return 'Server lama merespons.';
  if(m==='JARINGAN'||st===0)return 'Tidak bisa menjangkau server (JARINGAN). Periksa internet atau alamat Supabase di config.js.';
  if(st===401||st===403)return 'Akses ditolak server ('+st+'): '+m+'. Admin: periksa kunci anon dan izin fungsi kl_lacak_kode.';
  if(st===404)return 'Fungsi pelacakan belum ada di server (404). Admin: jalankan supabase_keamanan.sql.';
  return 'Gagal ('+(st||'?')+'): '+m}
async function rpcUlang(fn,args){try{return await sbRpc(fn,args)}catch(e){if(e&&e.status===0){await new Promise(r=>setTimeout(r,1500));return await sbRpc(fn,args)}throw e}}
async function cari(){
  lcPre='';lcMsg='';if(SB_ROLE==='staf')return cariStaf();
  const k=($('#ck').value||'').trim().toUpperCase().replace(/\s+/g,''),w=dig($('#cw')?$('#cw').value:'');let o=null;
  if(lm==='k'?k.length!==6:!(k&&w.length===4)){found='x';draw();return}
  toast('Mencari…');
  try{const r=lm==='k'?await rpcUlang('kl_lacak_kode',{p_kode:k}):await rpcUlang('kl_lacak_nota',{p_nota:k,p_wa4:w});
    if(r&&r.o){o=sbInject(r.o,r.ctx,r.lim);try{localStorage.setItem('lc2',JSON.stringify(lm==='k'?{m:'k',k}:{m:'n',n:k,w}));localStorage.setItem('lc',o.id+':'+(lm==='k'?'k:'+k:'w:'+w))}catch(e){}}
  }catch(e){toast(lcErr(e));return}
  found=o||'x';draw()}
function logoutAcc(){try{localStorage.removeItem('acc');const t=localStorage.getItem('kl_at');localStorage.removeItem('kl_at');if(t&&SB_ROLE!=='staf')sbRpc('kl_akun_keluar',{p_token:t}).catch(()=>{})}catch(e){}if(SB_ROLE!=='staf')sbBersih();cscr='home';draw()}
function sisa(o){return o.bayar==='Lunas'?'Lunas':o.bayar==='DP'?'Sisa '+rp(o.total-o.dp):'Belum bayar'}
const DT={baru:`Halo {nama}, cucian Anda sudah kami terima.
Nota {nota}: {layanan}
Total {total} ({bayar})
Estimasi selesai: {estimasi}
Kode tracking: {kode}
Cek proses: {link}
- {laundry}`,selesai:`Halo {nama}, cucian Anda (Nota {nota}) sudah SELESAI dan siap diambil.
Total {total} ({bayar}).
Terima kasih - {laundry}`,ingat:`Halo {nama}, pengingat dari {laundry}: cucian Anda (Nota {nota}) sudah selesai dan siap diambil. {bayar}. Terima kasih.`,terima:`Terima kasih {nama} sudah mempercayakan cucian Anda kepada {laundry}. Ditunggu kedatangannya kembali.`};
function baseUrl(){const b=(S.base||'').trim();if(b&&!/claude\.ai\/artifact/i.test(b))return b;
  return /^https?:/.test(location.href)?location.origin+location.pathname.replace(/index\.html$/,''):b}
function fill(k,o){let s=((S.tpl&&S.tpl[k])||DT[k]).split('#{nota}').join('{nota}');if(!baseUrl())s=s.split('\n').filter(l=>!l.includes('{link}')).join('\n');
  const v={nama:o.nama,nota:nn(o),kode:tkc(o),layanan:itemsTxt(o),total:rp(o.total),bayar:sisa(o),estimasi:fmt(o.est),link:baseUrl()?baseUrl()+(/[#?]/.test(baseUrl())?'':'#lacak='+tkc(o)):'',laundry:S.nama};
  return s.replace(/\{(\w+)\}/g,(m,x)=>x in v?v[x]:m)}
function waUrl(o,done){return 'https://wa.me/'+nomor(o.wa)+'?text='+encodeURIComponent(fill(done?'selesai':'baru',o))}
const loadImg=u=>new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.onerror=()=>r(null);im.src=u});
const BLN=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],p2=n=>String(n).padStart(2,'0');
function fmtL(t){const d=new Date(t);return d.getDate()+' '+BLN[d.getMonth()]+' '+d.getFullYear()+', '+p2(d.getHours())+':'+p2(d.getMinutes())}
function fmtS(t){const d=new Date(t);return p2(d.getDate())+'/'+p2(d.getMonth()+1)+' '+p2(d.getHours())+':'+p2(d.getMinutes())}
function fq(q){return String(Math.round((+q||0)*100)/100).replace('.',',')}
function numIn(v){return parseFloat(String(v==null?'':v).replace(',','.'))||0}
/* ===== Printer thermal Bluetooth (BLE, ESC/POS) =====
   Struk digambar sebagai gambar (sama persis dengan nota), diubah jadi hitam-putih lalu dikirim ke printer.
   Hanya printer Bluetooth LE (BLE) yang didukung browser. Dipakai di Chrome Android / Chrome desktop. */
let _bt={dev:null,ch:null};
const BT_SVC=[0xffe0,0xff00,0x18f0,0xfee7,0xfff0,'49535343-fe7d-4ae5-8fa9-9fafd205e455','e7810a71-73ae-499d-8c15-faa9aef0c3f2'];
function btW(){try{return +localStorage.getItem('kl_btw')||384}catch(e){return 384}}
function btSetW(v){try{localStorage.setItem('kl_btw',v)}catch(e){}}
function btErr(e){if(e&&e.name==='NotFoundError'){toast('Pemilihan printer dibatalkan');return}toast('Gagal cetak: '+((e&&e.message)||e))}
async function btHubung(ganti){
  if(!navigator.bluetooth)throw new Error('Browser ini belum mendukung Bluetooth. Pakai Chrome di Android.');
  if(_bt.ch&&_bt.dev&&_bt.dev.gatt.connected&&!ganti)return _bt.ch;
  let d=_bt.dev;if(!d||ganti)d=await navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:BT_SVC});
  if(_bt.dev!==d){_bt.dev=d;d.addEventListener('gattserverdisconnected',()=>{_bt.ch=null})}
  const sv=await d.gatt.connect(),ss=await sv.getPrimaryServices();
  for(const s of ss){if(/^0000(1800|1801|180a|180f)/.test(s.uuid))continue;const cs=await s.getCharacteristics();for(const c of cs){if(c.properties.writeWithoutResponse||c.properties.write){_bt.ch=c;return c}}}
  throw new Error('Printer terhubung tetapi tidak ada jalur cetak. Kemungkinan printer ini Bluetooth klasik (bukan BLE).')}
function btBytes(cv){
  const W=btW(),h=Math.round(cv.height*W/cv.width),t=document.createElement('canvas');t.width=W;t.height=h;const g=t.getContext('2d');
  g.fillStyle='#fff';g.fillRect(0,0,W,h);g.imageSmoothingQuality='high';g.drawImage(cv,0,0,W,h);
  const px=g.getImageData(0,0,W,h).data,bw=W>>3,out=[0x1B,0x40];
  for(let y0=0;y0<h;y0+=200){const n=Math.min(200,h-y0);out.push(0x1D,0x76,0x30,0,bw&255,bw>>8,n&255,n>>8);
    for(let y=y0;y<y0+n;y++)for(let x=0;x<bw;x++){let b=0;for(let i=0;i<8;i++){const p=(y*W+x*8+i)*4;if(0.299*px[p]+0.587*px[p+1]+0.114*px[p+2]<170)b|=0x80>>i}out.push(b)}}
  out.push(0x1B,0x64,4);return new Uint8Array(out)}
async function btKirim(by){
  const c=await btHubung(),fn=c.properties.writeWithoutResponse?'writeValueWithoutResponse':'writeValue';let sz=180;
  for(let i=0;i<by.length;){try{await c[fn](by.slice(i,i+sz));i+=sz;await new Promise(r=>setTimeout(r,20))}catch(e){if(sz>20){sz=20;continue}throw e}}}
async function btCetak(cv){try{const by=btBytes(cv);await btHubung();toast('Mencetak…');await btKirim(by);toast('Selesai dicetak')}catch(e){btErr(e)}}
async function btTes(){try{await btHubung();const c=document.createElement('canvas');c.width=480;c.height=200;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,480,200);g.fillStyle='#000';g.textAlign='center';g.font='bold 30px "Courier New",monospace';g.fillText(S.nama||'Hafan Laundry',240,60);g.font='22px "Courier New",monospace';g.fillText('Tes cetak berhasil',240,105);g.fillText('Lebar kertas: '+(btW()===576?'80':'58')+' mm',240,140);g.fillText('--------------------------',240,175);await btCetak(c)}catch(e){btErr(e)}}
function btCard(){const w=btW();return `<div class="card"><h2>Printer thermal Bluetooth</h2><p class="mut">Hubungkan printer struk Bluetooth (BLE), lalu pakai tombol 🖨 Cetak di order. Pengaturan ini tersimpan di perangkat ini saja.</p><label>Lebar kertas</label><select onchange="btSetW(this.value)"><option value="384"${w===384?' selected':''}>58 mm</option><option value="576"${w===576?' selected':''}>80 mm</option></select><button class="b" onclick="btTes()">Hubungkan &amp; tes cetak</button><button class="b g" onclick="_bt.dev=null;_bt.ch=null;toast('Printer dilupakan, pilih lagi saat mencetak')">Ganti printer</button></div>`}
function wrapLines(t,font,mw){const g=document.createElement('canvas').getContext('2d');g.font=font;const w=String(t||'').replace(/\s+/g,' ').trim().split(' ').filter(Boolean),L=[];let c='';w.forEach(x=>{const n=c?c+' '+x:x;if(g.measureText(n).width>mw&&c){L.push(c);c=x}else c=n});if(c)L.push(c);return L}
async function nota(id,opt){
  if(opt&&opt.cetak){try{await btHubung()}catch(e){btErr(e);return}}
  const o=S.orders.find(x=>x.id==id),W=480,P=28,pd=o.total-tagih(o),pays=o.pay||(pd>0?legacy(o):[]),pmx=S.pm||{},its=items(o);
  const tr=!!baseUrl()&&typeof qrcode==='function',qr=qrisOn(o),lg=S.logo?await loadImg(S.logo):null,adL=wrapLines(pmx.alamat,'14px "Courier New",Courier,monospace',W-2*P);
  const H=920+(lg?100:0)+300+its.length*64+(o.disk?32:0)+(o.cat?32:0)+(o.pj?32:0)+(adL.length*19+6)+(pmx.cs?28:0)+pays.length*30+(tr?220:0)+(qr?220:0);
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),F='"Courier New",Courier,monospace';
  g.fillStyle='#fff';g.fillRect(0,0,W,H);
  g.beginPath();g.moveTo(0,0);for(let x=0;x<=W;x+=16){g.lineTo(x+8,10);g.lineTo(x+16,0)}g.closePath();g.fillStyle='#e9edf3';g.fill();
  g.save();g.globalAlpha=.07;if(lg){g.drawImage(lg,W/2-190,H/2-190,380,380)}else{g.translate(W/2,H/2);g.rotate(-.5);g.fillStyle='#000';g.font='bold 90px sans-serif';g.textAlign='center';g.fillText(S.nama.toUpperCase().slice(0,12),0,0)}g.restore();
  let y=44;g.textAlign='center';g.fillStyle='#111';
  if(lg){const k=Math.min(76/lg.width,76/lg.height),lw=lg.width*k,lh=lg.height*k;g.drawImage(lg,W/2-lw/2,y+(76-lh)/2,lw,lh);y+=100}
  g.font='bold 30px '+F;g.fillText(S.nama.toUpperCase().slice(0,22),W/2,y);y+=30;g.font='17px '+F;
  g.font='14px '+F;g.fillStyle='#444';adL.forEach(l=>{g.fillText(l,W/2,y);y+=19});if(adL.length)y+=3;if(pmx.cs){g.fillText('WA Toko: '+pmx.cs,W/2,y);y+=24}g.fillStyle='#111';
  const dsh=()=>{g.textAlign='left';g.font='20px '+F;g.fillStyle='#111';g.fillText('-'.repeat(32),P,y);y+=30};
  const R=(a,b,bd)=>{g.font=(bd?'bold ':'')+'20px '+F;g.fillStyle='#111';g.textAlign='left';g.fillText(a,P,y);g.textAlign='right';g.fillText(b,W-P,y);y+=30};
  y+=8;dsh();R('NOTA',nn(o),1);R('KODE LACAK',tkc(o),1);R('TANGGAL',fmtL(o.masuk));R('EST. SELESAI',fmtL(o.est));
  {const am=(o.log||[]).find(l=>l.s===3);if(o.st===3&&am)R('DIAMBIL',fmtL(am.t))}
  R('PELANGGAN',String(o.nama).slice(0,18));R('WA PELANGGAN',(!dig(o.wa)||isTw(o.wa))?'-':String(o.wa));if(o.pj)R('KASIR',String(o.pj).slice(0,18));if(o.cat)R('CATATAN',o.cat.slice(0,20));dsh();
  its.forEach(x=>{g.textAlign='left';g.font='bold 21px '+F;g.fillStyle='#111';g.fillText(SV[x.sv].n.toUpperCase().slice(0,30),P,y);y+=30;R(fq(x.qty)+' '+SV[x.sv].u+' x '+rp(x.hs),rp(Math.round(x.qty*x.hs)))});
  if(o.disk)R('DISKON','-'+rp(o.disk));dsh();
  y+=8;g.fillStyle='#eef1f6';g.fillRect(P-10,y-30,W-2*P+20,46);g.fillStyle='#000';g.font='bold 28px '+F;g.textAlign='left';g.fillText('TOTAL',P,y);g.textAlign='right';g.fillText(rp(o.total),W-P,y);y+=46;g.fillStyle='#111';
  const mt=[...new Set(pays.map(p=>p.m))].join(', ');if(mt)R('METODE BAYAR',mt.slice(0,20));
  const lun=tagih(o)<=0;
  if(pays.length>1||!lun)pays.forEach(p=>R(fmtS(p.t),rp(p.a)));else if(pays.length===1)R('DIBAYAR',rp(pays[0].a));
  if(!lun)R('SISA BAYAR',rp(tagih(o)),1);
  if(lun){g.save();g.translate(W/2,y+34);g.rotate(-.12);g.strokeStyle='#1e9e5a';g.lineWidth=4;g.strokeRect(-72,-28,144,56);g.fillStyle='#1e9e5a';g.font='bold 32px sans-serif';g.textAlign='center';g.fillText('LUNAS',0,11);g.restore();y+=84}
  y+=4;dsh();
  if(tr){try{const w2=qrDraw(g,baseUrl()+(/[#?]/.test(baseUrl())?'':'#lacak='+tkc(o)),P,y,170),tx=P+w2+14,cl=wrapLines('Scan QR Code untuk cek status cucian Anda','bold 16px '+F,W-P-tx);g.textAlign='left';g.fillStyle='#111';g.font='bold 16px '+F;cl.forEach((l,i)=>g.fillText(l,tx,y+30+i*21));const y2=y+30+cl.length*21+14;g.font='14px '+F;g.fillText('Kode lacak:',tx,y2);g.font='bold 22px '+F;g.fillText(tkc(o),tx,y2+26)}catch(e){}y+=200}
  if(qr){try{const tg=tagih(o),w3=qrDraw(g,qrisAmt(S.qris,tg,refOf(o)),P,y,170);g.textAlign='left';g.fillStyle='#111';g.font='bold 18px '+F;g.fillText('BAYAR VIA QRIS',P+w3+14,y+44);g.font='bold 24px '+F;g.fillText(rp(tg),P+w3+14,y+80);g.font='15px '+F;g.fillText('e-wallet / m-banking',P+w3+14,y+106)}catch(e){}y+=200}
  if(tr||qr)dsh();g.textAlign='center';g.fillStyle='#111';g.font='bold 20px '+F;g.fillText('TERIMA KASIH',W/2,y);y+=26;
  if(pmx.ig){g.font='15px '+F;g.fillText('Instagram: @'+String(pmx.ig).replace(/^@/,''),W/2,y);y+=26}
  dsh();g.textAlign='center';g.font='bold 14px '+F;g.fillText('SYARAT & KETENTUAN',W/2,y);y+=21;g.font='13px '+F;g.fillStyle='#444';
  wrapLines('Komplain maksimal 1x24 jam setelah cucian diterima. Simpan struk ini sebagai bukti.','13px '+F,W-2*P).forEach(l=>{g.fillText(l,W/2,y);y+=18});y+=22;g.fillStyle='#111';
  g.fillStyle='#e9edf3';g.beginPath();g.moveTo(0,y);for(let x=0;x<=W;x+=16){g.lineTo(x+8,y+10);g.lineTo(x+16,y)}g.lineTo(W,y+14);g.lineTo(0,y+14);g.closePath();g.fill();
  const out=document.createElement('canvas');out.width=W;out.height=y+14;out.getContext('2d').drawImage(c,0,0);
  if(opt&&opt.cetak){btCetak(out);return}
  out.toBlob(async b=>{
    const f=new File([b],'struk-'+(o.no||o.id)+'.png',{type:'image/png'});
    try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:(opt&&opt.text)||('Struk '+nn(o))});return}}catch(e){if(e.name==='AbortError')return}
    let cp=false;
    if(opt&&opt.url){try{if(navigator.clipboard&&window.ClipboardItem){await navigator.clipboard.write([new ClipboardItem({'image/png':b})]);cp=true}}catch(e){}}
    if(!cp){const d=_d||(_d=await cap('downloads'));
      if(!d){toast('Tidak bisa membagikan gambar di sini');return}
      try{await d.save({filename:f.name,data:b})}catch(e){}}
    if(opt&&opt.url)$('#app').insertAdjacentHTML('beforeend',`<div class="ov hi" onclick="if(event.target===this)this.remove()"><div class="md"><h2>${cp?'Struk sudah disalin':'Struk sudah diunduh'}</h2><p class="mut">${cp?'Buka chat WA pelanggan, lalu tempel (Ctrl+V, atau tahan kolom pesan lalu pilih Tempel). Struk langsung muncul sebagai gambar.':'Buka chat WA pelanggan, lalu lampirkan gambar struk dari unduhan.'}</p><a class="b" style="display:block" target="_blank" rel="noopener" href="${opt.url}" onclick="this.closest('.ov').remove()">Buka chat WA</a><button class="b g" onclick="this.closest('.ov').remove()">Tutup</button></div></div>`);
  });
}
function intentW4B(ph,tx){const u='https://wa.me/'+ph+'?text='+encodeURIComponent(tx);return 'intent://send/?phone='+ph+'&text='+encodeURIComponent(tx)+'#Intent;scheme=whatsapp;package=com.whatsapp.w4b;S.browser_fallback_url='+encodeURIComponent(u)+';end'}
function wUrl(o,tx,biz){const n=nomor(o.wa);return biz?intentW4B(n,tx):'https://wa.me/'+n+'?text='+encodeURIComponent(tx)}
function kirimNota(id,done,biz){const o=S.orders.find(x=>x.id===id);if(!o)return;sentSet(id+':'+(done?'selesai':'baru'));nota(id,{text:fill(done?'selesai':'baru',o),url:wUrl(o,fill(done?'selesai':'baru',o),biz)})}
function closeKirim(){const e=document.getElementById('kr');if(e)e.remove()}
function kirimGambar(id,biz){closeKirim();const o=S.orders.find(x=>x.id===id);kirimNota(id,o.st>=2,biz)}
function openKirim(id){closeKirim();const o=S.orders.find(x=>x.id===id);if(!o)return;
  if(isTw(o.wa)){toast('Pelanggan ini tanpa nomor WA. Gunakan Lihat Nota, lalu bagikan atau cetak.');return}
  const done=o.st>=2,tk=fill(done?'selesai':'baru',o),tt=fill('terima',o),mk=o.id+':'+(done?'selesai':'baru');
  const lnk=(ic,t,s,href)=>`<a class="mrow" target="_blank" rel="noopener" href="${href}" onclick="sentSet('${mk}');closeKirim()"><span class="sic">${ic}</span><span><b>${t}</b><div class="mut" style="font-size:13px">${s}</div></span><span style="margin-left:auto;color:var(--mut)">›</span></a>`;
  const btn=(ic,t,s,act)=>`<button class="mrow" onclick="${act}"><span class="sic">${ic}</span><span><b>${t}</b><div class="mut" style="font-size:13px">${s}</div></span><span style="margin-left:auto;color:var(--mut)">›</span></button>`;
  $('#app').insertAdjacentHTML('beforeend',`<div class="ov hi mr" id="kr" onclick="if(event.target===this)closeKirim()"><div class="bs" style="max-height:88vh;overflow:auto"><div class="grip"></div><b style="display:block;margin:10px 4px 2px;font-size:18px">Kirim ke Pelanggan</b><p class="mut" style="margin:0 4px 6px">${esc(nn(o))} · ${esc(o.nama)}</p>
  <div class="kth">NOTA LENGKAP (TEKS)</div>${lnk('🏢','Kirim via WA Business','Untuk akun bisnis laundry',wUrl(o,tk,1))}${lnk('💬','Kirim via WA Biasa','Untuk akun WhatsApp pribadi',wUrl(o,tk,0))}
  <div class="kth">NOTA GAMBAR</div>${btn('🏢','Kirim via WA Business','Struk gambar, lalu tempel di chat',`kirimGambar(${o.id},1)`)}${btn('💬','Kirim via WA Biasa','Struk gambar, lalu tempel di chat',`kirimGambar(${o.id},0)`)}
  <div class="kth">UCAPAN TERIMA KASIH</div>${lnk('🏢','Kirim via WA Business','Ucapan singkat',wUrl(o,tt,1))}${lnk('💬','Kirim via WA Biasa','Ucapan singkat',wUrl(o,tt,0))}
  <p class="mut" style="font-size:12px;margin:10px 4px 0">WA Business hanya terbuka langsung di Android yang memasangnya. Di perangkat lain otomatis memakai WhatsApp biasa.</p></div></div>`)}
function go(s){scr=s;draw()}
function cariStaf(){const k=($('#ck').value||'').trim().toUpperCase().replace(/\s+/g,''),w=dig($('#cw')?$('#cw').value:'');let o=null;
  if(lm==='k')o=k.length>=4?S.orders.find(x=>tkc(x)===k):null;
  else o=(k&&w.length===4)?S.orders.find(x=>(x.no===k||(!/-/.test(k)&&String(x.id)===k.replace(/\D/g,'')))&&dig(x.wa).endsWith(w)):null;
  found=o||'x';if(o)try{localStorage.setItem('lc',o.id+':'+(lm==='k'?'k:'+k:'w:'+w))}catch(e){}
  draw()}
function balik(){found=null;lcPre='';lcMsg='';bersihHash();try{localStorage.removeItem('lc')}catch(e){}draw()}
function ent(e){if(e.key==='Enter')cari()}
function rRes(o){
  if(o==='x')return '<div class="card">Nota tidak ditemukan. Cek nomor nota dan 4 digit terakhir no. WA.</div>';
  return `<div class="card"><h2>Nota ${nn(o)} · ${esc(o.nama)}</h2><div class="tl">${ST.map((s,i)=>`<div class="st ${i<=o.st?'on':''}"><i></i>${s}</div>`).join('')}</div>
  <p>${SV[o.sv].n}, ${o.qty} ${SV[o.sv].u}</p><p>Estimasi selesai: <b>${fmt(o.est)}</b></p><p>Total ${rp(o.total)} · ${sisa(o)}</p><p>⭐ Poin Anda: <b>${poin(o.wa)}</b> <span class="mut">(1 poin tiap Rp10.000; 50 poin = diskon Rp25.000)</span></p></div>`;
}
function ico(st){
  const c=st>=2?'#1e9e5a':(S.warna||'#1a73c8');
  if(st>=2)return `<svg viewBox="0 0 120 120" width="120"><circle cx="60" cy="60" r="52" fill="${c}" opacity=".15"/><circle class="pop" cx="60" cy="60" r="36" fill="${c}"/><path d="M43 61l12 12 24-26" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `<svg viewBox="0 0 120 120" width="120"><rect x="22" y="12" width="76" height="96" rx="10" fill="var(--card)" stroke="${c}" stroke-width="5"/><circle cx="36" cy="26" r="4" fill="${c}"/><circle cx="48" cy="26" r="4" fill="${c}" opacity=".5"/><circle cx="60" cy="66" r="26" fill="none" stroke="${c}" stroke-width="5"/><g class="${st===1?'spin':''}" style="transform-origin:60px 66px"><path d="M60 66V46A20 20 0 0 1 78 56Z" fill="${c}" opacity=".35"/><circle cx="52" cy="72" r="6" fill="${c}" opacity=".6"/></g></svg>`}
let _t;
function tick(o){clearInterval(_t);const f=()=>{const e=$('#cd');if(!e){clearInterval(_t);return}
  if(o.st>=2){e.textContent='';return}const d=o.est-Date.now();
  if(d<=0){e.textContent='Hampir selesai, mohon ditunggu ya';return}
  const h=Math.floor(d/36e5),m=Math.floor(d%36e5/6e4);e.textContent='Perkiraan selesai '+(h?h+' jam ':'')+m+' menit lagi'};f();_t=setInterval(f,30000)}
function stepper(o){const s=o.st===4?-1:o.st;return `<div class="stp2">${ST.map((x,i)=>`<div class="sp ${i<=s?'on':''}"><i>${i<=s?'✓':''}</i>${x}</div>`).join('')}</div>`}
function acts(o){const L=[];(o.log&&o.log.length?o.log:[{t:o.masuk,s:0}].concat(o.sel?[{t:o.sel,s:2}]:[])).forEach(x=>L.push({t:x.t,x:['Pesanan Diterima','Cucian Diproses','Cucian Selesai Dikerjakan','Pesanan Diserahkan','Pesanan Dibatalkan'][x.s],c:['#2563eb','#f59e0b','#10b981','#8b5cf6','#ef4444'][x.s]}));(o.pay||legacy(o)).forEach(p=>L.push({t:p.t,x:'Pembayaran '+rp(p.a)+' via '+p.m,c:'#16a34a'}));return L.sort((a,b)=>b.t-a.t)}
function dProses(o){
  const msg=o.st===4?('Pesanan ini telah dibatalkan'+(o.batal&&o.batal.alasan?': '+o.batal.alasan:'')):(S.pst&&S.pst[o.st])||['Cucian Anda sudah kami terima','Sedang dicuci dengan teliti','Cucian sudah selesai dan siap diambil! 🎉','Sudah diambil. Terima kasih! 💙'][o.st],pd=o.total-tagih(o),pays=o.pay||(pd>0?legacy(o):[]),k=nw(o.wa),sl=(S.sal&&S.sal[k])||0;
  const tus=(S.tu||[]).filter(x=>x.k===k).map(x=>({t:x.t,a:x.a,x:'Top Up'})),sus=S.orders.filter(z=>nw(z.wa)===k).flatMap(z=>(z.pay||[]).filter(q=>q.m==='Saldo').map(q=>({t:q.t,a:-q.a,x:'Dipakai '+nn(z)}))),hs=tus.concat(sus).sort((a,b)=>b.t-a.t);
  const lun=tagih(o)<=0,chb=lun?'Lunas':(pd>0?'DP':'Belum lunas'),dl=[o.jem?'Jemput'+(o.jj?' '+fmt(o.jj):''):'',o.ant?'Antar'+(o.ja?' '+fmt(o.ja):''):''].filter(Boolean).join(' · ');
  $('#app').innerHTML=`<div class="pg trk"><div class="trh">${S.logo?`<img src="${esc(S.logo)}" alt="">`:''}<b>${esc(S.nama)}</b></div>
  <div class="tcd">${o.st===2?cf():''}<div class="hero" style="padding:0">${ico(o.st===4?0:o.st)}</div><small class="tk">KODE TRACKING</small><div class="tkc">${tkc(o)}</div><div class="mut" style="text-align:center">${esc(nn(o))} · <b style="color:var(--pri)">${esc(S.nama)}</b></div>
  <div style="text-align:center;margin:10px 0"><span class="chip s${o.st}">${STN[o.st]}</span> <span class="chip ${lun?'s2':''}">${chb}</span></div><p style="text-align:center;margin:4px 0">${esc(msg)}</p><p id="cd" class="cd" style="text-align:center"></p>
  ${stepper(o)}<div class="dd"><div><small>TANGGAL ORDER</small><b>${fmt(o.masuk)}</b></div><div><small>${o.st>=2?'SELESAI':'ESTIMASI SELESAI'}</small><b>${fmt(o.st>=2&&o.sel?o.sel:o.est)}</b></div></div></div>
  <div class="tc2"><span class="sic">${svg('usr')}</span><div><small>PELANGGAN</small><b>${esc(o.nama)}</b></div></div>
  <h3 class="sh3">LAYANAN</h3>${items(o).map(x=>`<div class="tc2 col"><div class="row"><b>${esc(SV[x.sv].n)}</b><b>${rp(Math.round(x.qty*x.hs))}</b></div><div class="mt" style="margin-top:6px"><span class="chip">${x.qty} ${esc(SV[x.sv].u)}</span>${(x.s||o.st>=2)&&o.st!==4?'<span class="chip s2">Siap</span>':''}<span class="chip">@ ${rp(x.hs)}/${esc(SV[x.sv].u)}</span>${x.c?`<span class="chip">${esc(x.c)}</span>`:''}</div></div>`).join('')}${o.cat?`<div class="tc2"><div><small>CATATAN</small>${esc(o.cat)}</div></div>`:''}
  <h3 class="sh3">PEMBAYARAN</h3><div class="dk"><div class="row" style="border-bottom:1px solid #ffffff22;padding-bottom:12px"><span style="opacity:.7">Total</span><b style="font-size:26px">${rp(o.total)}</b></div><div class="row" style="padding:12px 0"><span style="opacity:.7;letter-spacing:1px">STATUS</span><span class="chip s2" style="${lun?'':'background:#fee2e2;color:#b91c1c'}">${chb}</span></div>${pays.map(q=>`<div class="pr2"><div><b>${esc(q.m)}</b><small>${fmt(q.t)}</small></div><b style="color:#4ade80">${rp(q.a)}</b></div>`).join('')}${lun?'':`<div class="row" style="padding-top:10px"><span style="opacity:.7">Sisa bayar</span><b style="color:#fca5a5">${rp(tagih(o))}</b></div>`}</div>
  ${qrCard(o)}
  ${(sl>0||hs.length)?`<h3 class="sh3">SALDO DEPOSIT</h3><div class="tc2 col"><div class="row"><span>Saldo Saat Ini</span><b style="font-size:20px">${rp(sl)}</b></div>${hs.length?`<details style="margin-top:8px"><summary>Riwayat Saldo</summary>${hs.map(h=>`<div class="row" style="padding:6px 0"><span>${esc(h.x)}<div class="mut" style="font-size:12px">${fmt(h.t)}</div></span><b style="color:${h.a>0?'var(--ok)':'var(--bad)'}">${h.a>0?'+':'-'}${rp(Math.abs(h.a))}</b></div>`).join('')}</details>`:''}</div>`:''}
  <h3 class="sh3">PENGIRIMAN</h3><div class="tc2"><span class="sic">${svg('truk')}</span><div><small>STATUS PENGIRIMAN</small><b>${dl||'-'}</b>${o.alm&&dl?`<div class="mut">${esc(o.alm)}</div>`:''}</div></div>
  <h3 class="sh3">AKTIVITAS</h3><div class="tc2 col tl2">${acts(o).map(a=>`<div class="ac2"><i style="background:${a.c}"></i><div><small>${fmt(a.t)}</small><div>${esc(a.x)}</div></div></div>`).join('')}</div>
  ${S._lim?'':`<div class="card" style="margin-top:14px">⭐ Poin Anda: <b>${poin(o.wa)}</b><p class="mut">1 poin tiap Rp10.000. 50 poin = diskon Rp25.000.</p></div>`}${riwCard(o)}${o.st===3?rateCard(o):''}
  <button class="b g" onclick="balik()">← Cek nota lain</button>${foot(o)}</div>`;
  tick(o)}
const IC={home:'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',lacak:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',harga:'<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',cs:'<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.2A8 8 0 1 1 21 12z"/>',pin:'<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>'};
IC.share='<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>';
Object.assign(IC,{pend:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',baru:'<path d="M12 5v14M5 12h14"/>',pel:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14a6 6 0 0 1 3 5.5"/>',lap:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',set:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'});
Object.assign(IC,{t1:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM12 11v4l2.5 1.5"/>',t2:'<rect x="4" y="2.5" width="16" height="19" rx="3"/><circle cx="12" cy="13.5" r="4.5"/><path d="M8 6h.01M11 6h.01"/>',t3:'<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3.3 7.5L12 12.5l8.7-5M12 22v-9.5"/>',t4:'<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5"/><circle cx="16" cy="14.5" r="1"/>',t5:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M4 5L2 7M20 5l2 2"/>',t6:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5h.01"/>'});
Object.assign(IC,{usr:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',akun:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'});
Object.assign(IC,{truk:'<path d="M1 6h13v10H1zM14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',kal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',baju:'<path d="M8 3l-5 4 3 3 2-1v12h8V9l2 1 3-3-5-4a4 4 0 0 1-8 0z"/>',t7:'<path d="M1 6h13v10H1zM14 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'});
IC.more='<circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/>';
IC.toko='<path d="M6 7h12l1 13H5L6 7z"/><path d="M9 9V7a3 3 0 016 0v2"/>';
const svg=k=>`<svg viewBox="0 0 24 24">${IC[k]}</svg>`;
function navBar(){return `<nav class="nv">${[['home','Beranda'],['lacak','Lacak'],...(tokoList().length?[['toko','Toko']]:[]),['harga','Harga'],['info','Info'],['akun','Akun']].map(([k,l])=>`<button class="${cscr===k?'on':''}" onclick="nv('${k}')" aria-label="${l}">${svg(k)}<span>${l}</span></button>`).join('')}</nav>`}
function nv(k){try{navigator.vibrate&&navigator.vibrate(8)}catch(e){}cscr=k;if(found==='x')found=null;if(k!=='lacak')bersihHash();draw();try{window.scrollTo(0,0)}catch(e){}}
function restoreFound(){try{const l=localStorage.getItem('lc');if(!l)return;const p=l.split(':'),o=S.orders.find(x=>String(x.id)===p[0]);if(!o)return;let kd=p[1],v=p.slice(2).join(':');if(p.length===2){kd='w';v=p[1]}
  if(kd==='k'&&tkc(o)===v)found=o;else if(kd==='w'&&(SB_ROLE!=='staf'||dig(o.wa).endsWith(v)))found=o}catch(e){}}
function csUrl(){const p=S.pm||{};return p.cs?'https://wa.me/'+nomor(p.cs)+'?text='+encodeURIComponent('Halo '+S.nama+', saya mau tanya.'):''}
function promoUrl(i){const p=S.pm||{};if(!p.cs)return '';const j=(S.pj||[])[i]||('Promo #'+(i+1));return 'https://wa.me/'+nomor(p.cs)+'?text='+encodeURIComponent('Halo '+S.nama+', saya tertarik dengan promo: '+j+'. Apakah masih berlaku?')}
function carousel(id){const a=S.promo||[];if(!a.length)return '';
  return `<div class="carw"><div class="car" id="${id}">${a.map((u,i)=>{const h=promoUrl(i),c=(S.pj||[])[i],inn=`<img src="${esc(u)}" alt="Promo">${c?`<span class="cap">${esc(c)}</span>`:''}`;return h?`<a class="sl" target="_blank" rel="noopener" href="${h}">${inn}</a>`:`<div class="sl">${inn}</div>`}).join('')}</div>${a.length>1?`<div class="dt">${a.map((u,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>`:''}</div>`}
const iv={};
function carInit(id){clearInterval(iv[id]);const e=document.getElementById(id);if(!e||e.children.length<2)return;
  const n=e.children.length,dots=e.parentNode.querySelectorAll('.dt i');let i=0;
  e.addEventListener('scroll',()=>{i=Math.round(e.scrollLeft/e.clientWidth);dots.forEach((d,k)=>d.classList.toggle('on',k===i))});
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  iv[id]=setInterval(()=>{if(!document.getElementById(id)){clearInterval(iv[id]);return}i=(i+1)%n;e.scrollTo({left:i*e.clientWidth,behavior:'smooth'})},4200)}
function popUrl(){const p=S.pm||{},d=S.pop||{};if(!p.cs)return '';return 'https://wa.me/'+nomor(p.cs)+'?text='+encodeURIComponent(d.msg||('Halo '+S.nama+', saya tertarik dengan promo di poster ini. Apakah masih berlaku?'))}
function szPop(im){const W={s:300,m:420,l:420}[(S.pop||{}).w||'m'],r=(im.naturalWidth||1)/(im.naturalHeight||1);im.style.width=Math.max(160,Math.min(innerWidth*.92,W,innerHeight*.86*r))+'px'}
function popHtml(){const d=S.pop||{},u=popUrl(),im=`<img src="${esc(d.img)}" alt="Promo" onload="szPop(this)">`;
  return `<div class="ov" id="pop" onclick="if(event.target===this)closePop()"><div class="ppw"><button class="x" aria-label="Tutup" onclick="closePop()">×</button>${u?`<a target="_blank" rel="noopener" href="${u}" onclick="ss('pp','1')">${im}</a>`:im}</div></div>`}
function closePop(){ss('pp','1');const e=$('#pop');if(e)e.remove();clearInterval(iv.car2)}
const gi=(c,ic,l,act)=>/^https?:/.test(act)?`<a class="gi" target="_blank" rel="noopener" href="${esc(act)}" style="--c:${c}"><span class="gic">${svg(ic)}</span><span>${l}</span></a>`:`<button class="gi" style="--c:${c}" onclick="${act}"><span class="gic">${svg(ic)}</span><span>${l}</span></button>`;
let cart={},cmeta={nm:'',wa:'',mode:'ambil',al:'',ref:''};try{cart=JSON.parse(sessionStorage.getItem('cart')||'{}');Object.assign(cmeta,JSON.parse(sessionStorage.getItem('cmeta')||'{}'))}catch(e){}
const cSave=()=>{try{sessionStorage.setItem('cart',JSON.stringify(cart));sessionStorage.setItem('cmeta',JSON.stringify(cmeta))}catch(e){}};
function pImg(p){return p.img?`<span class="sji im"><img src="${esc(p.img)}" alt="${esc(p.n)}" loading="lazy"></span>`:`<span class="sji" style="--h:${hueOf(p.n)}">${esc(p.n[0].toUpperCase())}</span>`}
function prdFoto(i,inp){const f=inp.files&&inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=320;const g=c.getContext('2d'),s=Math.min(im.width,im.height);g.fillStyle='#fff';g.fillRect(0,0,320,320);g.drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,320,320);let u=c.toDataURL('image/webp',.78);if(u.indexOf('data:image/webp')!==0)u=c.toDataURL('image/jpeg',.78);bacaSv();S.prd[i].img=u;SV[S.prd[i].k]=S.prd[i];draw();toast('Foto siap, tekan Simpan')};im.onerror=()=>toast('Gambar tidak bisa dibaca');im.src=r.result};r.readAsDataURL(f)}
function hapusFoto(i){bacaSv();delete S.prd[i].img;SV[S.prd[i].k]=S.prd[i];draw()}
function tokoList(){return (S.prd||[]).filter(p=>p.on!==0&&p.h>0)}
function cMax(p){return p.st==null?99:Math.max(0,p.st)}
function cItems(){return Object.keys(cart).map(k=>({p:SV[k],q:cart[k]})).filter(x=>x.p&&x.p.p&&x.p.on!==0&&x.p.h>0&&x.q>0)}
function cTot(){return cItems().reduce((s,x)=>({n:s.n+x.q,t:s.t+x.q*x.p.h}),{n:0,t:0})}
function hueOf(s){let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))%360;return h}
function stokTxt(p){return p.st==null?'Tersedia':p.st<=0?'Habis':p.st<=3?'Stok tinggal '+p.st:'Tersedia'}
function tokoStrip(){const a=tokoList();if(!a.length)return '';return `<div class="row" style="margin:16px 0 8px"><b style="font-size:16px">Produk Kami</b><a class="lnk2" onclick="nv('toko')">Lihat semua ›</a></div><div class="sjrow">${a.map(p=>`<button class="sjm" onclick="nv('toko')">${pImg(p)}<b>${esc(p.n)}</b><span class="sjp">${rp(p.h)}</span></button>`).join('')}</div>`}
let tkQ='',tkSort='def',_dk=null;
const IC_SR='<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',IC_CT='<svg viewBox="0 0 24 24"><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>';
function tkFilter(){let a=tokoList();const q=tkQ.trim().toLowerCase();if(q)a=a.filter(p=>String(p.n).toLowerCase().includes(q));if(tkSort==='ready')a=a.filter(p=>cMax(p)>0);else if(tkSort==='lo')a=a.slice().sort((x,y)=>x.h-y.h);else if(tkSort==='hi')a=a.slice().sort((x,y)=>y.h-x.h);return a}
function shpPic(p){return p.img?`<img src="${esc(p.img)}" alt="${esc(p.n)}" loading="lazy">`:esc(String(p.n)[0].toUpperCase())}
function shpCtl(p,big){const q=cart[p.k]||0,mx=cMax(p);if(q)return `<span class="shpstp"><button onclick="cAdd('${p.k}',-1)" aria-label="Kurangi">−</button><b>${q}</b><button onclick="cAdd('${p.k}',1)" aria-label="Tambah">+</button></span>`;if(mx<=0)return big?'<button class="b g" disabled style="width:100%;margin:0">Habis</button>':'';return big?`<button class="b" style="width:100%;margin:0" onclick="cAdd('${p.k}',1)">+ Tambah ke keranjang</button>`:`<button class="shpadd" onclick="cAdd('${p.k}',1)" aria-label="Tambah ${esc(p.n)}">+</button>`}
function tkCards(){const a=tkFilter();if(!a.length)return `<div class="card mut" style="grid-column:1/-1;text-align:center;padding:28px 12px">${tokoList().length?'Produk tidak ditemukan.':'Belum ada produk.'}</div>`;
  return a.map(p=>{const mx=cMax(p),low=p.st!=null&&p.st>0&&p.st<=3;return `<div class="shpc"><div class="shpimg" style="--h:${hueOf(p.n)}" onclick="tkDet('${p.k}')">${shpPic(p)}${mx<=0?'<i class="shpov">Habis</i>':''}${low?`<i class="shpbd">Sisa ${p.st}</i>`:''}</div><div class="shpb"><div class="shpnm" onclick="tkDet('${p.k}')">${esc(p.n)}</div><div class="shpprc">${rp(p.h)}</div><div class="shpft"><span class="shpst">${mx<=0?'Stok habis':stokTxt(p)}</span>${shpCtl(p)}</div></div></div>`}).join('')}
function tkChips(){return [['def','Semua'],['lo','Termurah'],['hi','Termahal'],['ready','Tersedia']].map(([k,l])=>`<button class="${tkSort===k?'on':''}" onclick="tkSet('${k}')">${l}</button>`).join('')}
function tkSet(k){tkSort=k;const e=$('#tkch');if(e)e.innerHTML=tkChips();tkRef()}
function tkCari(v){tkQ=v;tkRef()}
function tkKer(){if(!cTot().n){toast('Keranjang masih kosong');return}cOpen()}
function closeDet(){const e=document.getElementById('tkd');if(e)e.remove();_dk=null}
function tkDetBody(k){const p=SV[k];if(!p)return '';const mx=cMax(p);return `<div class="row" style="margin:2px 0 8px"><span></span><button class="bk" onclick="closeDet()" aria-label="Tutup">×</button></div><div class="shpbig" style="--h:${hueOf(p.n)}">${shpPic(p)}</div><div class="shpprc" style="font-size:24px;margin:12px 0 2px">${rp(p.h)}</div><b style="font-size:17px">${esc(p.n)}</b><p class="mut" style="margin:6px 0 14px">${mx<=0?'Stok habis':stokTxt(p)}${p.u?' · per '+esc(p.u):''}</p>${shpCtl(p,1)}<p class="mut" style="font-size:12px;margin:12px 0 0">Pesanan dikonfirmasi lewat WhatsApp sebelum diproses.</p>`}
function tkDet(k){if(!SV[k])return;closeDet();_dk=k;$('#app').insertAdjacentHTML('beforeend',`<div class="ov hi mr" id="tkd" onclick="if(event.target===this)closeDet()"><div class="bs" style="max-height:92vh;overflow:auto"><div class="grip"></div><div id="tkdb">${tkDetBody(k)}</div></div></div>`)}
function cBar(){const x=cTot();return x.n?`<div class="cbar" onclick="cOpen()"><span><b>${x.n} item</b> · ${rp(x.t)}</span><span class="b" style="margin:0;padding:8px 14px">Lihat keranjang</span></div>`:''}
function dToko(){setTimeout(psnCek,80);const tt=(S.tes||[]).filter(x=>x.on!==0),av=tt.length?tt.reduce((s,x)=>s+(+x.b||0),0)/tt.length:0,jam=(S.pm||{}).jam,n=cTot().n;
  return `<div class="pg shpw"><div class="shpbar"><label class="shpsr">${IC_SR}<input id="tkq" type="search" placeholder="Cari produk…" value="${esc(tkQ)}" oninput="tkCari(this.value)" autocomplete="off"></label><button class="shpcart" onclick="tkKer()" aria-label="Keranjang">${IC_CT}<b id="shpn"${n?'':' style="display:none"'}>${n}</b></button></div>${ban()}<div id="psnb"></div>
  <div class="shph">${S.logo?`<img src="${esc(S.logo)}" alt="">`:`<span class="shpl">${esc(String(S.nama||'K')[0])}</span>`}<div style="min-width:0"><b>${esc(S.nama)}</b><div class="mut" style="font-size:12.5px">${tt.length?`<span style="color:#f5b301">★</span> ${av.toFixed(1)} · ${tt.length} ulasan`:'Toko laundry'}${jam?' · '+esc(jam):''}</div></div></div>
  <div class="shpch" id="tkch">${tkChips()}</div><div class="shpgrid" id="tk">${tkCards()}</div><div style="height:96px"></div></div><div id="cbw">${cBar()}</div>`}
function tkRef(){const g=$('#tk');if(g)g.innerHTML=tkCards();const b=$('#cbw');if(b)b.innerHTML=cBar();const n=$('#shpn');if(n){const c=cTot().n;n.textContent=c;n.style.display=c?'':'none'}const d=$('#tkdb');if(d&&_dk)d.innerHTML=tkDetBody(_dk);const s=$('#csb');if(s){if(!cTot().n){cClose();return}s.innerHTML=cSheet()}}
function cAdd(k,d){const p=SV[k];if(!p)return;const cur=cart[k]||0,n=Math.max(0,Math.min(cMax(p),cur+d));if(d>0&&n===cur){toast('Stok '+p.n+' tinggal '+cMax(p));return}n?cart[k]=n:delete cart[k];cSave();tkRef()}
function cClear(){cart={};cSave();tkRef();cClose()}
function cClose(){const e=document.getElementById('cs');if(e)e.remove()}
function cMsg(){const L=cItems(),x=cTot(),n=(cmeta.nm||'').trim(),w=(cmeta.wa||'').trim();return ['Halo '+S.nama+', saya ingin memesan produk:',...L.map(i=>'• '+i.p.n+' x'+i.q+' = '+rp(i.q*i.p.h)),'Total: '+rp(x.t),'Nama: '+n,w?'WA: '+w:'',cmeta.mode==='antar'?'Antar ke: '+((cmeta.al||'').trim()||'(alamat belum diisi)'):'Ambil di toko',cmeta.paid?'Sudah bayar via QRIS (ref '+cmeta.ref+'), bukti saya kirim.':'',  '',  '#TOKO '+L.map(i=>i.p.k+':'+i.q).join(',')].filter((s,i,a)=>s!==''||a[i-1]!=='').join('\n')}
function cLink(){const a=$('#cwa');if(a){const cs=(S.pm||{}).cs;a.href=cs?'https://wa.me/'+nomor(cs)+'?text='+encodeURIComponent(cMsg()):'#'}}
function cOk(e){if(!(cmeta.nm||'').trim()){e.preventDefault();toast('Isi nama Anda dulu');return}if(cmeta.mode==='antar'&&!(cmeta.al||'').trim()){e.preventDefault();toast('Isi alamat pengantaran');return}cLink()}
function cSet(k,v){cmeta[k]=v;cSave();if(k==='mode'){const s=$('#csb');if(s)s.innerHTML=cSheet()}else cLink()}
function cSheet(){const L=cItems(),x=cTot(),cs=(S.pm||{}).cs,qr=!!S.qris&&typeof qrcode==='function'&&!!qrisAmt(S.qris,Math.max(1,x.t));if(!cmeta.ref)cmeta.ref='TK'+Math.floor(1000+Math.random()*9000);
  return `<div class="row" style="margin:6px 0 8px"><b style="font-size:18px">Keranjang</b><button class="bk" onclick="cClose()" aria-label="Tutup">×</button></div>
  ${L.map(i=>`<div class="row" style="padding:8px 0;border-top:1px solid var(--bd)"><div style="min-width:0;display:flex;gap:10px;align-items:center">${i.p.img?`<img class="pthm sm44" src="${esc(i.p.img)}" alt="">`:''}<div style="min-width:0"><b>${esc(i.p.n)}</b><div class="mut">${rp(i.p.h)} × ${i.q}</div></div></div><div style="display:flex;align-items:center;gap:10px"><b>${rp(i.q*i.p.h)}</b><span class="sjs" style="margin:0"><button onclick="cAdd('${i.p.k}',-1)" aria-label="Kurangi">−</button><b>${i.q}</b><button onclick="cAdd('${i.p.k}',1)" aria-label="Tambah">+</button></span></div></div>`).join('')}
  <div class="row" style="padding:10px 0;border-top:1px solid var(--bd)"><b>Total</b><b style="color:var(--pri);font-size:20px">${rp(x.t)}</b></div>
  <label>Nama Anda *</label><input value="${esc(cmeta.nm)}" oninput="cSet('nm',this.value)" placeholder="Nama"><label>No. WhatsApp (opsional)</label><input inputmode="tel" value="${esc(cmeta.wa)}" oninput="cSet('wa',this.value)" placeholder="08123456789">
  <div class="mt" style="margin:12px 0 0"><button class="${cmeta.mode==='ambil'?'on':''}" onclick="cSet('mode','ambil')">Ambil di toko</button><button class="${cmeta.mode==='antar'?'on':''}" onclick="cSet('mode','antar')">Antar</button></div>${cmeta.mode==='antar'?`<label>Alamat pengantaran</label><textarea oninput="cSet('al',this.value)" placeholder="Alamat lengkap">${esc(cmeta.al)}</textarea>`:''}
  <button class="b" id="cks" style="display:block;width:100%;margin:16px 0 0;padding:14px" onclick="cKirim()">Kirim Pesanan</button>
  ${cs?`<a class="b g" id="cwa" style="display:block;text-align:center;text-decoration:none;margin:8px 0 0;padding:12px" target="_blank" rel="noopener" href="#" onclick="cOk(event)">Atau pesan lewat WhatsApp</a>`:''}
  ${qr?`<button class="b g" style="width:100%;margin:8px 0 0" onclick="cQr()">Bayar pakai QRIS</button>`:''}<button class="lnk2" style="display:block;margin:12px auto 0;background:none;border:0;font:inherit;color:var(--mut)" onclick="cClear()">Kosongkan keranjang</button>
  <p class="mut" style="font-size:12px;margin:10px 0 0">Pesanan dikirim langsung ke toko dan diproses setelah dikonfirmasi. Harga dan stok mengikuti data toko.</p>`}

/* ===== Pesanan online otomatis (tanpa WhatsApp) ===== */
let cBusy=false;
function psnList(){try{return JSON.parse(localStorage.getItem('kl_psn')||'[]')}catch(e){return[]}}
function psnAdd(k){try{const a=psnList().filter(x=>x.k!==k);a.unshift({k,t:Date.now()});localStorage.setItem('kl_psn',JSON.stringify(a.slice(0,3)))}catch(e){}}
function psnDel(k){try{localStorage.setItem('kl_psn',JSON.stringify(psnList().filter(x=>x.k!==k)))}catch(e){}const e=$('#psnb');if(e)e.innerHTML=''}
async function psnCek(){const e=$('#psnb');if(!e)return;const L=psnList().filter(x=>Date.now()-x.t<3*864e5);if(!L.length){e.innerHTML='';return}
  let h='';for(const x of L.slice(0,1)){let r=null;try{r=await sbRpc('kl_pesan_status',{p_kode:x.k})}catch(er){}if(!r||r.status==='tidak_ada'){continue}
    const s=r.status;h+=`<div class="psn ${s}"><div class="psi">${s==='diterima'?'✅':s==='ditolak'?'❌':'🕒'}</div><div style="flex:1;min-width:0"><b>Pesanan ${esc(x.k)}</b><div class="mut" style="font-size:12.5px">${s==='baru'?'Menunggu konfirmasi toko…':s==='diterima'?'Diterima toko'+(r.lacak?' · Kode lacak <b>'+esc(r.lacak)+'</b>':''):'Maaf, pesanan tidak bisa diproses'+(r.alasan?': '+esc(r.alasan):'')}</div></div>${s==='diterima'&&r.lacak?`<button class="b" style="margin:0;padding:8px 12px" onclick="lm='k';nv('lacak');setTimeout(()=>{const i=$('#ck');if(i){i.value='${esc(r.lacak)}';cari()}},60)">Lacak</button>`:''}${s!=='baru'?`<button class="bk" onclick="psnDel('${esc(x.k)}')" aria-label="Tutup">×</button>`:''}</div>`}
  e.innerHTML=h}
function cDone(kd,tot){const s=$('#csb');if(s)s.innerHTML=`<div style="text-align:center;padding:10px 0 4px"><div class="okc">✓</div><h2 style="margin:14px 0 4px">Pesanan terkirim!</h2><p class="mut" style="margin:0 0 12px">Toko akan mengonfirmasi pesanan Anda. Status bisa dilihat di halaman Toko.</p><div class="psk">${esc(kd)}</div><p class="mut" style="font-size:12.5px;margin:6px 0 14px">Simpan kode pesanan ini · Total ${rp(tot)}</p><button class="b" style="width:100%;margin:0" onclick="cClose();nv('toko')">Selesai</button></div>`}
async function cKirim(){const L=cItems();if(!L.length)return;if(!(cmeta.nm||'').trim()){toast('Isi nama Anda dulu');return}if(cmeta.mode==='antar'&&!(cmeta.al||'').trim()){toast('Isi alamat pengantaran');return}
  const w=(cmeta.wa||'').trim();if(w&&!validWa(w)){toast('Nomor WA tidak valid (contoh 08123456789)');return}if(cBusy)return;cBusy=true;const bt=$('#cks');if(bt){bt.disabled=true;bt.textContent='Mengirim…'}
  try{const r=await sbRpc('kl_pesan_kirim',{p_nama:cmeta.nm.trim(),p_wa:w,p_mode:cmeta.mode,p_al:cmeta.mode==='antar'?cmeta.al.trim():'',p_items:L.map(i=>({k:i.p.k,q:i.q})),p_ref:cmeta.ref||'',p_bayar:cmeta.paid?'qris':'nanti'});
    if(!r||!r.kode)throw new Error('GAGAL');psnAdd(r.kode);cart={};cmeta.paid=0;cmeta.ref='';cSave();tkRef();cDone(r.kode,r.total)}
  catch(e){const m=String((e&&e.message)||'');if(bt){bt.disabled=false;bt.textContent='Kirim Pesanan'}
    toast(/TERLALU_(SERING|BANYAK)/.test(m)?'Terlalu banyak pesanan, coba lagi nanti':/STOK_KURANG/.test(m)?'Stok '+(m.split('STOK_KURANG:')[1]||'produk').trim()+' tidak cukup. Kurangi jumlahnya.':/PRODUK_TIDAK_ADA|TOKO_KOSONG/.test(m)?'Ada produk yang sudah tidak tersedia. Muat ulang halaman.':/ALAMAT/.test(m)?'Isi alamat pengantaran':/JARINGAN|WAKTU_HABIS/.test(m)?'Koneksi bermasalah, coba lagi':'Gagal mengirim pesanan, coba lagi')}
  finally{cBusy=false}}

/* ===== Pesanan online: sisi kasir ===== */
let PO=[],_poSeen=null,_poBusy=false;const _poTitle=document.title;
function bunyi(){try{const c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.value=880;g.gain.setValueAtTime(.15,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.5);o.start();o.stop(c.currentTime+.5)}catch(e){}try{navigator.vibrate&&navigator.vibrate([120,60,120])}catch(e){}}
function poInner(){const L=PO.filter(x=>x.status==='baru');if(!L.length)return '';
  return `<div class="card po"><h2>🛒 Pesanan online (${L.length})</h2>${L.map(p=>`<div class="pop"><div class="row" style="gap:8px"><b>${esc(p.nama)}</b><b>${rp(p.total)}</b></div><div style="font-size:13.5px;margin:2px 0">${p.items.map(x=>esc(x.n)+' ×'+x.q).join(', ')}</div><div class="mut" style="font-size:12.5px">${p.mode==='antar'?'🛵 Antar: '+esc(p.alamat||'-'):'🏪 Ambil di toko'}${p.wa?' · '+esc(p.wa):''}${p.bayar==='qris'?' · QRIS ref '+esc(p.ref||'-'):' · Bayar nanti'} · ${fx(p.d)}</div><div class="qa"><button class="b" style="margin:8px 8px 0 0" onclick="poTerima(${p.id})">Terima</button><button class="b g" style="margin:8px 0 0" onclick="poTolak(${p.id})">Tolak</button></div></div>`).join('')}</div>`}
function stokCard(){const L=(S.prd||[]).filter(p=>p.on!==0&&p.st!=null&&p.st<=3);if(!L.length)return '';return `<div class="card full stk"><h2>📦 Stok produk menipis</h2>${L.map(p=>`<div class="row"><span>${esc(p.n)}</span><b style="color:${p.st<=0?'var(--bad)':'#f97316'}">${p.st<=0?'Habis':'Sisa '+p.st}</b></div>`).join('')}<button class="b g" style="margin:10px 0 0" onclick="nvA('set')">Atur stok</button></div>`}
function poCard(){return `<div id="pow" class="full">${poInner()}</div>`}
function poRef(){const e=$('#pow');if(e)e.innerHTML=poInner();const n=PO.filter(x=>x.status==='baru').length;document.title=(n?'('+n+') ':'')+_poTitle}
async function poMuat(){if(_poBusy||!adm||SB_ROLE!=='staf')return;_poBusy=true;
  try{const r=await sbRpc('kl_pesan_daftar',{},true);PO=Array.isArray(r)?r:[]}catch(e){_poBusy=false;return}
  const nb=PO.filter(x=>x.status==='baru');
  if(_poSeen===null){_poSeen=new Set(nb.map(x=>x.id));if(nb.length)toast('🛒 '+nb.length+' pesanan online menunggu')}
  else{const f=nb.filter(x=>!_poSeen.has(x.id));nb.forEach(x=>_poSeen.add(x.id));if(f.length){bunyi();toast('🛒 Pesanan online baru: '+f[0].nama+' ('+rp(f[0].total)+')')}}
  poRef();_poBusy=false;
  if(S.autoPes){for(const p of nb.slice()){if(await poTerima(p.id,true)==='gagal')break}}}
async function tungguSimpan(){for(let i=0;i<50&&_sv;i++)await new Promise(r=>setTimeout(r,200))}
async function poTerima(id,auto){const p=PO.find(x=>x.id===id);if(!p||p.status!=='baru')return;
  const it=[];for(const x of p.items){const pr=SV[x.k];if(!pr||!pr.p){if(!auto)toast('Produk "'+x.n+'" sudah tidak ada di daftar');return}it.push({sv:x.k,qty:+x.q,hs:+x.h,c:'',jp:0,s:1})}
  const se=stokCek(it,[]);if(se){if(!auto)toast(se+'. Tolak pesanan atau tambah stok dulu.');return}
  await tungguSimpan();if(_sv){if(!auto)toast('Masih menyimpan data lain. Coba lagi sebentar.');return}
  let ok=false;try{ok=await sbRpc('kl_pesan_klaim',{p_id:id},true)}catch(e){if(!auto)toast('Gagal menghubungi server');return}
  if(!ok){if(!auto)toast('Pesanan ini sudah diproses di perangkat lain');poMuat();return}
  const ada=S.orders.find(x=>x.online===p.kode);
  if(ada){try{await sbRpc('kl_pesan_atur',{p_id:id,p_aksi:'terima',p_lacak:tkc(ada),p_alasan:''},true)}catch(e){}p.status='diterima';poRef();return true}
  const seq0=S.seq,cu0=(S.cu||[]).length;
  const now=Date.now(),wa=p.wa&&validWa(p.wa)?p.wa:umumWa(),f=it[0],cat='Online '+p.kode+(p.bayar==='qris'?' · klaim bayar QRIS ref '+(p.ref||'-')+' (cek mutasi)':' · bayar nanti');
  const o={vc:0,id:++S.seq,no:newNo(now),lk:rkode(),jb:0,jem:0,ant:p.mode==='antar'?1:0,alm:p.mode==='antar'?(p.alamat||''):'',jj:0,ja:0,nama:p.nama,wa,it,sv:f.sv,qty:f.qty,hs:f.hs,total:+p.total,pj:'',disk:0,dn:'',cat,masuk:now,est:now,st:2,bayar:'Belum',dp:0,met:'Tunai',pay:[],log:[{t:now,s:0},{t:now,s:2,by:'Online'}],jual:1,online:p.kode};
  stokGeser(it,-1);aud('Pesanan online',o,rp(o.total));
  if(!(S.cu||[]).some(x=>nw(x.wa)===nw(wa)))(S.cu=S.cu||[]).push({nama:p.nama,wa,alamat:p.mode==='antar'?(p.alamat||''):'',cat:'',blok:0,t:now,kd:nextKd()});
  S.orders.push(o);newOid=o.id;
  const okSimpan=await save();
  if(!okSimpan){
    S.orders=S.orders.filter(x=>x.id!==o.id);stokGeser(it,1);S.seq=seq0;if(S.cu)S.cu.length=Math.min(S.cu.length,cu0);
    p.status='baru';try{await sbRpc('kl_pesan_atur',{p_id:id,p_aksi:'lepas',p_lacak:'',p_alasan:''},true)}catch(e){}
    if(!auto)toast('Pesanan belum bisa disimpan. Dikembalikan ke antrean, coba lagi.');poRef();if(tab==='home'||tab==='pend')draw();return 'gagal'}
  p.status='diterima';
  try{await sbRpc('kl_pesan_atur',{p_id:id,p_aksi:'terima',p_lacak:tkc(o),p_alasan:''},true)}catch(e){}
  toast('Pesanan online diterima: '+nn(o));poRef();if(tab==='home'||tab==='pend')draw();return true}
function poTolak(id){const p=PO.find(x=>x.id===id);if(!p)return;ask('Tolak pesanan dari '+p.nama+'? Pelanggan akan melihat pesanannya tidak bisa diproses.',async()=>{try{await sbRpc('kl_pesan_atur',{p_id:id,p_aksi:'tolak',p_lacak:'',p_alasan:'Stok habis / tidak dapat diproses'},true);p.status='ditolak';poRef();toast('Pesanan ditolak')}catch(e){toast('Gagal menolak pesanan')}},'Tolak')}
setInterval(()=>{if(!document.hidden)poMuat()},30000);setTimeout(poMuat,3500);document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(poMuat,300)});
function cOpen(){cClose();$('#app').insertAdjacentHTML('beforeend',`<div class="ov hi mr" id="cs" onclick="if(event.target===this)cClose()"><div class="bs" style="max-height:92vh;overflow:auto"><div class="grip"></div><div id="csb">${cSheet()}</div></div></div>`);cLink()}
function cQr(){const x=cTot(),p=qrisAmt(S.qris,x.t,cmeta.ref);if(!p){toast('QRIS belum tersedia');return}cmeta.paid=1;cSave();cLink();$('#app').insertAdjacentHTML('beforeend',`<div class="ov hi" id="cq"><div class="md" style="text-align:center"><h2>Bayar via QRIS</h2><div style="margin:8px auto">${qrSvg(p,230)}</div><p style="font-size:20px;font-weight:700;margin:6px 0">${rp(x.t)}</p><p class="mut" style="margin:0 0 12px">Setelah membayar, tekan Pesan lewat WhatsApp dan kirim bukti pembayaran. Kode referensi: ${esc(cmeta.ref)}</p><button class="b" style="width:100%" onclick="document.getElementById('cq').remove()">Sudah, kembali</button></div></div>`)}
function closeTk(){const e=document.getElementById('tkp');if(e)e.remove()}
function tkTempel(){closeTk();$('#app').insertAdjacentHTML('beforeend',`<div class="ov hi mr" id="tkp" onclick="if(event.target===this)closeTk()"><div class="bs"><div class="grip"></div><div class="row" style="margin:6px 0 8px"><b style="font-size:18px">Tempel pesanan dari WA</b><button class="bk" onclick="closeTk()" aria-label="Tutup">×</button></div><p class="mut" style="margin:0 0 8px">Tempel pesan pelanggan dari halaman Toko. Barang, nama, dan nomor WA terisi otomatis.</p><textarea id="tkt" style="min-height:140px" placeholder="Halo ... saya ingin memesan produk: ... #TOKO ..."></textarea><button class="b" style="width:100%;margin:12px 0 0" onclick="tkParse()">Isi dari pesan</button></div></div>`)}
function tkParse(){const tx=($('#tkt')||{}).value||'',m=tx.match(/#TOKO\s+([A-Za-z0-9_:,]+)/);if(!m){toast('Kode #TOKO tidak ditemukan di pesan');return}
  const add=[];m[1].split(',').forEach(s=>{const a=s.split(':'),p=SV[a[0]],n=+a[1];if(p&&p.p&&n>0)add.push({sv:a[0],qty:n,hs:p.h,c:'',jp:0})});if(!add.length){toast('Produk tidak dikenali');return}
  const se=stokCek(add.concat(ln),[]);if(se){toast(se);return}
  add.forEach(x=>{const e=ln.find(y=>y.sv===x.sv&&!y.c);e?e.qty=+e.qty+x.qty:ln.push(x)});
  const nm=(tx.match(/Nama:\s*(.+)/i)||[])[1],wa=(tx.match(/WA:\s*([\d+\-\s]{8,})/i)||[])[1];if(nm&&$('#fn')&&!$('#fn').value)$('#fn').value=nm.trim();if(wa&&$('#fw')&&!$('#fw').value&&validWa(wa.replace(/[^\d+]/g,'')))$('#fw').value=wa.replace(/[^\d+]/g,'');
  closeTk();closePk();estAuto();drawLines();hitung();toast('Pesanan pelanggan ditempel')}
function homeCari(){const v=(($('#hk')||{}).value||'').trim();if(!v){toast('Isi kode lacak dulu');return}lm='k';nv('lacak');const e=$('#ck');if(e){e.value=v;cari()}}
function dHome(){
  const m=(S.nama.match(/[A-Za-z0-9]/)||['L'])[0].toUpperCase(),u=csUrl();
  return `<div class="pg home"><div class="chd"><div class="top">${S.logo?`<img class="lg" src="${esc(S.logo)}" alt="">`:`<div class="mono">${esc(m)}</div>`}<div><small>Selamat datang di</small><b>${esc(S.nama)}</b></div>${loginBtn()}</div><div class="srch"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="hk" maxlength="8" autocapitalize="characters" placeholder="Masukkan kode lacak cucian" onkeydown="if(event.key==='Enter')homeCari()"><button onclick="homeCari()">Lacak</button></div></div>
  ${ban()}${opsBadge()}${carousel('car')}
  <div class="gp">${gi('#2f7de1','lacak','Lacak',"nv('lacak')")}${gi('#1e9e5a','harga','Harga',"nv('harga')")}${tokoList().length?gi('#f08a24','toko','Toko',"nv('toko')"):''}${u?gi('#0e9aa7','cs','Hubungi CS',u):''}${gi('#7c5cd6','pin','Lokasi',"nv('info')")}${gi('#d6548e','share','Ajak Teman',shareUrl())}${revUrl()?gi('#d99a00','star','Ulasan',revUrl()):gi('#d99a00','star','Ulasan',"nv('tes')")}${gi('#5b6b82','akun','Akun',"nv('akun')")}</div>
  ${tokoStrip()}
  ${tesSec()}${foot()}</div>`}
function durTxt(j){return j>=24?'±'+Math.round(j/24)+' hari':j>0?'±'+j+' jam':''}
function dHarga(){const a=S.svc.filter(s=>s.on);
  return `<div class="pg">${ban()}<h1>Daftar Harga</h1><p class="mut">Estimasi pengerjaan tertera di tiap layanan</p>
  <div class="card">${a.map(s=>`<div class="pr"><div><b>${esc(s.n)}</b><div class="mut">${durTxt(s.j)}</div></div><b style="color:var(--pri)">${s.h?`${rp(s.h)}<span class="mut" style="font-weight:400"> /${esc(s.u)}</span>`:'<span class="mut" style="font-weight:400">Sesuai ukuran/tebal</span>'}</b></div>`).join('')}</div>
  <div class="card"><h2>Kalkulator estimasi</h2><label>Layanan</label><select id="ks" onchange="hitK()">${a.map(s=>`<option value="${s.k}">${esc(s.n)}</option>`).join('')}</select><label>Jumlah (sesuai satuan)</label><input id="kq" type="text" inputmode="decimal" autocomplete="off" oninput="hitK()"><p id="kr" style="margin:12px 0 0"></p></div>
  <p class="mut" style="text-align:center">Poin member: 1 poin tiap Rp10.000. 50 poin = diskon Rp25.000.</p></div>`}
function dInfo(){const p=S.pm||{},u=csUrl(),r=(l,v)=>v?`<div class="pr"><span class="mut">${l}</span><span style="text-align:right">${esc(v)}</span></div>`:'';
  return `<div class="pg">${ban()}<h1>Info ${esc(S.nama)}</h1><div class="card">${r('Pemilik',p.nama)}${r('Alamat',p.alamat)}${r('Jam buka',p.jam)}${r('Instagram',p.ig)}${!(p.nama||p.alamat||p.jam||p.ig)?'<p class="mut">Informasi belum diisi.</p>':''}</div>${faqH()}
  ${p.alamat?`<a class="b g" style="display:block;text-align:center;margin:0 0 10px" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.alamat)}">Lihat di Maps</a>`:''}
  ${u?`<a class="b" style="display:block;text-align:center;margin:0" target="_blank" rel="noopener" href="${u}">Hubungi CS via WhatsApp</a>`:''}
  <div class="card"><h2>Tampilan</h2>${themeChips()}</div>
  </div>`}
function dLacak(){const e=(lcMsg?`<p class="mut" style="margin:10px 0 0;text-align:center">${esc(lcMsg)}</p>`:'')+(found==='x'?`<p style="color:var(--bad);margin:10px 0 0;text-align:center">Data tidak ditemukan. Periksa kembali ${lm==='k'?'kode tracking':'nomor nota dan 4 digit WA'}.</p>`:'');
  return `<div class="pg trk"><div class="trh">${S.logo?`<img src="${esc(S.logo)}" alt="">`:''}<b>${esc(S.nama)}</b></div><div class="tcd" style="border-top-color:var(--pri)"><h1 style="text-align:center;margin:0 0 4px">Lacak Cucian</h1><p class="mut" style="text-align:center;margin:0 0 14px">Pantau proses cucian Anda kapan saja</p>
  <div class="seg" style="margin:0 auto 12px"><button class="${lm==='k'?'on':''}" onclick="lm='k';draw()">Kode Tracking</button><button class="${lm==='n'?'on':''}" onclick="lm='n';draw()">No. Nota</button></div>
  ${lm==='k'?`<label>Kode tracking</label><input id="ck" maxlength="8" value="${esc(lcPre)}" autocapitalize="characters" placeholder="mis. Z6X4TF8K" style="text-transform:uppercase;letter-spacing:4px;text-align:center;font-size:20px" onkeydown="ent(event)">`:`<label>Nomor nota</label><input id="ck" autocapitalize="characters" placeholder="ORD-20261008-0001" onkeydown="ent(event)"><label>4 digit terakhir no. WA</label><input id="cw" inputmode="numeric" maxlength="4" onkeydown="ent(event)">`}
  <button class="b" style="width:100%;margin:14px 0 0;padding:14px" onclick="cari()">Lacak Sekarang</button>${e}<p class="mut" style="text-align:center;margin:12px 0 0">Kode tracking ada di struk dan pesan WA dari kami.</p></div></div>`}
function dCust(){
  Object.values(iv).forEach(clearInterval);
  if(cscr==='lacak'&&!found&&!lcMsg&&!lcPre)restoreFound();
  const ok=found&&found!=='x';
  if(cscr==='lacak'&&ok)dProses(found);
  else $('#app').innerHTML=cscr==='harga'?dHarga():cscr==='toko'?dToko():cscr==='info'?dInfo():cscr==='akun'?dAkun():cscr==='tes'?dTes():cscr==='lacak'?dLacak():dHome();
  $('#app').insertAdjacentHTML('beforeend',navBar()+((cscr==='lacak'||cscr==='harga')?csBtn(cscr==='lacak'&&ok?found:null):''));
  if(cscr==='home'){carInit('car');if(S.pop&&S.pop.on&&S.pop.img&&!sg('pp'))$('#app').insertAdjacentHTML('beforeend',popHtml())}if(cscr==='harga')hitK()}
function logoH(){return S.logo?`<img class="lg" src="${esc(S.logo)}" alt="">`:ico(0)}
function dPin(){$('#app').innerHTML=`<div class="pg"><div class="hero">${logoH()}<h1>Masuk</h1><p class="mut">Pelanggan: masuk dengan nomor WA dan kata sandi.</p></div><div class="card"><label>No. WhatsApp / HP</label><input id="pno" inputmode="tel" placeholder="08123456789" onkeydown="entP(event)"><label>Kata sandi</label><input id="pn" type="password" onkeydown="entP(event)"><button class="b" style="width:100%;margin:14px 0 0" onclick="cekPin()">Masuk</button><p class="mut" style="text-align:center;margin:14px 0 0">Belum punya akun? <a class="lnk2" onclick="go('reg')">Daftar sekarang</a></p></div><p class="lnk" onclick="go('cust')">Lanjut tanpa akun</p>${SB_ROLE==='staf'?'':'<p class="lnk" onclick="go(\'sbl\')">Masuk sebagai admin / karyawan</p>'}</div>`}
function entP(e){if(e.key==='Enter')cekPin()}
function validWa(w){return /^62\d{8,13}$/.test(nw(w))}
function nw(x){let n=dig(x);if(n[0]==='0')n='62'+n.slice(1);return n}
const b64=u=>btoa(String.fromCharCode(...u)),ub64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function hpw(pw,salt){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']);return b64(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},k,256)))}
async function mkPw(pw){const s=crypto.getRandomValues(new Uint8Array(16));return {s:b64(s),h:await hpw(pw,s)}}
async function vfPw(a,pw){return (await hpw(pw,ub64(a.s)))===a.h}
function curAcc(){return SB_ROLE==='staf'?null:(S._me||null)}
function loginBtn(){const a=curAcc();return a?`<button class="lgb" onclick="nv('akun')">${svg('usr')}${esc(a.n.split(' ')[0])}</button>`:''}
function dReg(){$('#app').innerHTML=`<div class="pg"><div class="hero">${logoH()}<h1>Daftar Akun</h1><p class="mut">Buat akun dengan nomor WhatsApp Anda</p></div><div class="card" id="regc"><label>Nama</label><input id="rn"><label>No. WhatsApp</label><input id="rw" inputmode="tel" placeholder="08123456789"><label>Kata sandi (min. 6 karakter)</label><input id="rp1" type="password"><label>Ulangi kata sandi</label><input id="rp2" type="password"><button class="b" style="width:100%;margin:14px 0 0" onclick="regGo()">Daftar</button><p class="mut" style="text-align:center;margin:14px 0 0">Sudah punya akun? <a class="lnk2" onclick="go('pin')">Masuk</a></p></div><p class="lnk" onclick="go('cust')">Kembali</p></div>`}
async function regGo(){const n=$('#rn').value.trim(),w=nw($('#rw').value),p1=$('#rp1').value,p2=$('#rp2').value;
  if(!n||w.length<9){toast('Isi nama dan nomor WhatsApp');return}if(p1.length<6){toast('Kata sandi minimal 6 karakter');return}if(p1!==p2){toast('Kata sandi tidak sama');return}
  toast('Membuat kode pengaman...');const x=await mkPw(p1),code=b64u(JSON.stringify({n,w,s:x.s,h:x.h})),cs=(S.pm||{}).cs;
  const msg='Halo '+S.nama+', saya ingin mendaftar akun.\nNama: '+n+'\nNo. WA: '+w+'\nKode pendaftaran:\n'+code;
  $('#regc').innerHTML=`<h2>Pendaftaran siap dikirim</h2><p>Kirim kode ini ke admin lewat WhatsApp. Akun aktif setelah admin memverifikasi dan menyimpannya. Kata sandi Anda <b>tidak</b> ikut terkirim, hanya kode pengaman.</p>${cs?`<a class="b" style="display:block;text-align:center;margin:12px 0 0" target="_blank" rel="noopener" href="https://wa.me/${nomor(cs)}?text=${encodeURIComponent(msg)}">Kirim ke Admin via WA</a>`:'<p style="color:var(--bad)">Nomor CS belum diatur. Hubungi admin langsung.</p>'}<textarea readonly style="margin-top:12px;min-height:80px">${esc(code)}</textarea><button class="b g" style="width:100%;margin:8px 0 0" onclick="go('pin')">Ke halaman masuk</button>`}
function me(){return SB_ROLE==='staf'&&SB_PERAN!=='owner'?(SB_NAMA||SB_EM||'Kasir'):''}
function owner(){return SB_PERAN==='owner'}

function adv(id){const o=S.orders.find(x=>x.id==id);if(o.st<3){o.st++;if(o.st>=2&&o.it)o.it.forEach(x=>x.s=1);(o.log=o.log||[{t:o.masuk,s:0}]).push({t:Date.now(),s:o.st,by:me()||'Admin'});aud('Status',o,STN[o.st]);if(o.st===2){o.sel=Date.now();ss('last',id+':d');waAuto(o,'selesai')}save()}}
function dismiss(){ss('last',null);draw()}
function warna(o){const d=o.est-Date.now();return d<0?'var(--bad)':d<3*36e5?'var(--warn)':'var(--ok)'}
function card(o){const nx=o.st<3?ST[o.st+1]:'',bt=o.st===4;
  return `<div class="card oc os${o.st}"><div style="cursor:pointer" onclick="openDet(${o.id})"><div class="row"><b>${esc(nn(o))}</b>${o.jual?'<span class="chip">Penjualan</span> ':''}<span class="chip s${o.st}">${STN[o.st]}</span></div>
  <p style="margin:2px 0;font-weight:600">${esc(o.nama)}</p><div class="kdr">${kdHtml(o.wa)}</div></div>
  <p class="mut" style="margin:4px 0">${items(o).map(x=>`${esc(SV[x.sv].n)} ${x.qty} ${esc(SV[x.sv].u)}`).join(' + ')} · <b style="color:var(--tx)">${rp(o.total)}</b>${bt?'':' · '+sisa(o)}</p>
  ${bt?`<p style="margin:4px 0;color:var(--bad)">Dibatalkan${o.batal?' ('+esc(o.batal.by)+', '+fmt(o.batal.t)+')':''}: ${esc((o.batal||{}).alasan||'')}</p>`:`<p style="margin:4px 0"><span class="dot" style="background:${warna(o)}"></span>Estimasi ${fmt(o.est)}${o.jem?' <span class="chip">Jemput</span>':''}${o.ant?' <span class="chip">Antar</span>':''}${o.pj?` <span class="chip">${esc(o.pj)}</span>`:''}</p>`}
  ${!bt&&o.alm&&(o.jem||o.ant)?`<p class="mut" style="margin:2px 0">${esc(o.alm)}</p>`:''}${o.cat?`<p class="mut" style="margin:2px 0"><i>${esc(o.cat)}</i></p>`:''}
  ${bt?`<div class="oa"><button class="b g" onclick="nota(${o.id})">Lihat Nota</button></div>`:`<div class="oa">${o.st<3?`<button class="b" onclick="adv(${o.id})">→ ${nx}</button>`:''}${tagih(o)>0?`<button class="b g" onclick="payOpen(${o.id})">Bayar</button>`:''}<button class="b g" onclick="openKirim(${o.id})">Kirim WA</button><button class="b g ic" onclick="mn(${o.id})" aria-label="Lainnya">⋯</button></div>
  ${mnId===o.id?`<div class="oa"><button class="b g" onclick="nota(${o.id})">Lihat Nota</button><button class="b g" onclick="nota(${o.id},{cetak:1})">🖨 Cetak</button><button class="b g" onclick="edit(${o.id})">Edit</button>${owner()?`<button class="b g" style="color:var(--bad);border-color:var(--bad)" onclick="batalOpen(${o.id})">Batalkan</button>`:''}</div>`:''}`}</div>`}
function mn(id){mnId=mnId===id?null:id;const l=document.getElementById('lst');if(l){const wy=window.scrollY;l.innerHTML=lst();try{window.scrollTo(0,wy)}catch(e){}return}draw()}
function dAdm(){
  if(sg('ok')){okId=+sg('ok');ss('ok',null)}
  if(sg('pay')){const i=+sg('pay');ss('pay',null);const o=S.orders.find(x=>x.id===i);if(o&&tagih(o)>0)payInit(i)}
  if(!owner()&&(tab==='lap'||tab==='set'||tab==='dat'))tab='home';
  const l=sg('last');let ban='';
  if(l){const [id,t]=l.split(':'),o=S.orders.find(x=>x.id==id);
    if(o)ban=`<div class="ban"><b>${t==='d'?'Cucian selesai':'Order tersimpan'} · ${nn(o)} ${esc(o.nama)}</b><br>
    <button class="b" onclick="kirimNota(${o.id},${t==='d'})">Kirim WA</button><button class="b" onclick="dismiss()">Tutup</button></div>`}
  {const bk=bkLocal();if(bk)ban+=`<div class="ban" style="background:#b7791f"><b>Perubahan belum tersinkron</b><br>Ada data di perangkat ini (${fmt(bk.t)}) yang lebih baru dari halaman, kemungkinan penyimpanan terakhir tidak selesai.<br><button class="b" onclick="bkPulih()">Pulihkan</button><button class="b" onclick="bkBuang()">Buang</button></div>`}
  {const st=bkBasi();if(st)ban+=`<div class="ban" style="background:#8a3b3b"><b>Cadangan lokal lama</b><br>Data di server sudah berubah sejak cadangan ini dibuat (${fmt(st.t)}), jadi TIDAK dipulihkan otomatis agar data terbaru tidak tertimpa. Unduh salinannya untuk dilihat atau diketik ulang.<br><button class="b" onclick="bkUnduh()">Unduh salinan</button><button class="b" onclick="bkBuang()">Hapus</button></div>`}
  if(S.orders.length&&bkOld()&&tab==='home')ban+='<div class="ban"><b>Cadangan data</b><br>Sudah lebih dari seminggu belum diunduh.<br><button class="b" onclick="tab=\'set\';draw()">Buka Atur</button></div>';
  if(tab==='home'||tab==='pend')ban=poCard()+ban;
  let body='';
  if(tab==='home')body=dDash();
  else if(tab==='pend'||tab==='riw')body=`${seg()}<div class="fsr"><input id="qs" placeholder="Cari nama, no. nota, atau no. WA..." value="${esc(q)}" oninput="cariAdm(this.value)"><button class="b g fb" onclick="openOf()">Filter${ofN()?`<i>${ofN()}</i>`:''}</button></div><div id="lst">${lst()}</div>`;
  else if(tab==='baru'){
    body=`<div class="of"><div class="fgrid"><div class="fcol"><div class="card"><div class="sech"><span class="sic">${svg('usr')}</span><h2>Pelanggan</h2><button type="button" class="b g" style="margin:0 0 0 auto;padding:8px 14px" onclick="openPc()">Pilih Pelanggan</button></div><div class="fm">
    <div><label>Nama pelanggan</label><input id="fn" list="dl" oninput="isiWa();hitung()"><datalist id="dl">${pelList().map(c=>`<option value="${esc(c.nama)}">`).join('')}</datalist></div>
    <div><label>No. WhatsApp</label><input id="fw" inputmode="tel" placeholder="08123456789" oninput="hitung()"></div></div><div id="cnote"></div><div id="jnote"></div></div>
    <div class="card"><div class="sech"><span class="sic">${svg('baju')}</span><h2>Layanan</h2><button type="button" class="b" style="margin:0 0 0 auto;padding:8px 14px" onclick="openPk()">+ Tambah</button></div><div id="lines"></div></div>
    </div><div class="fcol"><div class="card"><div class="sech"><span class="sic">${svg('harga')}</span><h2>Diskon</h2><button type="button" class="b g" style="margin:0 0 0 auto;padding:8px 14px" onclick="openDsk()">Pilih Diskon</button></div><input id="fk" type="hidden" value="0"><div id="dsum" class="mut">Belum ada diskon</div><div id="vcb" style="display:none;margin-top:8px"></div></div>
    <div class="card"><div class="sech"><span class="sic">${svg('truk')}</span><h2>Jemput &amp; Antar</h2></div>
    <div class="trow"><div><b>Jemput</b><div class="mut">Ambil dari alamat pelanggan</div></div><button type="button" id="tjem" class="tgl" onclick="togJA('tjem')" aria-label="Jemput"></button></div>
    <div class="trow"><div><b>Antar</b><div class="mut">Antarkan ke alamat pelanggan</div></div><button type="button" id="tant" class="tgl" onclick="togJA('tant')" aria-label="Antar"></button></div>
    <div id="alb" style="display:none"><label>Alamat</label><input id="fa" placeholder="Alamat lengkap"></div>
    <div id="tjemb" style="display:none"><label>Jadwal jemput</label><input id="fjm" type="datetime-local"></div><div id="tantb" style="display:none"><label>Jadwal antar</label><input id="fan" type="datetime-local"></div></div>
    <div class="card"><div class="sech"><span class="sic">${svg('kal')}</span><h2>Detail Pesanan</h2></div><div class="fm"><div><label>Estimasi selesai</label><input id="fe" type="datetime-local" oninput="feT=true"></div><div><label>Penanggung jawab</label><select id="fp">${pjOpts()}</select></div>
    <div><label>Jumlah baju (opsional)</label><input id="fj" type="number" min="0" inputmode="numeric" placeholder="untuk pencatatan"></div><div><label>Catatan (opsional)</label><input id="fc" placeholder="mis. jangan disetrika"></div></div></div>
    <div class="rsm"><h2>Ringkasan</h2><div class="rg2"><div><small>Layanan</small><b id="rsi">0</b></div><div><small>Jumlah</small><b id="rsq">0</b></div></div><div class="rr"><span>Subtotal</span><span id="rss">Rp0</span></div><div class="rr"><span>Diskon</span><span id="rsd">Rp0</span></div><div class="rr tot"><span>Total Akhir</span><b id="rst">Rp0</b></div><span id="ft" style="display:none"></span></div>
    <button id="bbuat" class="b" style="width:100%;margin:6px 0 0;padding:16px;font-size:16px" onclick="simpan()">${ed?'Simpan Perubahan':'Buat Pesanan'}</button>${ed?'<button class="b g" style="width:100%;margin:10px 0 0" onclick="batalEd()">Batal</button>':''}</div></div></div>`}
  else if(tab==='lap')body=dLap();
  else if(tab==='dat')body=dData();
  else if(tab==='det')body=dDet();
  else if(tab==='pel')body='<div class="gr">'+dPel()+'</div>';
  else if(tab==='hut')body=dHut();
  else body=`<div class="gr two"><div class="card"><h2>Layanan &amp; Harga</h2>${S.svc.map((s,i)=>`<div style="border-top:1px solid var(--bd);padding:8px 0;opacity:${s.on?1:.5}"><input id="vn${i}" value="${esc(s.n)}" placeholder="Nama layanan"><div class="row"><div style="flex:1"><label>Harga</label><input id="vh${i}" type="number" min="0" value="${s.h}"></div><div style="flex:1"><label>Satuan</label><input id="vu${i}" value="${esc(s.u)}"></div><div style="flex:1"><label>Durasi (jam)</label><input id="vj${i}" type="number" min="1" value="${s.j}"></div></div><button class="b g" onclick="tog(${i})">${s.on?'Sembunyikan':'Aktifkan'}</button></div>`).join('')}<button class="b g" onclick="tambahSv()">+ Tambah layanan</button><p class="mut">Perubahan baru tersimpan setelah menekan Simpan di bawah. Harga lama pada order yang sudah dibuat tidak berubah. Isi harga 0 kalau harganya ditentukan saat order (mis. karpet).</p></div>
    <div class="card"><h2>Tampilan pelanggan</h2><label>Pengumuman (tampil di atas halaman pelanggan, kosongkan jika tidak ada)</label><input id="sg" value="${esc(S.info)}" placeholder="mis. Libur 17 Agustus, diskon 10% hari Jumat">
    <label>Warna tema</label><div style="display:flex;gap:10px;flex-wrap:wrap">${['#1a73c8','#1e9e5a','#8e5bd9','#e8730c','#e8505b','#0e9aa7'].map(c=>`<button aria-label="Warna ${c}" onclick="setWarna('${c}')" style="width:38px;height:38px;border-radius:50%;background:${c};cursor:pointer;border:${(S.warna||'#1a73c8')===c?'3px solid var(--tx)':'3px solid transparent'}"></button>`).join('')}</div>
    <label>Logo</label>${S.logo?`<img class="lg lgs" style="margin:0 0 8px" src="${esc(S.logo)}" alt="">`:''}<input id="sl" type="file" accept="image/*" onchange="logoUp(this)">${S.logo?'<button class="b g" onclick="hapusLogo()">Hapus logo</button>':''}
    <label>Link ulasan Google Maps (tempel link ulasan atau Place ID)</label><input id="sr" value="${esc(S.rev)}" placeholder="https://g.page/r/.../review">
    <label>Banner promosi (1-4 foto, tampil di Beranda pelanggan)</label><div class="thm">${(S.promo||[]).map((u,i)=>`<div><img src="${esc(u)}" alt=""><input id="pj${i}" placeholder="Judul promo" style="padding:6px;margin-top:6px;font-size:13px" value="${esc((S.pj||[])[i])}"><button class="b g" onclick="hapusPromo(${i})">Hapus</button></div>`).join('')}</div>${(S.promo||[]).length<4?'<input id="spm" type="file" accept="image/*" onchange="promoUp(this)">':'<p class="mut">Sudah 4 foto (maksimal).</p>'}
    <label>Pesan tiap status (kosongkan untuk teks bawaan)</label>${ST.map((s,i)=>`<input id="p${i}" style="margin-bottom:6px" placeholder="${s}" value="${esc((S.pst||[])[i])}">`).join('')}
    <p class="mut">Tekan Simpan di bagian bawah setelah selesai.</p></div>
    <div class="card"><h2>Mutasi Bank</h2><p class="mut">Tempat menyambungkan layanan mutasi (mis. Mutasiku) supaya transfer/QRIS yang masuk tercatat otomatis. Menyambung sungguhan butuh server kecil; ikuti langkah di bawah.</p>
    <label>Penyedia</label><select id="mup">${['Mutasiku','Moota','Lainnya'].map(x=>`<option ${S.mutProv===x?'selected':''}>${x}</option>`).join('')}</select>
    <label>Alamat server penerima (tanpa kunci rahasia)</label><input id="mus" placeholder="https://domainmu.com/webhook/mutasi" value="${esc(S.mutUrl||'')}">
    <div style="margin:8px 0"><span class="chip ${S.mutUrl&&(S.mutCk||[]).length>=MUT_ST.length?'s2':'s1'}">${S.mutUrl&&(S.mutCk||[]).length>=MUT_ST.length?'Siap dipakai':'Belum terhubung'}</span> <span class="mut">${(S.mutCk||[]).length}/${MUT_ST.length} langkah selesai</span></div>
    <div class="kth">LANGKAH PEMASANGAN</div>${MUT_ST.map((s,i)=>`<details style="border-top:1px solid var(--bd);padding:8px 0"><summary style="cursor:pointer;display:flex;align-items:center;gap:10px"><input type="checkbox" style="width:20px;height:20px;margin:0;flex:none" ${(S.mutCk||[]).includes(i)?'checked':''} onclick="event.stopPropagation();mutTog(${i})"><b>${i+1}. ${s[0]}</b></summary><p class="mut" style="margin:8px 0 0 30px">${s[1]}</p></details>`).join('')}
    <div class="ban" style="background:#b7791f;margin-top:10px"><b>Jangan ketik API key atau rahasia di sini.</b><br>Halaman ini bisa dibuka siapa pun yang punya tautannya. Kunci disimpan di server, bukan di sini. Penjelasan lengkap ada di berkas PANDUAN-MUTASI.md.</div></div>
    <div class="card"><h2>Produk</h2><p class="mut">Barang yang dijual di kasir, mis. plastik laundry, parfum, hanger. Stok boleh dikosongkan kalau tidak mau dihitung.</p>${(S.prd||[]).map((p,i)=>`<div style="border-top:1px solid var(--bd);padding:8px 0;opacity:${p.on===0?.5:1}"><div class="pfr">${p.img?`<img class="pthm" src="${esc(p.img)}" alt="">`:`<span class="pthm ph">Foto</span>`}<label class="b g pfb">${p.img?'Ganti foto':'Tambah foto'}<input type="file" accept="image/*" hidden onchange="prdFoto(${i},this)"></label>${p.img?`<button class="b g" style="margin:0" onclick="hapusFoto(${i})">Hapus foto</button>`:''}</div><input id="pn${i}" placeholder="Nama produk" value="${esc(p.n)}"><div class="row" style="margin-top:6px;gap:8px"><input id="ph${i}" type="number" min="0" inputmode="numeric" placeholder="Harga" style="flex:1" value="${p.h||''}"><input id="ps${i}" type="number" min="0" inputmode="numeric" placeholder="Stok (opsional)" style="flex:1" value="${p.st==null?'':p.st}"></div>${p.st!=null&&p.st<=3?`<div style="color:var(--bad);font-size:12.5px;margin-top:4px">${p.st<=0?'Stok habis':'Stok menipis'}</div>`:''}<button class="b g" onclick="togPrd(${i})">${p.on===0?'Aktifkan':'Nonaktifkan'}</button><button class="b g" style="color:var(--bad);border-color:var(--bad)" onclick="hapusPrd(${i})">Hapus</button></div>`).join('')}<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${['Plastik laundry','Parfum','Hanger'].map(n=>`<button class="b g" style="margin:0" onclick="tambahPrd('${n}')">+ ${n}</button>`).join('')}<button class="b g" style="margin:0" onclick="tambahPrd()">+ Produk lain</button></div></div>
    <div class="card"><h2>Diskon</h2><p class="mut">Daftar diskon yang bisa dipilih kasir saat membuat order.</p>${(S.dsk||[]).map((d,i)=>`<div style="border-top:1px solid var(--bd);padding:8px 0;opacity:${d.on===0?.5:1}"><input id="dn${i}" placeholder="Nama diskon" value="${esc(d.n)}"><div class="row" style="margin-top:6px;gap:8px"><select id="dt${i}" style="flex:1"><option value="p" ${d.t==='p'?'selected':''}>Persen (%)</option><option value="r" ${d.t!=='p'?'selected':''}>Rupiah (Rp)</option></select><input id="dv${i}" type="number" min="0" inputmode="numeric" placeholder="Nilai" style="flex:1" value="${d.v||''}"></div><button class="b g" onclick="togDsk(${i})">${d.on===0?'Aktifkan':'Nonaktifkan'}</button><button class="b g" style="color:var(--bad);border-color:var(--bad)" onclick="hapusDsk(${i})">Hapus</button></div>`).join('')}<button class="b g" onclick="tambahDsk()">+ Tambah diskon</button></div>
    <div class="card"><h2>Keamanan</h2><p class="mut">Data tersimpan di Supabase dan hanya terbuka lewat akun staf. Masuk sebagai <b>${esc(SB_EM||'-')}</b> (${esc(SB_PERAN||'-')}). Hanya ada satu login: akun ini. Peran (admin/karyawan) ditentukan server. Keluar mengakhiri sesi Supabase di perangkat ini.</p><button class="b g" onclick="sbKeluar()">Keluar</button></div><div class="card"><h2>Karyawan</h2><p class="mut">Daftar nama karyawan untuk penanggung jawab order. Karyawan yang perlu login memakai akun Supabase sendiri (peran kasir, dibuat di Supabase); mereka tidak bisa membuka Laporan, Atur, Pusat Data, dan tidak bisa menghapus order.</p>${(S.kar||[]).map((k,i)=>`<div style="border-top:1px solid var(--bd);padding:8px 0;opacity:${k.on===0?.5:1}"><input id="kn${i}" placeholder="Nama karyawan" value="${esc(k.n)}"><input id="kh${i}" inputmode="tel" placeholder="No. HP" style="margin-top:6px" value="${esc(k.hp)}"><input id="kj${i}" placeholder="Jabatan (opsional)" style="margin-top:6px" value="${esc(k.jab)}"><button class="b g" onclick="togKar(${i})">${k.on===0?'Aktifkan':'Nonaktifkan'}</button><button class="b g" style="color:var(--bad);border-color:var(--bad)" onclick="hapusKar(${i})">Hapus</button></div>`).join('')}<button class="b g" onclick="tambahKar()">+ Tambah karyawan</button><button class="b g" onclick="xlsTpl()">Unduh template Excel</button><label class="b g" style="cursor:pointer">Unggah Excel<input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="impKar(this)"></label><button class="b g" onclick="nvA('dat')">Buka Pusat Data</button></div>
    <div class="card"><h2>Popup poster promo</h2><button class="chp ${(S.pop||{}).on?'on':''}" onclick="togPop()">${(S.pop||{}).on?'Aktif':'Nonaktif'}</button>
    <label>Poster (gambar saja)</label>${(S.pop||{}).img?`<img src="${esc(S.pop.img)}" alt="" style="display:block;max-width:150px;max-height:200px;border-radius:10px;margin:0 0 8px"><button class="b g" onclick="hapusPp()">Hapus poster</button>`:''}<input type="file" accept="image/*" onchange="ppUp(this)">
    <label>Ukuran poster</label><div class="mt">${[['s','Kecil'],['m','Sedang']].map(([k,l])=>`<button class="${((S.pop||{}).w||'m')===k?'on':''}" onclick="ppW('${k}')">${l}</button>`).join('')}</div>
    <label>Pesan otomatis ke CS (tidak tampil di poster)</label><input id="ppm" value="${esc((S.pop||{}).msg)}" placeholder="Halo, saya tertarik dengan promo di poster ini">
    <button class="b g" onclick="bacaSv();prevPop()">Pratinjau</button><p class="mut">Pelanggan cukup menekan gambar poster untuk masuk ke WA CS, atau menutupnya dengan tanda silang.</p></div>
    <div class="card"><h2>Pembayaran &amp; QRIS</h2><label>Gambar QRIS asli (foto atau tangkapan layar)</label><input type="file" accept="image/*" onchange="qrisUp(this)">${S.qris?'<button class="b g" onclick="hapusQris()">Hapus QRIS</button>':''}${qrisSt()}<details><summary>Cara lain: tempel teks QRIS</summary><textarea id="sq" placeholder="000201010211...">${esc(S.qris)}</textarea><button class="b g" onclick="bacaSv();draw()">Cek teks</button></details></div>
    <div class="card"><h2>Jam operasional &amp; FAQ</h2><label>Jam buka</label><input id="jb" type="time" value="${esc((S.ops||{}).b)}"><label>Jam tutup</label><input id="jt" type="time" value="${esc((S.ops||{}).t)}"><label>Hari buka</label><div>${['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map((d,i)=>`<button class="chp ${((S.ops&&S.ops.h)||[1,2,3,4,5,6]).includes(i)?'on':''}" onclick="hari(${i})">${d}</button>`).join('')}</div>
    <label>FAQ (satu per baris, format: Pertanyaan | Jawaban)</label><textarea id="sf" placeholder="Apakah ada garansi? | Ada, klaim maksimal 1x24 jam.">${esc(S.faq)}</textarea></div>
    <div class="card"><h2>Template pesan WA</h2><p class="mut">Kode yang bisa dipakai: {nama} {nota} {layanan} {total} {bayar} {estimasi} {link} {laundry}</p>
    <label>Order diterima</label><textarea id="tb">${esc((S.tpl&&S.tpl.baru)||DT.baru)}</textarea><label>Cucian selesai</label><textarea id="ts">${esc((S.tpl&&S.tpl.selesai)||DT.selesai)}</textarea><label>Pengingat belum diambil</label><textarea id="ti">${esc((S.tpl&&S.tpl.ingat)||DT.ingat)}</textarea></div>
    ${btCard()}
    <div class="card"><h2>WA otomatis (Fonnte)</h2><p class="mut">Pesan dikirim ke pelanggan tanpa perlu klik. Butuh akun Fonnte dan fungsi kirim-wa di Supabase (lihat PANDUAN-FONNTE.md). Pesan memakai Template pesan WA di atas.</p>
    <label class="chk"><input type="checkbox" id="wao" ${(S.wa||{}).on?'checked':''}> Aktifkan WA otomatis</label>
    <label class="chk"><input type="checkbox" id="wab" ${(S.wa||{}).baru!==0?'checked':''}> Kirim saat order baru dicatat</label>
    <label class="chk"><input type="checkbox" id="was" ${(S.wa||{}).selesai!==0?'checked':''}> Kirim saat cucian selesai</label>
    <label>Tes kirim ke nomor</label><input id="wat" inputmode="tel" placeholder="08123456789"><button class="b g" onclick="waTes()">Kirim pesan tes</button></div>
    <div class="card"><h2>Pesanan online</h2><p class="mut">Pelanggan memesan produk dari halaman Toko, lalu pesanannya muncul di Beranda kasir. Anda bisa menerima satu per satu, atau otomatis.</p><label class="chk"><input type="checkbox" id="sap" ${S.autoPes?'checked':''}> Terima pesanan online otomatis (jika stok cukup)</label></div>
    <div class="card"><h2>Toko &amp; Akses</h2><label>Batas hari cucian belum diambil (diberi tanda merah)</label><input id="snh" type="number" min="1" value="${S.nHari||3}"><label>Nama laundry</label><input id="sn" value="${esc(S.nama)}"><label>Nama pemilik (tampil di bawah halaman pelanggan)</label><input id="sp" value="${esc((S.pm||{}).nama)}">
    <label>No. WA CS untuk pelanggan</label><input id="sc" inputmode="tel" placeholder="08123456789" value="${esc((S.pm||{}).cs)}">
    <label>Alamat</label><input id="sa" value="${esc((S.pm||{}).alamat)}"><label>Jam buka</label><input id="sj" placeholder="Senin-Sabtu 08.00-20.00" value="${esc((S.pm||{}).jam)}">
    <label>Instagram (opsional)</label><input id="si" placeholder="@laundrysaya" value="${esc((S.pm||{}).ig)}">
    <label>Link halaman ini (untuk pelanggan, tempel dari tombol bagikan)</label>
    <input id="sb" value="${esc(S.base)}"><label>No. WA admin (penerima kode pendaftaran pelanggan)</label><input id="sno" inputmode="tel" value="${esc(S.admNo)}" placeholder="08123456789"><button class="b g" onclick="cadang()">Unduh cadangan (CSV)</button><button class="b g" onclick="cadangJson()">Cadangan lengkap (JSON)</button><label class="b g" style="cursor:pointer">Pulihkan dari JSON<input type="file" accept=".json,application/json" style="display:none" onchange="pulihJson(this)"></label><button class="b g" onclick="ask('Perkecil kualitas foto poster, banner, dan logo supaya penyimpanan lebih cepat? Foto menjadi sedikit kurang tajam.',()=>kecilkan(),'Perkecil')">Perkecil ukuran gambar</button></div></div>`;
  if(tab==='home'&&ban){body=body.replace('<div class="gp ag">',ban+'<div class="gp ag">');ban=''}
  $('#app').innerHTML=`${(tab==='home'||tab==='det'||tab==='hut')?'':`<div class="abar"><div><b>${TT[tab==='riw'?'pend':tab]}</b><small>${esc(me()||'Admin')}</small></div><span class="abr">${thSw()}<button class="lgb" style="margin:0" onclick="askOut()">Keluar</button></span></div>`}${ban}${body}${payHtml()}${tuHtml()}${okHtml()}`;
  $('#app').insertAdjacentHTML('beforeend',admNav());if(pid)updKem();if(tab==='set')tidyAtur();
  if(tab==='baru'){if(ed)isiEdit();else{estAuto();drawLines()}}
}
function svIcon(n){n=String(n).toLowerCase();return /express/.test(n)?'⚡':/bed|selimut|sprei|sprai/.test(n)?'🛏️':/sepatu/.test(n)?'👟':/karpet/.test(n)?'🧶':/gorden|tirai/.test(n)?'🪟':/jas/.test(n)?'🤵':/boneka/.test(n)?'🧸':/kiloan|kilo/.test(n)?'🧺':'👕'}
function items(o){return (o.it&&o.it.length)?o.it:[{sv:o.sv,qty:o.qty,hs:o.hs||(SV[o.sv]||{}).h||0}]}
function itemsTxt(o){return items(o).map(x=>SV[x.sv].n+' '+x.qty+' '+SV[x.sv].u).join(' + ')}
function nn(o){return o.no||('#'+o.id)}
function newNo(ms){const d=new Date(ms),y=d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');let mx=0;S.orders.forEach(o=>{const m=String(o.no||'').match(/^ORD-(\d{8})-(\d+)$/);if(m&&m[1]===y)mx=Math.max(mx,+m[2])});S.nc=S.nc||{};const n=Math.max(S.nc[y]||0,mx)+1;S.nc[y]=n;return 'ORD-'+y+'-'+String(n).padStart(4,'0')}
function h32(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rkode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',b=new Uint8Array(8);crypto.getRandomValues(b);let s='';for(let i=0;i<8;i++)s+=A[b[i]%32];return s}
function tkc(o){if(o.lk)return o.lk;const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='',x=h32(o.id+'|'+o.masuk+'|'+(o.no||'')),y=h32(o.masuk+'|'+o.id+'|'+S.nama);for(let i=0;i<3;i++){s+=A[x%32];x=Math.floor(x/32)}for(let i=0;i<3;i++){s+=A[y%32];y=Math.floor(y/32)}return s}
const b64u=s=>btoa(unescape(encodeURIComponent(s))),ub64u=s=>decodeURIComponent(escape(atob(s)));
function ask(msg,fn,ok){cbk=fn;const e=document.getElementById('ask');if(e)e.remove();$('#app').insertAdjacentHTML('beforeend',`<div class="ov hi" id="ask"><div class="md"><h2>Konfirmasi</h2><p>${esc(msg)}</p><div class="row" style="gap:10px"><button class="b g" style="flex:1;margin:0" onclick="askX()">Batal</button><button class="b" style="flex:1;margin:0" onclick="askOk()">${esc(ok||'Ya')}</button></div></div></div>`)}
function askX(){cbk=null;const e=document.getElementById('ask');if(e)e.remove()}
function askOk(){const f=cbk;askX();if(f)f()}
function askOut(){sbKeluar()}
function lnTot(){return ln.reduce((s,x)=>s+Math.round((+x.qty||0)*(+x.hs||0)),0)}
function qtyTxt(){const m={};ln.forEach(x=>{const u=SV[x.sv].u;m[u]=(m[u]||0)+(+x.qty||0)});return Object.entries(m).map(([u,q])=>(Math.round(q*100)/100)+' '+u).join(', ')||'0'}
function lineH(x,i){const v=SV[x.sv],sub=Math.round((+x.qty||0)*(+x.hs||0));
  return `<div class="ln"><div class="row"><div><span class="svi">${svIcon(v.n)}</span> <b>${esc(v.n)}</b></div><button type="button" class="b g" style="margin:0;padding:6px 0;width:36px;color:var(--bad);border-color:var(--bad)" onclick="lnDel(${i})" aria-label="Hapus layanan">×</button></div>${(x.c||x.jp)?`<div class="mut" style="font-size:13px;margin-top:4px">${x.c?esc(x.c):''}${x.c&&x.jp?' · ':''}${x.jp?x.jp+' pakaian':''}</div>`:''}
  <div class="fm" style="margin-top:8px"><div><label>Jumlah</label><div class="stp"><button type="button" onclick="lnStep(${i},-1)" aria-label="Kurangi">−</button><input type="text" inputmode="decimal" autocomplete="off" value="${x.qty?fq(x.qty):''}" placeholder="0" oninput="lnSet(${i},'qty',this.value)"><span>${esc(v.u)}</span><button type="button" onclick="lnStep(${i},1)" aria-label="Tambah">+</button></div></div>
  <div><label>Harga satuan (Rp)</label><input type="number" min="0" inputmode="numeric" value="${x.hs||''}" placeholder="isi harga" ${(!owner()&&SV[x.sv].h>0)?'readonly':''} oninput="lnSet(${i},'hs',this.value)"></div></div>
  <div class="row" style="margin-top:8px"><span class="mut">Subtotal</span><b id="ls${i}">${rp(sub)}</b></div></div>`}
function drawLines(){const e=$('#lines');if(!e)return;e.innerHTML=ln.length?ln.map(lineH).join(''):'<div class="emp"><b>Belum ada layanan</b><small>Tambahkan minimal 1 layanan untuk melanjutkan</small><button type="button" class="b" onclick="openPk()">+ Pilih Layanan</button></div>';hitung()}
function lnSet(i,k,v){ln[i][k]=numIn(v);const e=$('#ls'+i);if(e)e.textContent=rp(Math.round((+ln[i].qty||0)*(+ln[i].hs||0)));hitung()}
function lnStep(i,d){const st=SV[ln[i].sv].u==='kg'?0.5:1;ln[i].qty=Math.max(0,Math.round(((+ln[i].qty||0)+d*st)*100)/100);drawLines()}
function lnDel(i){ln.splice(i,1);drawLines()}
let pkU='Semua',pkTarget=null;
function svKat(v){return v.p?'Produk':v.kat||String(v.n).split(/\s+[-–]\s+|\s+/)[0]}
function pkTabs(){const us=['Semua',...new Set(Object.values(SV).filter(v=>v.on&&!v.p).map(v=>v.u)),...(Object.values(SV).some(v=>v.on&&v.p)?['Produk']:[])];return `<div class="seg" style="max-width:none;overflow:auto;margin:10px 0">${us.map(u=>`<button class="${pkU===u?'on':''}" onclick="pkU='${esc(u)}';pkF()">${u==='Semua'?'Semua':esc(String(u).toUpperCase())}</button>`).join('')}</div>`}
function pkList(q){q=String(q||'').toLowerCase();const g={};Object.entries(SV).filter(([k,v])=>v.on&&v.n.toLowerCase().includes(q)&&(pkU==='Semua'||(pkU==='Produk'?v.p:(!v.p&&v.u===pkU)))).forEach(([k,v])=>{(g[svKat(v)]=g[svKat(v)]||[]).push([k,v])});
  return Object.entries(g).map(([kt,l])=>`<div class="kth" style="color:var(--pri);font-size:14px;letter-spacing:0">${svIcon(l[0][1].n)} ${esc(kt)}</div>`+l.map(([k,v])=>`<button type="button" class="pkr" ${v.p&&v.st!=null&&v.st<=0?'disabled style="opacity:.5"':`onclick="pkDet('${k}')"`}>${v.p&&v.img?`<img class="pthm t40" src="${esc(v.img)}" alt="">`:''}<span style="flex:1"><b>${esc(v.n)}</b><div class="mut">${v.p?(v.st!=null?(v.st<=0?'Stok habis':'Stok '+v.st):'Produk'):durTxt(v.j)}</div></span><span style="text-align:right"><b style="color:var(--pri)">${v.h?rp(v.h):'Harga bebas'}</b><div class="mut">${v.h?'/'+esc(v.u):''}</div></span><span class="mut">›</span></button>`).join('')).join('')||'<p class="mut">Tidak ada layanan.</p>'}
function openPk(u){closePk();pkU=u||'Semua';$('#app').insertAdjacentHTML('beforeend',`<div class="sheet" id="pk"><div class="sin"><div class="hd2"><button class="bk" onclick="closePk()" aria-label="Kembali">←</button><h1 style="margin:0">Pilih Layanan</h1></div><input id="pks" placeholder="Cari layanan..." oninput="pkF()"><div id="pkl" style="margin-top:6px">${pkTabs()}${pkList('')}</div></div></div>`)}
function pkF(){$('#pkl').innerHTML=pkTabs()+pkList((($('#pks')||{}).value)||'')}
function closePk(){const e=document.getElementById('pk');if(e)e.remove();closePd()}
function closePd(){const e=document.getElementById('pd');if(e)e.remove()}
function pkDet(k){closePd();const v=SV[k],lock=!owner()&&v.h>0;
  $('#app').insertAdjacentHTML('beforeend',`<div class="ov hi mr" id="pd" onclick="if(event.target===this)closePd()"><div class="bs" style="max-height:92vh;overflow:auto"><div class="grip"></div><div class="row" style="margin:10px 0 2px"><div><b style="font-size:19px">${esc(v.n)}</b><div class="mut">${v.h?rp(v.h)+'/'+esc(v.u):'Harga bebas'}</div></div><button class="bk" onclick="closePd()" aria-label="Tutup">×</button></div>
  <label>Jumlah / Berat</label><div class="stp" style="background:var(--bd);padding:8px;border-radius:18px"><button type="button" onclick="pdStep(-1,'${k}')">−</button><input id="pdq" type="text" autocomplete="off" inputmode="decimal" value="1" style="font-size:26px;flex:1;width:auto" oninput="pdUpd()"><span>${esc(v.u)}</span><button type="button" onclick="pdStep(1,'${k}')">+</button></div>
  <label>Harga satuan (Rp)</label><input id="pdh" type="number" min="0" inputmode="numeric" value="${v.h||''}" placeholder="isi harga" ${lock?'readonly':''} oninput="pdUpd()">
  <label>Catatan (opsional)</label><input id="pdc" placeholder="Contoh: jangan campur baju putih"><label>Jumlah pakaian (opsional)</label><input id="pdj" type="number" min="0" inputmode="numeric" placeholder="0">
  <div class="row" style="margin:14px 0 4px"><b>Subtotal</b><b id="pds" style="color:var(--pri);font-size:20px">${rp(v.h)}</b></div><button class="b" style="width:100%;margin:6px 0 0;padding:14px" onclick="addLnD('${k}')">Tambah ke Order</button></div></div>`);pdUpd()}
function pdUpd(){const e=$('#pds');if(e)e.textContent=rp(Math.round(numIn($('#pdq').value)*(+$('#pdh').value||0)))}
function pdStep(d,k){const e=$('#pdq'),st=SV[k].u==='kg'?0.5:1;e.value=fq(Math.max(0,Math.round((numIn(e.value)+d*st)*100)/100));pdUpd()}
function addLnD(k){const q=numIn($('#pdq').value),h=+$('#pdh').value;if(!(q>0)||!(h>0)){toast('Isi jumlah dan harga');return}if(SV[k].p&&SV[k].st!=null&&q>SV[k].st){toast('Stok '+SV[k].n+' tinggal '+SV[k].st);return}const it={sv:k,qty:q,hs:h,c:($('#pdc').value||'').trim(),jp:+$('#pdj').value||0};closePk();if(pkTarget){addToOrder(pkTarget,it);return}ln.push(it);estAuto();drawLines()}
function estAuto(){if(feT||!$('#fe'))return;const h=Math.max(0,...ln.map(x=>SV[x.sv].j))||24,d=new Date(Date.now()+h*36e5);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());$('#fe').value=d.toISOString().slice(0,16)}
function disk(p){const sub=lnTot();$('#fk').value=p<0?'':(p<1?Math.round(sub*p):p);hitung()}
function tg(id,on){const b=$('#'+id);if(!b)return;b.classList.toggle('on',!!on);const bl=$('#'+id+'b');if(bl)bl.style.display=on?'block':'none';const al=$('#alb');if(al)al.style.display=($('#tjem').classList.contains('on')||$('#tant').classList.contains('on'))?'block':'none'}
function togJA(id){tg(id,!$('#'+id).classList.contains('on'))}
function toLoc(ms){const d=new Date(ms);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)}
function ex(){return {jb:+$('#fj').value||0,jem:$('#tjem').classList.contains('on')?1:0,ant:$('#tant').classList.contains('on')?1:0,alm:$('#fa').value.trim(),jj:$('#fjm').value?new Date($('#fjm').value).getTime():0,ja:$('#fan').value?new Date($('#fan').value).getTime():0}}
function pakaiVc(){const kv=nw($('#fw').value),vc=(S.vc&&S.vc[kv])||0;if(vc<=0)return;vcOn=Math.min(vc,25000);hitung()}
function hitung(){const kv=nw(($('#fw')||{}).value||''),vc=(S.vc&&S.vc[kv])||0,vb=$('#vcb');if(vb){if(vc>0&&!ed){vb.style.display='block';vb.innerHTML=vcOn?`<span class="chip s2">🎟 Voucher ${rp(vcOn)} dipakai</span> <button type="button" class="b g" style="margin:0 0 0 8px;padding:4px 10px" onclick="vcOn=0;hitung()">Batalkan</button>`:`<button type="button" class="b g" style="margin:0" onclick="pakaiVc()">🎟 Pakai voucher poin ${rp(Math.min(vc,25000))}</button>`}else{vb.style.display='none';vcOn=0}}
  {const kk=$('#fw').disabled?nw(cuSelWa):nw($('#fw').value),cc=(S.cu||[]).find(x=>nw(x.wa)===kk),cn=$('#cnote');if(cn)cn.innerHTML=cc&&(cc.cat||cc.blok)?`<div class="ban" style="background:${cc.blok?'#b91c1c':'#b7791f'};margin:10px 0 0"><b>${cc.blok?'Pelanggan bermasalah':'Catatan pelanggan'}</b><br>${esc(cc.cat||'Ditandai bermasalah')}</div>`:''}
  {const jn=$('#jnote');if(jn)jn.innerHTML=ln.length&&ln.every(x=>SV[x.sv]&&SV[x.sv].p)?'<p class="mut" style="margin:8px 0 0">Penjualan produk: nama dan nomor WA boleh dikosongkan (dicatat sebagai Umum). Langsung dianggap selesai dan diambil.</p>':''}
  const fkE=$('#fk');if(fkE)fkE.value=dskTotal();const dsm=$('#dsum');if(dsm)dsm.textContent=dskText()?dskText()+' · -'+rp(dskTotal()):'Belum ada diskon';const sub=lnTot(),dk=+$('#fk').value||0,tot=Math.max(0,sub-dk),s=(i,x)=>{const e=$('#'+i);if(e)e.textContent=x};
  s('ft',rp(tot));s('rsi',ln.length);s('rsq',qtyTxt());s('rss',rp(sub));s('rsd',dk?'-'+rp(dk):'Rp0');s('rst',rp(tot));
  const b=$('#bbuat');if(b)b.disabled=!(ln.length&&ln.every(x=>(+x.qty>0)&&(+x.hs>0))&&$('#fn').value.trim()&&(!$('#fw').value.trim()||validWa($('#fw').value)))}
function simpan(){let nama=$('#fn').value.trim(),est=$('#fe').value;let wa=$('#fw').value.trim();if($('#fw').disabled&&cuSelWa)wa=cuSelWa;
  const solo=ln.length>0&&ln.every(x=>SV[x.sv]&&SV[x.sv].p);if(solo&&!ed){if(!nama)nama='Umum';if(!validWa(wa))wa=umumWa();if(!est)est=toLoc(Date.now())}
  if(!nama||!est){toast('Lengkapi data dulu');return}
  if(!wa)wa=umumWa();if(!validWa(wa)){toast('Nomor WA tidak valid (contoh 08123456789), atau kosongkan jika tidak ada');return}
  if(!ln.length||ln.some(x=>!(+x.qty>0)||!(+x.hs>0))){toast('Isi jumlah dan harga tiap layanan');return}
  const it=ln.map(x=>({sv:x.sv,qty:+x.qty,hs:+x.hs,c:x.c||'',jp:x.jp||0})),eo=ed?S.orders.find(x=>x.id===ed):null,se=stokCek(it,eo?items(eo):[]);if(se){toast(se);return}
  const dis=+$('#fk').value||0,tot=Math.max(0,it.reduce((s,x)=>s+Math.round(x.qty*x.hs),0)-dis),f=it[0];
  if(ed){const o=S.orders.find(x=>x.id===ed);stokGeser(items(o),1);stokGeser(it,-1);Object.assign(o,owner()?{pj:$('#fp').value}:{},ex(),{nama,wa,it,sv:f.sv,qty:f.qty,hs:f.hs,total:tot,disk:dis,cat:$('#fc').value.trim(),est:new Date(est).getTime()});aud('Ubah order',o,rp(tot));ed=null;tab='pend';save();return}
  const kv=nw(wa);let vcu=0;if(vcOn&&S.vc&&S.vc[kv]>=vcOn){vcu=vcOn;S.vc[kv]-=vcOn}vcOn=0;const now=Date.now(),o={vc:vcu,id:++S.seq,no:newNo(now),lk:rkode(),...ex(),nama,wa,it,sv:f.sv,qty:f.qty,hs:f.hs,total:tot,pj:$('#fp').value,disk:dis,dn:dskText(),cat:$('#fc').value.trim(),masuk:now,est:new Date(est).getTime(),st:0,bayar:'Belum',dp:0,met:'Tunai',pay:[],log:[{t:now,s:0}]};
  if(solo){o.jual=1;o.st=3;o.est=now;o.sel=now;o.log=[{t:now,s:0},{t:now,s:3,by:me()||'Admin'}]}stokGeser(it,-1);aud('Buat order',o,rp(tot));if(!(S.cu||[]).some(x=>nw(x.wa)===nw(wa)))(S.cu=S.cu||[]).push({nama,wa,alamat:'',cat:'',blok:0,t:Date.now(),kd:nextKd()});S.orders.push(o);ss('last',o.id+':n');waAuto(o,'baru');newOid=o.id;tab='pend';payInit(o.id);draw()}
function bacaSv(){dirty=true;S.svc.forEach((s,i)=>{const n=$('#vn'+i);if(!n)return;s.n=n.value.trim()||s.n;s.h=+$('#vh'+i).value||0;s.u=$('#vu'+i).value.trim()||'kg';s.j=+$('#vj'+i).value||24});if($('#sn')){S.nama=$('#sn').value.trim()||'Laundry Saya';S.base=$('#sb').value.trim();S.info=$('#sg').value.trim();S.prd=(S.prd||[]).map((p,i)=>{const n=$('#pn'+i);if(!n)return p;p.n=n.value.trim()||p.n;p.h=Math.max(0,+$('#ph'+i).value||0);const s=$('#ps'+i).value;p.st=s===''?null:Math.max(0,Math.round(+s||0));SV[p.k]=p;return p});if($('#mup')){S.mutProv=$('#mup').value;S.mutUrl=$('#mus').value.trim()}S.dsk=(S.dsk||[]).map((d,i)=>{const n=$('#dn'+i);return n?{n:n.value.trim()||d.n,t:$('#dt'+i).value==='p'?'p':'r',v:Math.max(0,+$('#dv'+i).value||0),on:d.on===0?0:1}:d});S.pop=Object.assign({},S.pop,{msg:$('#ppm').value.trim()});S.admNo=$('#sno').value.trim();S.nHari=Math.max(1,+$('#snh').value||3);if($('#wao'))S.wa={on:$('#wao').checked?1:0,baru:$('#wab').checked?1:0,selesai:$('#was').checked?1:0};S.autoPes=$('#sap')&&$('#sap').checked?1:0;S.kar=(S.kar||[]).map((k,i)=>{const g=id=>$('#'+id+i);return {n:g('kn')?(g('kn').value.trim()||k.n):k.n,hp:g('kh')?g('kh').value.trim():(k.hp||''),jab:g('kj')?g('kj').value.trim():(k.jab||''),on:k.on===0?0:1}});S.rev=$('#sr').value.trim();S.pj=(S.promo||[]).map((u,i)=>{const e=$('#pj'+i);return e?e.value.trim():((S.pj||[])[i]||'')});S.qris=$('#sq').value.replace(/[\r\n\t]+/g,'').trim();S.ops={b:$('#jb').value,t:$('#jt').value,h:(S.ops&&S.ops.h)||[1,2,3,4,5,6]};S.faq=$('#sf').value;S.pst=[0,1,2,3].map(i=>$('#p'+i).value.trim());S.tpl={baru:$('#tb').value,selesai:$('#ts').value,ingat:$('#ti').value};S.pm={nama:$('#sp').value.trim(),cs:$('#sc').value.trim(),alamat:$('#sa').value.trim(),jam:$('#sj').value.trim(),ig:$('#si').value.trim()}}}
function tog(i){bacaSv();S.svc[i].on=S.svc[i].on?0:1;draw()}
function tambahSv(){bacaSv();const s={k:'s'+Date.now(),n:'Layanan baru',h:0,u:'kg',j:48,on:1};S.svc.push(s);SV[s.k]=s;draw()}
function atur(){ask('Simpan semua perubahan pengaturan? Perubahan langsung tampil ke pelanggan.',()=>atur2(),'Simpan')}
function atur2(){bacaSv();save()}
async function cadang(){
  const q=v=>{let s=String(v==null?'':v);if(/^[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
  const h=['Nota','Nama','WA','Layanan','Jumlah','Satuan','Diskon','Total','Pembayaran','DP','Status','Masuk','Estimasi','Catatan','Metode'];
  const r=S.orders.map(o=>[o.no||o.id,o.nama,o.wa,itemsTxt(o),items(o).reduce((s,x)=>s+x.qty,0),'',o.disk||0,o.total,o.bayar,o.dp,STN[o.st],new Date(o.masuk).toISOString(),new Date(o.est).toISOString(),o.cat||'',o.met||''].map(q).join(','));
  const d=_d||(_d=await cap('downloads'));if(!d){toast('Unduhan tidak tersedia di tampilan ini');return}try{localStorage.setItem('bk',Date.now())}catch(e){}
  try{await d.save({filename:'cadangan-laundry-'+new Date().toISOString().slice(0,10)+'.csv',data:'\ufeff'+[h.map(q).join(','),...r].join('\n')})}catch(e){}}
function keluar(){sbKeluar()}
function wr(o){return 'https://wa.me/'+nomor(o.wa)+'?text='+encodeURIComponent(fill('ingat',o))}
function remind(){const a=S.orders.filter(o=>o.st===2);if(!a.length)return '';
  return `<div class="card full"><h2>Belum diambil (${a.length})</h2>${a.map(o=>`<div class="row" style="padding:4px 0"><span>${nn(o)} ${esc(o.nama)}${o.sel?(()=>{const d=Math.floor((Date.now()-o.sel)/864e5),n=S.nHari||3;return d>=n?` <span class="chip s4">${d} hari, lewat batas</span>`:` <span class="mut">· ${d} hari</span>`})():''}</span><a class="b g" style="margin:0" target="_blank" rel="noopener" href="${wr(o)}">Ingatkan</a></div>`).join('')}</div>`}
function isTw(w){return /^620000\d{6}$/.test(nw(w))}
function wShow(w){return isTw(w)?'tanpa no wa':w}
function pelList(){const m={};
  (S.cu||[]).forEach(c=>{const k=nw(c.wa);m[k]={k,nama:c.nama,wa:c.wa,c:0,t:0,l:c.t||0,cu:c}});
  S.orders.forEach(o=>{if(o.st===4)return;const k=nw(o.wa),c=m[k]||(m[k]={k,nama:o.nama,wa:o.wa,c:0,t:0,l:0});if(!c.cu)c.nama=o.nama;c.c++;c.t+=o.total;c.l=Math.max(c.l,o.masuk)});
  return Object.values(m).filter(c=>c.k!=='620000000000').sort((x,y)=>y.l-x.l)}
function isiWa(){const c=pelList().find(x=>x.nama.toLowerCase()===$('#fn').value.trim().toLowerCase());if(c&&!$('#fw').value&&!isTw(c.wa))$('#fw').value=c.wa}
function hutList(){const m={};S.orders.forEach(o=>{if(o.st===4)return;const s=tagih(o);if(s<=0)return;const k=nw(o.wa),r=m[k]||(m[k]={k,nama:o.nama,wa:o.wa,o:[],s:0,tua:Date.now()});r.o.push(o);r.s+=s;r.tua=Math.min(r.tua,o.masuk);r.nama=o.nama});return Object.values(m).sort((a,b)=>b.s-a.s)}
function nvH(){tab='hut';ed=null;q='';fl='';draw();try{window.scrollTo(0,0)}catch(e){}}
function pelCard(c){const sl=(S.sal&&S.sal[c.k])||0,hu=S.orders.filter(o=>nw(o.wa)===c.k&&o.st===3&&tagih(o)>0).reduce((s,o)=>s+tagih(o),0),cu=c.cu;
  return `<div class="card"><div class="row"><b>${esc(c.nama)}</b><span>${isTw(c.wa)?'':`<a class="b g" style="margin:0 6px 0 0;padding:7px 12px" target="_blank" rel="noopener" href="https://wa.me/${nomor(c.wa)}">WA</a>`}<button class="b g" style="margin:0;padding:7px 12px" onclick="openCu('${c.k}')">Ubah</button></span></div><div class="kdr">${kdHtml(c.wa)}</div><p class="mut">${esc(wShow(c.wa))} · ${c.c} order · ${rp(c.t)}${c.l?' · terakhir '+fmt(c.l):''}</p>${cu&&cu.alamat?`<p class="mut" style="margin:2px 0">📍 ${esc(cu.alamat)}</p>`:''}${cu&&cu.cat?`<p style="margin:2px 0;color:${cu.blok?'var(--bad)':'var(--warn)'}">⚠ ${esc(cu.cat)}</p>`:''}<p>⭐ <b>${poin(c.wa)}</b> poin ${poin(c.wa)>=50?`<button class="b g" style="margin:0 0 0 8px" onclick="tebus('${c.k}')">Tebus 50 poin (diskon Rp25.000)</button>`:''}</p>
  ${(S.vc&&S.vc[c.k])?`<p>🎟 Voucher: <b>${rp(S.vc[c.k])}</b></p>`:''}<p>Saldo <b>${rp(sl)}</b> <button class="b g" style="margin:0 0 0 8px;padding:6px 12px" onclick="tuOpen('${c.k}')">Isi saldo</button>${hu>0?` · <span style="color:var(--bad)">Hutang ${rp(hu)}</span>`:''}</p></div>`}
function pelCards(q){q=String(q||'').trim().toLowerCase();const a=pelList().filter(c=>!q||c.nama.toLowerCase().includes(q)||String(c.wa).includes(q)||String((c.cu&&c.cu.kd)||'').toLowerCase().includes(q));return a.length?a.map(pelCard).join(''):`<div class="card mut" style="grid-column:1/-1">${q?'Tidak ditemukan.':'Belum ada pelanggan.'}</div>`}
function cariPel(v){const e=$('#pl');if(e)e.innerHTML=pelCards(v)}
function dPel(){const L=hutList(),tot=L.reduce((s,x)=>s+x.s,0);
  return `<div class="qa full"><button class="b" onclick="openCu()">+ Tambah Pelanggan</button><button class="b g" onclick="openIs()">Import Kontak</button></div>
  <div class="card hutbar full" onclick="nvH()"><div><b>Bayar Hutang</b><div class="mut">${L.length?L.length+' pelanggan belum lunas':'Tidak ada tagihan'}</div></div><div style="text-align:right"><b style="color:${tot?'var(--bad)':'var(--ok)'}">${rp(tot)}</b><span class="mut"> ›</span></div></div>
  <div class="full" style="grid-column:1/-1"><input id="pq" placeholder="Cari nama, nomor, atau kode pelanggan..." oninput="cariPel(this.value)"></div>
  <div id="pl" style="display:contents">${pelCards('')}</div>`}
function hutRows(q){q=String(q||'').trim().toLowerCase();const a=hutList().filter(x=>!q||x.nama.toLowerCase().includes(q)||String(x.wa).includes(q)||String((cuOf(x.wa)||{}).kd||'').toLowerCase().includes(q));
  return a.length?a.map(x=>{const hr=x.o.filter(o=>o.st===3).reduce((s,o)=>s+tagih(o),0),hari=Math.max(0,Math.floor((Date.now()-x.tua)/864e5));return `<div class="card"><div class="row"><div style="min-width:0"><b>${esc(x.nama)}</b><div class="kdr">${kdHtml(x.wa)}</div><div class="mut" style="font-size:12.5px">${x.o.length} order · tertua ${hari?hari+' hari lalu':'hari ini'}${hr?' · sudah diambil '+rp(hr):''}</div></div><div style="text-align:right;flex:none"><b style="color:var(--bad);font-size:17px">${rp(x.s)}</b><br><button class="b" style="margin:6px 0 0;padding:7px 14px" onclick="hutOpen('${x.k}')">Bayar</button></div></div></div>`}).join(''):`<div class="card mut" style="text-align:center">${q?'Tidak ditemukan.':'Tidak ada hutang. Semua order sudah lunas.'}</div>`}
function cariHut(v){const e=$('#hl');if(e)e.innerHTML=hutRows(v)}
function dHut(){const L=hutList(),tot=L.reduce((s,x)=>s+x.s,0),amb=S.orders.filter(o=>o.st===3).reduce((s,o)=>s+Math.max(0,tagih(o)),0);
  return `<div class="hd2"><button class="bk" onclick="nvA('pel')" aria-label="Kembali">←</button><h1 style="margin:0;font-size:19px">Bayar Hutang</h1></div>
  <div class="ks" style="--n:3"><div class="kc"><small>Belum lunas</small><b style="color:${tot?'var(--bad)':'var(--ok)'}">${rp(tot)}</b></div><div class="kc"><small>Sudah diambil</small><b>${rp(amb)}</b></div><div class="kc"><small>Pelanggan</small><b>${L.length}</b></div></div>
  <input id="hq" style="margin-top:12px" placeholder="Cari nama, nomor, atau kode..." oninput="cariHut(this.value)"><div id="hl" style="margin-top:10px">${hutRows('')}</div>`}
function closeHb(){const e=document.getElementById('hb');if(e)e.remove()}
function hutOpen(k){closeHb();const x=hutList().find(r=>r.k===k);if(!x)return;const L=x.o.slice().sort((a,b)=>a.masuk-b.masuk),sal=(S.sal&&S.sal[k])||0;
  $('#app').insertAdjacentHTML('beforeend',`<div class="ov hi mr" id="hb" data-k="${k}"><div class="bs" style="max-height:90vh;overflow:auto"><div class="row" style="margin:6px 0 4px"><div><b style="font-size:18px">Bayar Hutang</b><div class="mut">${esc(x.nama)}</div></div><button class="bk" onclick="closeHb()" aria-label="Tutup">×</button></div>
  <div class="kth">PILIH ORDER</div>${L.map(o=>`<label class="ck"><input type="checkbox" class="hbc" value="${o.id}" data-s="${tagih(o)}" checked onchange="hbUpd()"><div><b>${esc(nn(o))}</b> <span class="chip s${o.st}">${STN[o.st]}</span><div class="mut" style="font-size:12.5px">${fmt(o.masuk)}</div></div><b style="color:var(--bad)">${rp(tagih(o))}</b></label>`).join('')}
  <label>Nominal dibayar</label><input id="hbn" type="number" inputmode="numeric" style="font-size:20px;font-weight:700" oninput="hbUpd(1)"><div id="hbi" class="mut" style="margin-top:4px"></div>
  <div class="mt" style="margin:12px 0">${['Tunai','Transfer','QRIS'].concat(sal>0?['Saldo']:[]).map((m,i)=>`<button class="hbm ${i?'':'on'}" data-m="${m}" onclick="hbMet(this)">${m}${m==='Saldo'?' ('+rp(sal)+')':''}</button>`).join('')}</div>
  <div id="hbr" style="display:none"><label>4 digit referensi bukti bayar</label><input id="hbf" inputmode="numeric" maxlength="4" placeholder="mis. 1234"></div>
  <button class="b" style="width:100%;margin:12px 0 0;padding:14px" onclick="hutGo('${k}')">Terima Pembayaran</button></div></div>`);hbUpd()}
function hbSel(){return [...document.querySelectorAll('.hbc:checked')].map(c=>({id:+c.value,s:+c.dataset.s}))}
function hbUpd(man){const s=hbSel().reduce((a,x)=>a+x.s,0),n=$('#hbn');if(!man)n.value=s||'';const v=+n.value||0;$('#hbi').textContent=v>s?'Melebihi sisa tagihan terpilih ('+rp(s)+')':'Sisa tagihan terpilih '+rp(s)+(v&&v<s?' · sisa setelah bayar '+rp(s-v):'')}
function hbMet(b){document.querySelectorAll('.hbm').forEach(x=>x.classList.toggle('on',x===b));$('#hbr').style.display=b.dataset.m==='QRIS'?'block':'none'}
function hutGo(k){const sel=hbSel(),sum=sel.reduce((a,x)=>a+x.s,0);let amt=Math.round(+$('#hbn').value||0);const m=(document.querySelector('.hbm.on')||{}).dataset.m||'Tunai';
  if(!sel.length){toast('Pilih minimal satu order');return}if(!(amt>0)){toast('Isi nominal pembayaran');return}if(amt>sum){toast('Nominal melebihi sisa tagihan terpilih');return}
  S.sal=S.sal||{};if(m==='Saldo'&&amt>(S.sal[k]||0)){toast('Saldo tidak cukup');return}
  let ref='';if(m==='QRIS'){ref=(($('#hbf')||{}).value||'').replace(/\D/g,'');if(ref.length!==4){toast('Isi 4 digit referensi bukti bayar');return}}
  const now=Date.now(),by=me()||'Admin',os=sel.map(x=>S.orders.find(o=>o.id===x.id)).filter(Boolean).sort((a,b)=>a.masuk-b.masuk);let rem=amt,n=0;
  os.forEach(o=>{if(rem<=0)return;const x=Math.min(rem,tagih(o));if(x<=0)return;o.pay=o.pay||legacy(o);o.pay.push({t:now,a:x,m,by,n:'Bayar hutang',ref});sync(o);rem-=x;n++;aud('Bayar hutang',o,rp(x)+' via '+m)});
  if(m==='Saldo')S.sal[k]=(S.sal[k]||0)-amt;closeHb();toast('Pembayaran '+rp(amt)+' dicatat untuk '+n+' order');save()}
function dLap(){
  const n=new Date(),d0=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime();
  const from=per==='h'?d0:per==='w'?d0-6*864e5:new Date(n.getFullYear(),n.getMonth(),1).getTime();
  const a=S.orders.filter(o=>o.masuk>=from&&o.st!==4),tot=a.reduce((s,o)=>s+o.total,0),paid=a.reduce((s,o)=>s+(o.bayar==='Lunas'?o.total:o.bayar==='DP'?o.dp:0),0);
  const m={};a.forEach(o=>items(o).forEach(x=>{const v=SV[x.sv],r=m[v.n]||(m[v.n]={c:0,q:0,u:v.u});r.c++;r.q+=x.qty}));
  const top=Object.entries(m).sort((x,y)=>y[1].c-x[1].c),prodTot=a.reduce((s,o)=>s+items(o).filter(x=>SV[x.sv]&&SV[x.sv].p).reduce((q2,x)=>q2+Math.round(x.qty*x.hs),0),0);
  return `<div class="tabs">${[['h','Hari ini'],['w','7 hari'],['m','Bulan ini']].map(([k,l])=>`<button class="${per===k?'on':''}" onclick="per='${k}';draw()">${l}</button>`).join('')}</div>
  <div class="gr"><div class="kpi"><div style="--c:var(--pri)"><small>Jumlah order</small><b>${a.length}</b></div><div style="--c:#8b5cf6"><small>Nilai order</small><b>${rp(tot)}</b></div><div style="--c:var(--ok)"><small>Sudah dibayar</small><b style="color:var(--ok)">${rp(paid)}</b></div><div style="--c:var(--bad)"><small>Belum dibayar</small><b style="color:var(--bad)">${rp(tot-paid)}</b></div>${prodTot?`<div style="--c:#f59e0b;grid-column:1/-1"><small>Penjualan produk</small><b>${rp(prodTot)}</b></div>`:''}</div>${grafik()}
  ${metCard(a,from)}<div class="card"><h2>Layanan terlaris</h2>${top.length?hbars(top.slice(0,6).map(([k,v])=>({l:k,v:v.c,t:v.c+' order · '+(+v.q.toFixed(1))+' '+v.u}))):'<p class="mut">Belum ada data.</p>'}</div>${jamCard(a)}${pjCard(a)}${owner()?kasCard():''}</div>`}
function poin(w){const k=nw(w);if(S._pt&&S._pt[k]!=null)return S._pt[k];const e=S.orders.filter(o=>nw(o.wa)===k&&o.st===3&&!o.jual).reduce((s,o)=>s+Math.floor(o.total/1e4),0);return e-((S.tebus&&S.tebus[k])||0)}
function tebus(k){const w=S.orders.find(o=>nw(o.wa)===k);if(!w||poin(w.wa)<50){toast('Poin belum cukup (minimal 50)');return}
  ask('Tebus 50 poin menjadi voucher diskon Rp25.000? Voucher bisa dipakai otomatis di order berikutnya pelanggan ini.',()=>{S.tebus=S.tebus||{};S.tebus[k]=(S.tebus[k]||0)+50;S.vc=S.vc||{};S.vc[k]=(S.vc[k]||0)+25000;aud('Tebus poin',null,k);ss('tab','pel');save()},'Tebus')}
function fRb(v){return v>=1e6?(Math.round(v/1e5)/10).toString().replace('.',',')+' jt':v>0?Math.round(v/1000)+' rb':'0'}
function niceMax(m){if(m<=0)return 100000;const p=Math.pow(10,Math.floor(Math.log10(m))),f=m/p,n=f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10;return n*p}
let gm='u',gr=7,gsel=-1,gv='g';
function gSet(k,v){if(k==='m')gm=v;else if(k==='v')gv=v;else gr=v;gsel=-1;const e=$('#gcard');if(e)e.innerHTML=gInner()}
function gPick(i){gsel=gsel===i?-1:i;const e=$('#gcard');if(e)e.innerHTML=gInner()}
function kurva(p){const n=p.length;if(n<2)return '';const dx=[],m=[],t=[];for(let i=0;i<n-1;i++){dx[i]=p[i+1][0]-p[i][0];m[i]=(p[i+1][1]-p[i][1])/dx[i]}t[0]=m[0];t[n-1]=m[n-2];for(let i=1;i<n-1;i++)t[i]=m[i-1]*m[i]<=0?0:(m[i-1]+m[i])/2;
  for(let i=0;i<n-1;i++){if(m[i]===0){t[i]=t[i+1]=0;continue}const a=t[i]/m[i],b=t[i+1]/m[i],s=a*a+b*b;if(s>9){const k=3/Math.sqrt(s);t[i]=k*a*m[i];t[i+1]=k*b*m[i]}}
  let d='M'+p[0][0].toFixed(1)+' '+p[0][1].toFixed(1);for(let i=0;i<n-1;i++){const h=dx[i]/3;d+=' C'+(p[i][0]+h).toFixed(1)+' '+(p[i][1]+t[i]*h).toFixed(1)+' '+(p[i+1][0]-h).toFixed(1)+' '+(p[i+1][1]-t[i+1]*h).toFixed(1)+' '+p[i+1][0].toFixed(1)+' '+p[i+1][1].toFixed(1)}return d}
function grafik(){return `<div class="card" id="gcard">${gInner()}</div>`}
function gInner(){const n=new Date(),d0=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(),days=[];for(let i=gr-1;i>=0;i--)days.push(d0-i*864e5);
  const no=days.map(d=>nilaiOrder(d,d+864e5)),um=days.map(d=>uangMasuk(d,d+864e5)),nc=days.map(d=>S.orders.filter(o=>o.st!==4&&o.masuk>=d&&o.masuk<d+864e5).length),v=gm==='o'?no:um;
  const mx=Math.max(...v,1),top=niceMax(mx),tot=v.reduce((a,b)=>a+b,0),avg=Math.round(tot/gr),L=44,W=360,pw=W-L-6,y0=156,yt=24,H=y0-yt,cw=pw/gr,bw=Math.max(5,Math.min(30,cw-(gr>10?3:10))),Y=x=>y0-x/top*H,sel=gsel<0?gr-1:gsel;
  const grid=[0,.5,1].map(f=>`<line x1="${L}" x2="${W-6}" y1="${Y(top*f)}" y2="${Y(top*f)}" stroke="var(--bd)" ${f?'stroke-dasharray="3 4"':''}/><text x="${L-6}" y="${Y(top*f)+3.5}" font-size="10" text-anchor="end" fill="var(--mut)">${fRb(top*f)}</text>`).join('');
  const bars=v.map((x,i)=>{const cx=L+cw*(i+.5),h=Math.max(x?3:0,x/top*H),on=i===sel,td=i===gr-1,lab=gr<=7||on||td||x===mx&&x>0;const dl=new Date(days[i]);return `<rect x="${cx-bw/2}" y="${y0-h}" width="${bw}" height="${h}" rx="${gr>10?3:6}" fill="var(--pri)" opacity="${on?1:td?.75:.38}"/>${x&&lab?`<text x="${cx}" y="${y0-h-5}" font-size="10" font-weight="${on?700:500}" text-anchor="middle" fill="var(--tx)">${fRb(x)}</text>`:''}${(gr<=7||i%5===gr%5-1||td)?`<text x="${cx}" y="${y0+16}" font-size="${gr>10?10:11}" font-weight="${on?700:400}" text-anchor="middle" fill="${on?'var(--tx)':'var(--mut)'}">${gr<=7?dl.toLocaleDateString('id-ID',{weekday:'short'}):dl.getDate()}</text>`:''}<rect x="${cx-cw/2}" y="${yt-6}" width="${cw}" height="${H+22}" fill="transparent" style="cursor:pointer" onclick="gPick(${i})"/>`}).join('');
  const av=avg>0?`<line x1="${L}" x2="${W-6}" y1="${Y(avg)}" y2="${Y(avg)}" stroke="var(--warn)" stroke-width="1.5" stroke-dasharray="6 4"/>`:'';
  const px=i=>gr>1?L+pw*i/(gr-1):L+pw/2,pts=v.map((x,i)=>[px(i),Y(x)]),ln=kurva(pts),yb=y0.toFixed(1);
  const ar=`<defs><linearGradient id="gga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--pri)" stop-opacity=".30"/><stop offset="1" stop-color="var(--pri)" stop-opacity="0"/></linearGradient></defs><path d="${ln} L${pts[pts.length-1][0].toFixed(1)} ${yb} L${pts[0][0].toFixed(1)} ${yb} Z" fill="url(#gga)"/><path d="${ln}" fill="none" stroke="var(--pri)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  const dt=v.map((x,i)=>{const on=i===sel,sh=gr<=7||on||i===gr-1,dl=new Date(days[i]),lb=(gr<=7||i%5===gr%5-1||i===gr-1);return (on?`<line x1="${px(i)}" x2="${px(i)}" y1="${yt-4}" y2="${y0}" stroke="var(--pri)" stroke-opacity=".35" stroke-dasharray="3 3"/>`:'')+(sh?`<circle cx="${px(i)}" cy="${Y(x)}" r="${on?5:3.5}" fill="var(--card)" stroke="var(--pri)" stroke-width="2"/>`:'')+(lb?`<text x="${px(i)}" y="${y0+16}" font-size="10" font-weight="${on?700:400}" text-anchor="${i===0?'start':i===gr-1?'end':'middle'}" fill="${on?'var(--tx)':'var(--mut)'}">${dl.getDate()}/${dl.getMonth()+1}</text>`:'')+`<rect x="${px(i)-pw/(gr-1)/2}" y="${yt-6}" width="${pw/(gr-1)}" height="${H+22}" fill="transparent" style="cursor:pointer" onclick="gPick(${i})"/>`}).join('');
  const chart=gv==='g'?grid+ar+av+dt:grid+bars+av;
  const sg=(k,cur,a)=>a.map(([x,l])=>`<button class="${cur===x?'on':''}" onclick="gSet('${k}',${typeof x==='number'?x:`'${x}'`})">${l}</button>`).join('');
  return `<h2 style="margin:0 0 8px">${gm==='o'?'Nilai order':'Uang masuk'} ${gr} hari terakhir</h2><div class="gc"><span class="gs">${sg('m',gm,[['u','Uang masuk'],['o','Nilai order']])}</span><span class="gs">${sg('r',gr,[[7,'7 hari'],[30,'30 hari']])}</span><span class="gs">${sg('v',gv,[['g','Garis'],['b','Batang']])}</span></div>
  <p class="mut" style="margin:8px 0 4px">Total ${rp(tot)} · <span style="color:var(--warn);font-weight:600">- - -</span> rata-rata ${rp(avg)}/hari</p>
  <svg viewBox="0 0 ${W} 176" width="100%" role="img" aria-label="Grafik">${chart}</svg>
  <div class="gd"><b>${new Date(days[sel]).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'short'})}</b><span>${nc[sel]} order · Nilai order ${rp(no[sel])} · Uang masuk ${rp(um[sel])}</span></div>`}
function foot(){const p=S.pm||{},m=(S.nama.match(/[A-Za-z0-9]/)||['L'])[0].toUpperCase();
  const ic={a:'<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',j:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',i:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>'};
  const li=(k,v)=>v?`<li><svg viewBox="0 0 24 24">${ic[k]}</svg><span>${esc(v)}</span></li>`:'';
  return `<footer class="ft">${S.logo?`<img class="lg lgs" src="${esc(S.logo)}" alt="">`:`<div class="mono">${esc(m)}</div>`}<div class="fn">${esc(S.nama)}</div>${p.nama?`<div class="fo">Pemilik · ${esc(p.nama)}</div>`:''}
  <ul class="fi">${li('a',p.alamat)}${li('j',p.jam)}${li('i',p.ig)}</ul><div class="fcp">© ${new Date().getFullYear()} ${esc(S.nama)}</div></footer>`}
function csBtn(o){const p=S.pm||{};if(!p.cs)return '';
  return `<a class="fab" aria-label="Hubungi CS" title="Hubungi CS" target="_blank" rel="noopener" href="https://wa.me/${nomor(p.cs)}?text=${encodeURIComponent('Halo '+S.nama+', saya mau tanya'+(o?' soal Nota '+nn(o)+' a.n. '+o.nama:'')+'.')}"><svg viewBox="0 0 24 24" width="30" height="30" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.2 14.8l-.4-.2-2.6.7.7-2.5-.2-.4A8 8 0 0 1 12 4zm-3 4c-.3 0-.7.1-1 .5s-1 1-1 2.4 1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5 0 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.7-.4l-1.8-.9c-.3-.1-.5-.1-.7.2l-.8 1c-.1.2-.3.2-.6.1-.9-.4-1.8-1-2.5-1.8-.6-.7-1-1.4-1.1-1.7-.1-.3 0-.4.2-.6l.5-.6c.1-.2.2-.4.3-.6 0-.2 0-.4 0-.5l-.8-2c-.2-.5-.4-.5-.6-.5z"/></svg></a>`}
function cocok(o){if(!q)return true;const d=dig(q);return o.nama.toLowerCase().includes(q)||String(o.id)===q.replace('#','')||(d.length>=3&&dig(o.wa).includes(d))}
let OF={st:[],by:[],pr:'',pj:'',jt:[]},OFd=null;
const OFS=[['0','Diterima'],['1','Diproses'],['2','Selesai'],['3','Diambil'],['4','Dibatalkan'],['telat','Terlambat']],OFB=[['lunas','Lunas'],['dp','DP'],['belum','Belum bayar'],['hutang','Hutang (sudah diambil)']],OFP=[['h','Hari ini'],['w','7 hari'],['m','Bulan ini']],OFJ=[['jem','Jemput'],['ant','Antar']];
function ofN(f){f=f||OF;return f.st.length+f.by.length+(f.pr?1:0)+(f.pj?1:0)+f.jt.length}
function ofByr(o){if(o.st===4)return 'batal';const s=tagih(o);return s<=0?'lunas':o.st===3?'hutang':o.bayar==='DP'?'dp':'belum'}
function ofMatch(o){if(OF.st.length&&!OF.st.some(k=>k==='telat'?FL.telat(o):o.st===+k))return false;if(OF.by.length&&!OF.by.includes(ofByr(o)))return false;
  if(OF.pr){const n=new Date(),d0=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(),f=OF.pr==='h'?d0:OF.pr==='w'?d0-6*864e5:new Date(n.getFullYear(),n.getMonth(),1).getTime();if(o.masuk<f)return false}
  if(OF.pj&&(o.pj||'Admin')!==OF.pj)return false;if(OF.jt.length&&!OF.jt.some(k=>k==='jem'?o.jem:o.ant))return false;return true}
function ofSumm(){const a=[];OF.st.forEach(k=>a.push((OFS.find(x=>x[0]===k)||[])[1]));OF.by.forEach(k=>a.push((OFB.find(x=>x[0]===k)||[])[1]));if(OF.pr)a.push((OFP.find(x=>x[0]===OF.pr)||[])[1]);if(OF.pj)a.push('PJ: '+OF.pj);OF.jt.forEach(k=>a.push((OFJ.find(x=>x[0]===k)||[])[1]));return a.filter(Boolean).map(x=>`<span class="chip">${esc(x)}</span>`).join(' ')}
function closeOf(){const e=document.getElementById('of');if(e)e.remove()}
function ofIn(){const c=(g,L,k,one)=>L.map(([v,l])=>{const on=one?OFd[k]===v:OFd[k].includes(v);return `<button class="fc ${on?'on':''}" onclick="ofT('${k}','${v}',${one?1:0})">${l}</button>`}).join('');
  const pj=['Admin',...(S.kar||[]).filter(k=>k.on!==0).map(k=>k.n)];
  return `<div class="kth">STATUS ORDER</div><div class="fcs">${c('st',OFS,'st')}</div><div class="kth">PEMBAYARAN</div><div class="fcs">${c('by',OFB,'by')}</div><div class="kth">TANGGAL MASUK</div><div class="fcs">${c('pr',OFP,'pr',1)}</div><div class="kth">PENANGGUNG JAWAB</div><select onchange="OFd.pj=this.value"><option value="">Semua</option>${pj.map(n=>`<option ${OFd.pj===n?'selected':''}>${esc(n)}</option>`).join('')}</select><div class="kth">PENGANTARAN</div><div class="fcs">${c('jt',OFJ,'jt')}</div>`}
function ofT(k,v,one){if(one)OFd[k]=OFd[k]===v?'':v;else{const a=OFd[k],i=a.indexOf(v);i<0?a.push(v):a.splice(i,1)}const e=$('#ofb');if(e)e.innerHTML=ofIn();ofFoot()}
function ofFoot(){const b=$('#ofa');if(b)b.textContent=ofN(OFd)?'Terapkan ('+ofN(OFd)+')':'Terapkan'}
function openOf(){closeOf();OFd=JSON.parse(JSON.stringify(OF));$('#app').insertAdjacentHTML('beforeend',`<div class="ov hi mr" id="of" onclick="if(event.target===this)closeOf()"><div class="bs" style="max-height:90vh;overflow:auto"><div class="grip"></div><div class="row" style="margin:8px 0 0"><b style="font-size:18px">Filter Order</b><button class="bk" onclick="closeOf()" aria-label="Tutup">×</button></div><div id="ofb">${ofIn()}</div><div class="row" style="gap:10px;margin-top:16px"><button class="b g" style="flex:1;margin:0" onclick="OFd={st:[],by:[],pr:'',pj:'',jt:[]};$('#ofb').innerHTML=ofIn();ofFoot()">Reset</button><button class="b" id="ofa" style="flex:2;margin:0" onclick="OF=OFd;closeOf();draw()">Terapkan</button></div></div></div>`);ofFoot()}
function ofClear(){OF={st:[],by:[],pr:'',pj:'',jt:[]};draw()}
function lst(){
  if(ofN()){const a=S.orders.filter(o=>ofMatch(o)&&(!q||cocok(o))).slice().reverse();return `<div class="row full" style="margin:0 0 6px"><b>Hasil filter (${a.length})</b><button class="b g" style="margin:0;padding:6px 12px" onclick="ofClear()">Hapus filter</button></div><div style="margin:0 0 8px">${ofSumm()}</div>`+(a.length?a.map(card).join(''):'<div class="card mut">Tidak ada order yang cocok.</div>')}
  if(fl&&!q){const a=S.orders.filter(FL[fl]).sort((x,y)=>x.est-y.est);
    return `<div class="row full" style="margin:0 0 8px"><b>${FLN[fl]} (${a.length})</b><button class="b g" style="margin:0;padding:6px 12px" onclick="fl='';draw()">Hapus filter</button></div>`+(a.length?a.map(card).join(''):'<div class="card mut">Tidak ada.</div>')}
  if(q){const a=S.orders.filter(cocok).reverse();return a.length?a.map(card).join(''):'<div class="card mut">Tidak ditemukan.</div>'}
  if(tab==='pend'){const a=S.orders.filter(o=>o.st<3).sort((x,y)=>x.est-y.est);return remind()+(a.length?a.map(card).join(''):'<div class="card mut">Tidak ada cucian pending.</div>')}
  const a=S.orders.filter(o=>o.st>=3).reverse();return a.length?a.map(card).join(''):'<div class="card mut">Belum ada riwayat.</div>'}
function cariAdm(v){q=v.trim().toLowerCase();$('#lst').innerHTML=lst()}
function edit(id){ed=id;delId=null;tab='baru';draw();window.scrollTo(0,0)}
function batalEd(){ed=null;tab='pend';draw()}
function batalOpen(id){const o=S.orders.find(x=>x.id===id);if(!o||o.st===4)return;const e=document.getElementById('bt');if(e)e.remove();
  $('#app').insertAdjacentHTML('beforeend',`<div class="ov hi" id="bt"><div class="md" style="text-align:left"><h2>Batalkan ${esc(nn(o))}?</h2><p class="mut">Pesanan ditandai Dibatalkan, tidak dihapus. Pembayaran yang sudah masuk dicatat sebagai pengembalian, dan saldo atau voucher yang dipakai dikembalikan.</p><label>Alasan (wajib)</label><textarea id="btr" placeholder="mis. pelanggan membatalkan"></textarea><div class="row" style="gap:10px;margin-top:12px"><button class="b g" style="flex:1;margin:0" onclick="document.getElementById('bt').remove()">Kembali</button><button class="b" style="flex:1;margin:0;background:var(--bad)" onclick="batalGo(${id})">Batalkan Pesanan</button></div></div></div>`)}
function batalGo(id){const o=S.orders.find(x=>x.id===id),r=(($('#btr')||{}).value||'').trim();if(!o||o.st===4)return;if(r.length<3){toast('Isi alasan pembatalan');return}
  stokGeser(items(o),1);const by=me()||'Admin',t=Date.now(),k=nw(o.wa);o.pay=o.pay||legacy(o);const net={};o.pay.forEach(p=>{net[p.m]=(net[p.m]||0)+p.a});
  Object.entries(net).forEach(([m,a])=>{if(a>0){o.pay.push({t,a:-a,m,n:'Pembatalan: '+r,by});if(m==='Saldo'){S.sal=S.sal||{};S.sal[k]=(S.sal[k]||0)+a}}});
  if(o.vc){S.vc=S.vc||{};S.vc[k]=(S.vc[k]||0)+o.vc}
  sync(o);o.batal={t,by,alasan:r};o.st=4;(o.log=o.log||[]).push({t,s:4,by});aud('Batalkan',o,r);save()}
function aud(a,o,x){const L=S.al=S.al||[];L.push({t:Date.now(),by:me()||'Admin',a,n:o?nn(o):'',x:x||''});if(L.length>600)L.splice(0,L.length-600)}

function isiEdit(){const o=S.orders.find(x=>x.id===ed);if(!o){ed=null;return}
  ln=items(o).map(x=>({sv:x.sv,qty:x.qty,hs:x.hs,c:x.c||'',jp:x.jp||0}));feT=true;
  $('#fn').value=o.nama;$('#fw').value=isTw(o.wa)?'':o.wa;dman=o.disk||0;dsel=[];vcOn=0;$('#fc').value=o.cat||'';$('#fe').value=toLoc(o.est);$('#fj').value=o.jb||'';tg('tjem',o.jem);tg('tant',o.ant);$('#fa').value=o.alm||'';$('#fjm').value=o.jj?toLoc(o.jj):'';$('#fan').value=o.ja?toLoc(o.ja):'';
  const fp=$('#fp');if(fp&&[...fp.options].some(x=>x.value===o.pj))fp.value=o.pj;drawLines()}
function ban(){return S.info?`<div class="ann"><svg viewBox="0 0 24 24"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/></svg><span>${esc(S.info)}</span></div>`:''}
function cf(){return '<div class="cfw">'+Array.from({length:16},(_,i)=>`<i class="cf" style="left:${(i*6.3+3)%100}%;background:${['#1e9e5a','#f5b301','#e8505b','#1a73c8','#8e5bd9'][i%5]};animation-delay:${(i%6)*.15}s"></i>`).join('')+'</div>'}
function setWarna(c){bacaSv();S.warna=c;document.documentElement.style.setProperty('--pri',c);draw()}
function hapusLogo(){ask('Hapus logo laundry?',()=>hapusLogo2(),'Hapus')}
function hapusLogo2(){bacaSv();S.logo='';draw()}
function logoUp(inp){if(!(inp.files&&inp.files[0]))return;if(S.logo)ask('Ganti logo lama dengan gambar baru?',()=>logoUp2(inp),'Ganti');else logoUp2(inp)}
function logoUp2(inp){const f=inp.files&&inp.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=192;const g=c.getContext('2d'),k=Math.min(180/im.width,180/im.height),w=im.width*k,h=im.height*k;
    g.fillStyle='#fff';g.fillRect(0,0,192,192);g.drawImage(im,(192-w)/2,(192-h)/2,w,h);
    let u=c.toDataURL('image/webp',.85);if(u.indexOf('data:image/webp')!==0)u=c.toDataURL('image/jpeg',.85);
    bacaSv();S.logo=u;draw();toast('Logo siap, tekan Simpan')};im.onerror=()=>toast('Gambar tidak bisa dibaca');im.src=r.result};r.readAsDataURL(f)}
function promoUp(inp){const f=inp.files&&inp.files[0];if(!f)return;if((S.promo||[]).length>=4){toast('Maksimal 4 foto');return}
  const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const W=560,H=245,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),k=Math.max(W/im.width,H/im.height),w=im.width*k,h=im.height*k;
    g.fillStyle='#fff';g.fillRect(0,0,W,H);g.drawImage(im,(W-w)/2,(H-h)/2,w,h);
    let u=c.toDataURL('image/webp',.65);if(u.indexOf('data:image/webp')!==0)u=c.toDataURL('image/jpeg',.65);
    bacaSv();S.promo=(S.promo||[]).concat(u);(S.pj=S.pj||[])[S.promo.length-1]='';draw();toast('Banner ditambahkan, tekan Simpan')};im.onerror=()=>toast('Gambar tidak bisa dibaca');im.src=r.result};r.readAsDataURL(f)}
function hapusPromo(i){ask('Hapus foto banner ini?',()=>hapusPromo2(i),'Hapus')}
function hapusPromo2(i){bacaSv();S.promo.splice(i,1);(S.pj||[]).splice(i,1);draw()}
function tagih(o){if(o.st===4)return 0;return o.total-(o.bayar==='Lunas'?o.total:o.bayar==='DP'?o.dp:0)}
function crc16(s){let c=0xFFFF;for(let i=0;i<s.length;i++){c^=s.charCodeAt(i)<<8;for(let k=0;k<8;k++)c=(c&0x8000)?((c<<1)^0x1021):(c<<1);c&=0xFFFF}return c.toString(16).toUpperCase().padStart(4,'0')}
function refOf(o){return nn(o).replace(/[^A-Za-z0-9]/g,'').slice(0,25)}
function qrisAmt(raw,amt,ref){
  let s=String(raw||'').replace(/[\r\n\t]+/g,'').trim();if(s.length<30||s.slice(-8,-4)!=='6304')return null;
  s=s.slice(0,-8);const tl=[];let i=0;
  while(i<s.length){const g=s.substr(i,2),n=parseInt(s.substr(i+2,2),10);if(isNaN(n))return null;tl.push([g,s.substr(i+4,n)]);i+=4+n}
  if(i!==s.length||!(amt>0))return null;
  const a=String(Math.round(amt)),out=[];let ins=false,t62='';
  for(const [g,v] of tl){if(g==='54')continue;if(g==='62'){t62=v;continue}if(g==='01'){out.push([g,'12']);continue}if(!ins&&+g>54){out.push(['54',a]);ins=true}out.push([g,v])}
  if(!ins)out.push(['54',a]);
  if(ref){const sub=[];let k=0;while(k<t62.length){const g=t62.substr(k,2),n=parseInt(t62.substr(k+2,2),10);if(isNaN(n))break;if(g!=='05')sub.push([g,t62.substr(k+4,n)]);k+=4+n}sub.push(['05',String(ref).slice(0,25)]);t62=sub.map(([g,v])=>g+String(v.length).padStart(2,'0')+v).join('')}
  if(t62){const at=out.findIndex(([g])=>+g>62),e=['62',t62];if(at<0)out.push(e);else out.splice(at,0,e)}
  const b=out.map(([g,v])=>g+String(v.length).padStart(2,'0')+v).join('')+'6304';return b+crc16(b)}
function qrSvg(txt,px){try{const q=qrcode(0,'M');q.addData(txt);q.make();const n=q.getModuleCount();let d='';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+=`M${c} ${r}h1v1h-1z`;
  return `<svg viewBox="-2 -2 ${n+4} ${n+4}" width="${px}" height="${px}" shape-rendering="crispEdges" style="background:#fff;border-radius:12px;max-width:100%"><path d="${d}" fill="#000"/></svg>`}catch(e){return '<p class="mut">QR tidak bisa dibuat.</p>'}}
function qrDraw(g,txt,x,y,sz){const q=qrcode(0,'M');q.addData(txt);q.make();const n=q.getModuleCount(),s=Math.floor(sz/(n+4))||1;
  g.fillStyle='#fff';g.fillRect(x,y,s*(n+4),s*(n+4));g.fillStyle='#000';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))g.fillRect(x+(c+2)*s,y+(r+2)*s,s,s);return s*(n+4)}
function qrisOn(o){return !!S.qris&&tagih(o)>0&&typeof qrcode==='function'&&!!qrisAmt(S.qris,tagih(o))}
function qrisSt(){if(!S.qris)return '<p class="mut">Belum diisi. Fitur QRIS tidak tampil sebelum diisi.</p>';
  const p=qrisAmt(S.qris,1000);if(!p)return '<p style="color:var(--bad)">Teks QRIS tidak valid. Pastikan hasil scan disalin utuh.</p>';
  return `<p style="color:var(--ok)">✓ QRIS terbaca: <b>${esc(qrisInfo(S.qris).nm)}</b> ${esc(qrisInfo(S.qris).kt)}. Contoh QR Rp1.000 untuk uji coba:</p><div style="text-align:center">${qrSvg(p,170)}</div>`}
function qrCard(o){const tg=tagih(o);if(!S.qris||tg<=0||typeof qrcode!=='function')return '';const p=qrisAmt(S.qris,tg,refOf(o));if(!p)return '';
  return `<div class="card" style="text-align:center"><h2>Bayar via QRIS</h2>${qrSvg(p,220)}<p style="font-size:20px;margin:8px 0"><b>${rp(tg)}</b></p><p class="mut">Scan dengan e-wallet atau m-banking</p></div>`}
const VC=['var(--pri)','#f59e0b','#10b981','#8b5cf6','#ef4444','#06b6d4'];
function donut(parts){const t=parts.reduce((s,x)=>s+x.v,0),r=40,C2=2*Math.PI*r;let off=0;
  const sg=t>0?parts.filter(x=>x.v>0).map(x=>{const len=x.v/t*C2,s=`<circle cx="60" cy="60" r="${r}" fill="none" stroke="${x.c}" stroke-width="16" stroke-dasharray="${len.toFixed(2)} ${(C2-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 60 60)"/>`;off+=len;return s}).join(''):`<circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--bd)" stroke-width="16"/>`;
  return `<svg viewBox="0 0 120 120" width="124" height="124" style="flex:none" role="img" aria-label="Diagram metode bayar">${sg}<text x="60" y="57" text-anchor="middle" font-size="10.5" fill="var(--mut)">Total</text><text x="60" y="73" text-anchor="middle" font-size="14" font-weight="800" fill="var(--tx)">${fRb(t)}</text></svg>`}
function hbars(rows){const mx=Math.max(...rows.map(r=>r.v),1);return rows.map((r,i)=>`<div class="hb"><div class="hbt"><span>${esc(r.l)}</span><b>${r.t}</b></div><div class="hbb"><i style="width:${Math.max(r.v?4:0,r.v/mx*100)}%;background:${VC[i%VC.length]}"></i></div></div>`).join('')}
function jamCard(a){if(!a.length)return '';const h=Array(24).fill(0);a.forEach(o=>h[new Date(o.masuk).getHours()]++);const mx=Math.max(...h),bi=h.indexOf(mx),W=360,bw=W/24;
  return `<div class="card"><h2>Jam tersibuk</h2><svg viewBox="0 0 ${W} 84" width="100%" role="img" aria-label="Order per jam">${h.map((v,i)=>{const bh=v?Math.max(4,v/mx*56):2;return `<rect x="${i*bw+2}" y="${64-bh}" width="${bw-4}" height="${bh}" rx="3" fill="var(--pri)" opacity="${i===bi?1:.35}"/>`}).join('')}${[0,6,12,18,23].map(i=>`<text x="${i*bw+bw/2}" y="80" font-size="10" text-anchor="middle" fill="var(--mut)">${String(i).padStart(2,'0')}</text>`).join('')}</svg><p class="mut" style="margin:6px 0 0">Paling ramai sekitar pukul <b style="color:var(--tx)">${String(bi).padStart(2,'0')}.00</b> (${mx} order)</p></div>`}
function metCard(a,from){const m={Tunai:0,Transfer:0,QRIS:0},sd=[0];
  S.orders.forEach(o=>{if(o.pay){o.pay.forEach(p=>{if(p.t>=from){if(p.m==='Saldo')sd[0]+=p.a;else m[p.m]=(m[p.m]||0)+p.a}})}else if(o.masuk>=from){const v=o.bayar==='Lunas'?o.total:o.bayar==='DP'?o.dp:0;if(v)m[o.met||'Tunai']=(m[o.met||'Tunai']||0)+v}});
  (S.tu||[]).forEach(x=>{if(x.t>=from)m[x.m]=(m[x.m]||0)+x.a});
  const ps=Object.entries(m).map(([k,v],i)=>({l:k,v,c:VC[i%VC.length]})),tt=ps.reduce((s,x)=>s+x.v,0);
  return `<div class="card"><h2>Uang masuk per metode</h2><div class="dn">${donut(ps)}<div class="dnl">${ps.map(x=>`<div class="lgr"><span><i class="dot" style="background:${x.c}"></i>${esc(x.l)}${tt?` <span class="mut">${Math.round(x.v/tt*100)}%</span>`:''}</span><b>${rp(x.v)}</b></div>`).join('')}</div></div>${sd[0]?`<div class="row"><span class="mut">Dibayar dari saldo</span><span class="mut">${rp(sd[0])}</span></div>`:''}<p class="mut" style="margin:8px 0 0">Termasuk isi saldo pelanggan.</p></div>`}
function bkOld(){try{const v=+localStorage.getItem('bk');return !v||Date.now()-v>7*864e5}catch(e){return false}}
function hari(i){bacaSv();const o=S.ops=S.ops||{b:'',t:'',h:[1,2,3,4,5,6]};if(!o.h)o.h=[1,2,3,4,5,6];const k=o.h.indexOf(i);k<0?o.h.push(i):o.h.splice(k,1);draw()}
function opsBadge(){const o=S.ops;if(!o||!o.b||!o.t)return '';
  const n=new Date(),hm=n.getHours()*60+n.getMinutes(),m=s=>{const x=s.split(':');return +x[0]*60+ +x[1]},H=o.h||[1,2,3,4,5,6],D=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  let on=0,tx='Tutup';
  if(H.includes(n.getDay())&&hm>=m(o.b)&&hm<m(o.t)){on=1;tx='Buka sekarang · tutup '+o.t}
  else for(let k=0;k<8;k++){const d=(n.getDay()+k)%7;if(H.includes(d)&&!(k===0&&hm>=m(o.b))){tx='Tutup · buka '+(k===0?'hari ini':k===1?'besok':D[d])+' '+o.b;break}}
  return `<div class="bd2 ${on?'on':''}"><i></i>${esc(tx)}</div>`}
function shareUrl(){return 'https://wa.me/?text='+encodeURIComponent('Cuci di '+S.nama+': bisa dilacak online dan ada poin member. '+(S.base||''))}
function faqH(){const a=(S.faq||'').split('\n').map(l=>l.split('|')).filter(x=>x.length>1&&x[0].trim());if(!a.length)return '';
  return '<h2 style="margin:18px 0 6px">Pertanyaan umum</h2>'+a.map(x=>`<details><summary>${esc(x[0].trim())}</summary><p>${esc(x.slice(1).join('|').trim())}</p></details>`).join('')}
function hitK(){const s=$('#ks'),r=$('#kr');if(!s||!r)return;const v=SV[s.value],q=numIn($('#kq').value);
  r.innerHTML=!v.h?'<span class="mut">Harga ditentukan setelah barang dicek.</span>':q>0?`Perkiraan biaya <b>${rp(Math.round(q*v.h))}</b> · selesai ${durTxt(v.j)}`:'<span class="mut">Masukkan jumlah untuk melihat perkiraan.</span>'}
const TT={home:'',pend:'Order',baru:'Order Baru',pel:'Pelanggan',lap:'Laporan',set:'Pengaturan',dat:'Pusat Data',det:'Detail Pesanan',hut:'Bayar Hutang'};
function admNav(){const all=[['home','Beranda'],['pend','Order'],['baru','Baru'],['pel','Pelanggan'],['lap','Laporan'],['set','Atur']].filter(x=>owner()||(x[0]!=='lap'&&x[0]!=='set')),act=k=>tab===k||(k==='pend'&&(tab==='riw'||tab==='det'))||(k==='set'&&tab==='dat')||(k==='pel'&&tab==='hut');
  return `<nav class="nv adm">${all.map(([k,l])=>`<button class="${act(k)?'on':''}${k==='baru'?' plus':''}" onclick="nvA('${k}')" aria-label="${l}">${svg(k)}<span>${l}</span></button>`).join('')}</nav>`}
function nvA(k){mnId=null;if(k==='baru'){ln=[];feT=false;vcOn=0;dsel=[];dman=0;cuSelWa=''}if(!owner()&&(k==='lap'||k==='set'||k==='dat'))return;tab=k;ed=null;delId=null;q='';fl='';draw();try{window.scrollTo(0,0)}catch(e){}}
function seg(){return `<div class="seg"><button class="${tab==='pend'?'on':''}" onclick="tab='pend';q='';fl='';draw()">Pending</button><button class="${tab==='riw'?'on':''}" onclick="tab='riw';q='';fl='';draw()">Riwayat</button></div>`}
function uangMasuk(a,b){let s=0;S.orders.forEach(o=>(o.pay||legacy(o)).forEach(p=>{if(p.t>=a&&p.t<b&&p.m!=='Saldo')s+=p.a}));(S.tu||[]).forEach(x=>{if(x.t>=a&&x.t<b&&x.m!=='Saldo')s+=x.a});return s}
function nilaiOrder(a,b){return S.orders.filter(o=>o.st!==4&&o.masuk>=a&&o.masuk<b).reduce((s,o)=>s+o.total,0)}
function dDash(){
  const n=new Date(),d0=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(),O=S.orders.filter(o=>o.st!==4);
  const hari=O.filter(o=>o.masuk>=d0),proses=O.filter(o=>o.st<2),siap=O.filter(o=>o.st===2),telat=O.filter(o=>o.st<2&&o.est<Date.now());
  const omz=hari.reduce((s,o)=>s+o.total,0),jm=n.getHours(),sal=jm<11?'Selamat pagi':jm<15?'Selamat siang':jm<18?'Selamat sore':'Selamat malam';
  const masuk=uangMasuk(d0,d0+864e5),belum=S.orders.filter(o=>o.st<4).reduce((s,o)=>s+Math.max(0,tagih(o)),0);
  const tile=(l,v,c,k,h)=>`<div class="st2${h?' hi':''}" style="--c:${c}" onclick="${k}"><small>${l}</small><b>${v}</b></div>`;
  const done=hari.filter(o=>o.st>=2).length,pct=hari.length?Math.round(done/hari.length*100):0,msg=telat.length?`Ada ${telat.length} cucian terlambat. Yuk kejar dulu!`:siap.length?`${siap.length} cucian siap diambil. Kabari pelanggannya ya.`:proses.length?`${proses.length} cucian sedang diproses. Semangat!`:hari.length?'Semua beres. Kerja bagus hari ini!':'Belum ada order hari ini. Yuk mulai!';
  const pc=[['Antrian',O.filter(FL.antri).length,'#3b82f6'],['Proses',O.filter(FL.proses).length,'#f59e0b'],['Siap ambil',O.filter(FL.siap).length,'#10b981']],pt=pc.reduce((s,x)=>s+x[1],0),pipe=pt?`<div class="pipe">${pc.filter(x=>x[1]).map(x=>`<i style="flex:${x[1]};background:${x[2]}" title="${x[0]}: ${x[1]}"></i>`).join('')}</div>`:'';
  const rw=(o,c,tx,act)=>`<div class="row" style="padding:5px 0"><span><span class="dot" style="background:${c}"></span>${nn(o)} ${esc(o.nama)} <span class="mut">${tx}</span></span>${act}</div>`;
  const kp=owner()?[['Omzet hari ini',rp(omz),"nvA('lap')",''],['Order hari ini',hari.length,"nvA('pend')",''],['Uang masuk hari ini',rp(masuk),"nvA('lap')",''],['Belum lunas',rp(belum),"nvH()",belum?'var(--bad)':'']]:[['Order saya hari ini',hari.filter(o=>o.pj===me()).length,"nvA('pend')",''],['Order hari ini',hari.length,"nvA('pend')",''],['Belum lunas',rp(belum),"nvH()",belum?'var(--bad)':'']];
  const kp2=kp.filter(x=>x[0]!=='Order hari ini'),logo=S.logo?`<img class="lg lgs" style="margin:0;width:38px;height:38px;flex:none" src="${esc(S.logo)}" alt="">`:'';
  const ico=(c,k,l,act,bd)=>`<button class="gi" style="--c:${c}" onclick="${act}"><span class="gic">${svg(k)}${bd?`<i class="bdg">${bd}</i>`:''}</span><span>${l}</span></button>`;
  const hutN=hutList().length,pend=O.filter(o=>o.st<3).length;
  const menu=[ico('#2f7de1','baru','Order Baru',"nvA('baru')"),ico('#0e9aa7','pend','Order',"nvA('pend')",pend||''),ico('#f08a24','toko','Jual',"jualOpen()"),ico('#7c5cd6','pel','Pelanggan',"nvA('pel')"),ico('#d64545','harga','Hutang',"nvH()",hutN||''),ico('#1e9e5a','lap','Laporan',"nvA('lap')"),...(owner()?[`<a class="gi" style="--c:#d6548e" target="_blank" rel="noopener" href="${rekapUrl()}"><span class="gic">${svg('share')}</span><span>Rekap</span></a>`,ico('#5b6b82','info','Data',"nvA('dat')")]:[])].join('');
  const sc=[['antri','Antrian','#3b82f6'],['proses','Proses','#f59e0b'],['siap','Siap Ambil','#10b981'],['antar','Siap Antar','#8b5cf6'],['dead','Deadline','#f97316'],['telat','Terlambat','#ef4444']];
  return `<div class="ah"><div class="ahr"><div class="hdl">${logo}<div><small>${n.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'})}</small><b>${esc(S.nama)}</b></div></div><div class="hdr">${thSw()}<button class="lgb" style="margin:0" onclick="askOut()">Keluar</button></div></div><div class="ahs">${sal}${me()?', '+esc(me()):''}. ${msg}</div></div>
  <div class="sm" style="--n:${kp2.length}">${kp2.map(([l,v,k,c])=>`<div class="smc" onclick="${k}"><small>${l}</small><b${c?` style="color:${c}"`:''}>${v}</b></div>`).join('')}${hari.length?`<div class="smp"><div class="hpl"><span>Selesai hari ini</span><b>${done} dari ${hari.length} order</b></div><div class="bar2"><i style="width:${pct}%"></i></div></div>`:''}</div>
  <div class="gp ag">${menu}</div>
  <div class="sh"><h2 style="margin:0">Status order</h2><a onclick="nvA('pend')">Lihat semua</a></div>
  <div class="chs">${sc.map(([k,l,c])=>{const n2=O.filter(FL[k]).length;return `<button class="ch2${n2?'':' z'}" style="--c:${c}" onclick="flt('${k}')"><i></i>${l}<b>${n2}</b></button>`}).join('')}</div>
  <div class="gr">${stokCard()}${kirimCard()}${(telat.length||siap.length)?`<div class="card"><h2>Perlu perhatian</h2>${telat.slice(0,4).map(o=>rw(o,'var(--bad)','terlambat',`<button class="b g" style="margin:0;padding:6px 12px" onclick="adv(${o.id})">→ ${ST[o.st+1]}</button>`)).join('')}${siap.slice(0,4).map(o=>rw(o,'var(--ok)','siap diambil',`<a class="b g" style="margin:0;padding:6px 12px" target="_blank" rel="noopener" href="${wr(o)}">Ingatkan</a>`)).join('')}</div>`:''}${grafik()}</div>`}
function revUrl(){const v=String(S.rev||'').trim();if(/^https:\/\//i.test(v))return v;if(/^ChIJ[\w-]{10,}$/.test(v))return 'https://search.google.com/local/writereview?placeid='+encodeURIComponent(v);return ''}
function revCard(){const u=revUrl();if(!u)return '';
  return `<div class="card" style="text-align:center"><h2>Bagaimana layanan kami?</h2><p class="mut">Ketuk bintang untuk menulis ulasan di Google Maps</p><div class="stars">${[1,2,3,4,5].map(n=>`<a target="_blank" rel="noopener" href="${esc(u)}" aria-label="${n} bintang">★</a>`).join('')}</div></div>`}
function qrisInfo(raw){const o={};try{const s=String(raw).slice(0,-8);let i=0;while(i<s.length){const g=s.substr(i,2),n=parseInt(s.substr(i+2,2),10);if(isNaN(n))break;o[g]=s.substr(i+4,n);i+=4+n}}catch(e){}return {nm:o['59']||'',kt:o['60']||''}}
async function decodeImg(file){
  const url=URL.createObjectURL(file),im=new Image();
  try{await new Promise((r,j)=>{im.onload=r;im.onerror=j;im.src=url});
    if('BarcodeDetector' in window){try{const r=await new BarcodeDetector({formats:['qr_code']}).detect(im);if(r&&r[0]&&r[0].rawValue)return r[0].rawValue}catch(e){}}
    if(typeof jsQR!=='function')return null;
    const mx=Math.max(im.width,im.height);
    for(const W of [Math.min(mx,1400),1000,700,500,1800]){const k=W/mx,w=Math.max(1,Math.round(im.width*k)),h=Math.max(1,Math.round(im.height*k)),c=document.createElement('canvas');c.width=w;c.height=h;
      const g=c.getContext('2d',{willReadFrequently:true});g.fillStyle='#fff';g.fillRect(0,0,w,h);g.drawImage(im,0,0,w,h);
      const r=jsQR(g.getImageData(0,0,w,h).data,w,h,{inversionAttempts:'attemptBoth'});if(r&&r.data)return r.data}
    return null}catch(e){return null}finally{URL.revokeObjectURL(url)}}
async function qrisUp(inp){const f=inp.files&&inp.files[0];if(!f)return;toast('Membaca gambar...');
  const txt=await decodeImg(f);
  if(!txt){toast('QR tidak terbaca. Pakai gambar yang lebih tajam, atau tempel teks manual.');return}
  const t2=String(txt).replace(/[\r\n\t]+/g,'').trim();
  if(!qrisAmt(t2,1000)){toast('QR terbaca, tetapi bukan QRIS yang valid.');return}
  bacaSv();S.qris=t2;draw();toast('QRIS terbaca. Tekan Simpan.')}
function hapusQris(){ask('Hapus QRIS? Pembayaran QRIS tidak akan tampil lagi.',()=>hapusQris2(),'Hapus')}
function hapusQris2(){bacaSv();S.qris='';draw()}
const FL={antar:o=>o.st===2&&o.ant,antri:o=>o.st===0,proses:o=>o.st===1,siap:o=>o.st===2,blm:o=>o.st<3&&tagih(o)>0,dead:o=>o.st<2&&o.est>Date.now()&&o.est-Date.now()<3*36e5,telat:o=>o.st<2&&o.est<Date.now()};
const FLN={antar:'Siap Antar',antri:'Antrian',proses:'Proses',siap:'Siap Ambil',blm:'Belum Lunas',dead:'Deadline (kurang 3 jam)',telat:'Terlambat'};
function flt(k){fl=k;tab='pend';q='';draw();try{window.scrollTo(0,0)}catch(e){}}
function pjOpts(){const m=me(),L=m?[m]:['Admin',...(S.kar||[]).filter(k=>k.on!==0).map(k=>k.n)];return L.map(n=>`<option${n===(m||'Admin')?' selected':''}>${esc(n)}</option>`).join('')}
function pjCard(a){const m={};a.forEach(o=>{const k=o.pj||'Tanpa PJ';(m[k]=m[k]||{c:0,t:0}).c++;m[k].t+=o.total});const r=Object.entries(m).sort((x,y)=>y[1].t-x[1].t).map(([k,v])=>({l:k,v:v.t,t:rp(v.t)+' · '+v.c+' order'}));
  return `<div class="card"><h2>Per karyawan</h2>${r.length?hbars(r):'<p class="mut">Belum ada data.</p>'}</div>`}
function tambahKar(){bacaSv();S.kar=S.kar||[];S.kar.push({n:'Karyawan '+(S.kar.length+1),pin:'',hp:'',jab:'',on:1});draw()}
function togKar(i){bacaSv();S.kar[i].on=S.kar[i].on===0?1:0;draw()}
function hapusKar(i){ask('Hapus karyawan '+((S.kar[i]||{}).n||'')+'?',()=>hapusKar2(i),'Hapus')}
function hapusKar2(i){bacaSv();S.kar.splice(i,1);draw()}
function togPop(){bacaSv();S.pop=Object.assign({},S.pop,{on:(S.pop&&S.pop.on)?0:1});draw()}
function hapusPp(){ask('Hapus poster promo?',()=>hapusPp2(),'Hapus')}
function hapusPp2(){bacaSv();S.pop=Object.assign({},S.pop,{img:''});draw()}
function prevPop(){const e=$('#pop');if(e)e.remove();$('#app').insertAdjacentHTML('beforeend',popHtml())}
function ppW(k){bacaSv();S.pop=Object.assign({},S.pop,{w:k});draw()}
function ppUp(inp){if(!(inp.files&&inp.files[0]))return;if(S.pop&&S.pop.img)ask('Ganti poster lama dengan gambar baru?',()=>ppUp2(inp),'Ganti');else ppUp2(inp)}
function ppUp2(inp){const f=inp.files&&inp.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,640/Math.max(im.width,im.height)),w=Math.round(im.width*k),h=Math.round(im.height*k),c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
    g.fillStyle='#fff';g.fillRect(0,0,w,h);g.drawImage(im,0,0,w,h);
    let u=c.toDataURL('image/webp',.7);if(u.indexOf('data:image/webp')!==0)u=c.toDataURL('image/jpeg',.7);
    bacaSv();S.pop=Object.assign({},S.pop,{img:u});draw();toast('Poster ditambahkan, tekan Simpan')};im.onerror=()=>toast('Gambar tidak bisa dibaca');im.src=r.result};r.readAsDataURL(f)}
function nowLocal(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)}
function legacy(o){const pd=o.bayar==='Lunas'?o.total:o.bayar==='DP'?(o.dp||0):0;return pd>0?[{t:o.masuk,a:pd,m:o.met||'Tunai',n:'Data awal',by:o.pj||'Admin'}]:[]}
function sync(o){const p=(o.pay||[]).reduce((s,x)=>s+x.a,0);o.bayar=p>=o.total?'Lunas':p>0?'DP':'Belum';o.dp=p>=o.total?(o.dp||0):p;const l=(o.pay||[]).filter(x=>x.m!=='Saldo').slice(-1)[0];if(l)o.met=l.m}
function payInit(id){const o=S.orders.find(x=>x.id===id);if(!o)return;pid=id;qpop=false;pm={tipe:'lunas',met:'Tunai',nom:String(tagih(o)),sal:0,cat:'',ts:nowLocal()}}
function payOpen(id){payInit(id);draw()}
function payBack(){if(newOid){payClose();return}pid=null;pm=null;qpop=false;draw()}
function payClose(sv){const n=newOid;pid=null;pm=null;qpop=false;if(n){newOid=null;okId=n;ss('ok',n);tab='pend';save();return}if(sv)save();else{tab='home';draw()}}
function payRem(o){const k=nw(o.wa),sl=(S.sal&&S.sal[k])||0;return Math.max(0,tagih(o)-(pm.sal?Math.min(sl,tagih(o)):0))}
function payRedraw(){const sh=document.getElementById('psh');if(!sh||!pid||!pm){draw();return}const tmp=document.createElement('div');tmp.innerHTML=payHtml();const n=tmp.firstElementChild;if(!n){draw();return}const st=sh.scrollTop;sh.innerHTML=n.innerHTML;sh.scrollTop=st;updKem()}
function setTipe(v){const o=S.orders.find(x=>x.id===pid);pm.tipe=v;pm.nom=v==='lunas'?String(payRem(o)):'';payRedraw()}
function setMet(m){pm.met=m;payRedraw()}
function togSal(){const o=S.orders.find(x=>x.id===pid);pm.sal=pm.sal?0:1;if(pm.tipe==='lunas')pm.nom=String(payRem(o));payRedraw()}
function nomIn(v){pm.nom=v;updKem()}
function nomSet(v){pm.nom=String(v);payRedraw()}
function updKem(){const o=S.orders.find(x=>x.id===pid),e=$('#kem');if(!o||!e||!pm)return;const n=+pm.nom||0,r=payRem(o);e.textContent=(pm.met==='Tunai'&&pm.tipe==='lunas'&&n>r)?'Kembalian '+rp(n-r):''}
function payConfirm(){const o=S.orders.find(x=>x.id===pid);if(!o)return;
  if(pm.tipe==='nanti'){payClose();return}
  if(pm.tipe==='kasbon'){o.kas=1;if(o.st<3){o.st=3;(o.log=o.log||[{t:o.masuk,s:0}]).push({t:Date.now(),s:3,by:me()||'Admin'});aud('Kasbon',o,rp(tagih(o)));if(!o.sel)o.sel=Date.now()}payClose(true);return}
  const rem=payRem(o),n=+pm.nom||0;
  if(pm.tipe==='lunas'&&n<rem){toast('Nominal kurang dari tagihan. Pilih Bayar DP kalau bayar sebagian.');return}
  if(pm.tipe==='dp'&&!(n>0)){toast('Isi nominal DP');return}
  if(pm.met==='QRIS'&&rem>0){if(!S.qris||!qrisAmt(S.qris,1000)){toast('QRIS belum diatur di tab Atur');return}qpop=true;payRedraw();return}
  payGo()}
function payGo(){const o=S.orders.find(x=>x.id===pid);if(!o)return;let rem=tagih(o);o.pay=o.pay||legacy(o);
  const k=nw(o.wa),by=me()||'Admin',ts=new Date(pm.ts).getTime()||Date.now();
  if(pm.sal){const sl=(S.sal&&S.sal[k])||0,cut=Math.min(sl,rem);if(cut>0){S.sal[k]=sl-cut;o.pay.push({t:ts,a:cut,m:'Saldo',n:'Potong saldo',by});rem-=cut}}
  if(rem>0){const n=+pm.nom||0,a=Math.min(n,rem);if(a>0)o.pay.push({t:ts,a,m:pm.met,n:pm.cat,by,rc:n,ref:pm.met==='QRIS'?(pm.ref||''):''})}
  sync(o);aud('Pembayaran',o,rp(o.total-tagih(o))+' terbayar via '+pm.met);payClose(true)}
function payQr(o){const n=Math.min(+pm.nom||0,payRem(o)),p=n>0&&typeof qrcode==='function'&&qrisAmt(S.qris,n,refOf(o));
  return `<div class="ov hi"><div class="md"><h2>Bayar via QRIS</h2><p class="mut">Nota ${nn(o)} · ${esc(o.nama)}</p>${p?qrSvg(p,260):'<p>QRIS belum bisa dibuat.</p>'}<p style="font-size:24px;margin:8px 0"><b>${rp(n)}</b></p><label style="text-align:left">4 digit referensi dari bukti bayar pelanggan</label><input id="pref" inputmode="numeric" maxlength="4" placeholder="mis. 1234" style="text-align:center;font-size:20px;letter-spacing:6px"><button class="b" style="width:100%" onclick="payQrOk()">Sudah Dibayar</button><button class="b g" style="width:100%" onclick="payClose()">Bayar Nanti</button></div></div>`}
function payQrOk(){const r=(($('#pref')||{}).value||'').replace(/\D/g,'');if(r.length!==4){toast('Isi 4 digit referensi dari bukti bayar');return}pm.ref=r;payGo()}
function payHtml(){if(!pid||!pm)return '';const o=S.orders.find(x=>x.id===pid);if(!o){pid=null;return ''}
  const tg=tagih(o),k=dig(o.wa),sl=(S.sal&&S.sal[k])||0,rem=payRem(o),tp=pm.tipe,showM=tp==='lunas'||tp==='dp';
  const ch=[['lunas','Bayar Lunas'],['dp','Bayar DP'],['nanti','Bayar Nanti']].concat(o.st>=2?[['kasbon','Kasbon (ambil dulu)']]:[]),hist=o.pay||legacy(o);
  return `<div class="sheet" id="psh"><div class="sin"><div class="hd2"><button class="bk" onclick="payBack()" aria-label="Kembali">←</button><h1 style="margin:0">Pembayaran</h1></div>${newOid?'<p class="mut" style="margin:0 0 10px">Pesanan disimpan setelah langkah ini.</p>':''}
  <div class="card"><div class="row"><div><b>Nota ${nn(o)}</b><div class="mut">${esc(o.nama)}</div></div><span class="mut">${esc(itemsTxt(o))}</span></div><div class="row" style="margin-top:10px;border-top:1px solid var(--bd);padding-top:10px"><span class="mut">Total Tagihan</span><b style="font-size:22px;color:var(--pri)">${rp(tg)}</b></div></div>
  <div class="card"><h2>Pilih Tipe Pembayaran</h2><div class="pgrid">${ch.map(([v,l])=>`<button class="pt2 ${tp===v?'on':''}" onclick="setTipe('${v}')">${l}</button>`).join('')}</div>${tp==='kasbon'?'<p class="mut" style="margin:10px 0 0">Cucian dicatat sudah diambil, sisa tagihan menjadi hutang pelanggan.</p>':''}</div>
  ${showM?`<div class="card"><h2>Metode Pembayaran</h2><div class="mt">${['Tunai','Transfer','QRIS'].map(m=>`<button class="${pm.met===m?'on':''}" onclick="setMet('${m}')">${m}</button>`).join('')}</div>
  <label>Nominal Bayar</label><input id="pnom" type="number" inputmode="numeric" value="${esc(pm.nom)}" oninput="nomIn(this.value)" style="font-size:22px;font-weight:700">
  <div class="mt" style="margin-top:8px"><button onclick="nomSet(${rem})">Pas ${rp(rem)}</button><button onclick="nomSet(50000)">Rp50.000</button><button onclick="nomSet(100000)">Rp100.000</button></div><p id="kem" style="color:var(--ok);font-weight:600;margin:8px 0 0"></p>
  ${sl>0?`<div class="row" style="margin-top:14px;padding:12px;border:1px solid var(--bd);border-radius:14px"><div><b>Gunakan Saldo sebagai Potongan</b><div class="mut">Saldo ${rp(sl)} · potong ${rp(pm.sal?Math.min(sl,tg):0)}</div></div><button class="tgl ${pm.sal?'on':''}" onclick="togSal()" aria-label="Gunakan saldo"></button></div>`:''}</div>`:''}
  <div class="card"><label style="margin-top:0">Catatan (opsional)</label><input value="${esc(pm.cat)}" oninput="pm.cat=this.value" placeholder="mis. DP 50%, sisa bayar saat ambil"><label>Tanggal &amp; jam bayar</label><input type="datetime-local" value="${esc(pm.ts)}" oninput="pm.ts=this.value"></div>
  ${hist.length?`<div class="card"><h2>Riwayat pembayaran</h2>${hist.map(x=>`<div class="row" style="padding:4px 0"><span class="mut">${fmt(x.t)} · ${esc(x.m)}</span><b>${rp(x.a)}</b></div>`).join('')}</div>`:''}</div>
  <div class="cta"><div class="sin"><button class="b" onclick="payConfirm()">${tp==='nanti'?(newOid?'Simpan Tanpa Bayar':'Bayar Nanti → Dasbor'):tp==='kasbon'?'Catat Kasbon':(pm.met==='QRIS'&&rem>0?'Tampilkan QRIS':'Konfirmasi Pembayaran')}</button></div></div>${qpop?payQr(o):''}</div>`}
function tuOpen(k){const c=pelList().find(x=>x.k===k);if(!c)return;tu={k,nama:c.nama,nom:'',met:'Tunai'};draw()}
function tuGo(){const n=+tu.nom||0;if(!(n>0)){toast('Isi nominal');return}let ref='';if(tu.met==='QRIS'){ref=(($('#tuRef')||{}).value||'').replace(/\D/g,'');if(ref.length!==4){toast('Isi 4 digit referensi bukti bayar');return}}
  S.sal=S.sal||{};S.sal[tu.k]=(S.sal[tu.k]||0)+n;S.tu=(S.tu||[]).concat({t:Date.now(),k:tu.k,a:n,m:tu.met,by:me()||'Admin',ref});aud('Isi saldo',null,rp(n)+' '+tu.met);tu=null;save()}
function tuHtml(){if(!tu)return '';const n=+tu.nom||0,p=tu.met==='QRIS'&&n>0&&typeof qrcode==='function'&&S.qris&&qrisAmt(S.qris,n);
  return `<div class="ov hi"><div class="md" style="text-align:left"><h2>Isi Saldo · ${esc(tu.nama)}</h2><label>Nominal</label><input type="number" inputmode="numeric" value="${esc(tu.nom)}" oninput="tu.nom=this.value" onchange="draw()" style="font-size:20px;font-weight:700"><div class="mt" style="margin:12px 0">${['Tunai','Transfer','QRIS'].map(m=>`<button class="${tu.met===m?'on':''}" onclick="tu.met='${m}';draw()">${m}</button>`).join('')}</div>${p?`<div style="text-align:center">${qrSvg(p,230)}</div>`:''}${tu.met==='QRIS'?'<label>4 digit referensi bukti bayar</label><input id="tuRef" inputmode="numeric" maxlength="4" placeholder="mis. 1234">':''}<button class="b" onclick="tuGo()">Uang Sudah Diterima</button><button class="b g" onclick="tu=null;draw()">Batal</button></div></div>`}
function applyTh(){try{const x=localStorage.getItem('th');if(x==='light'||x==='dark')document.documentElement.setAttribute('data-theme',x);else document.documentElement.removeAttribute('data-theme')}catch(e){}}
function setTh(x){try{x==='auto'?localStorage.removeItem('th'):localStorage.setItem('th',x)}catch(e){}applyTh();draw()}
function themeChips(){let x='auto';try{x=localStorage.getItem('th')||'auto'}catch(e){}return `<div class="mt">${[['auto','Ikuti perangkat'],['light','Terang'],['dark','Gelap']].map(([k,l])=>`<button class="${x===k?'on':''}" onclick="setTh('${k}')">${l}</button>`).join('')}</div>`}
function dAkun(){const a=curAcc();
  if(!a)return `<div class="pg">${ban()}<div class="hero">${logoH()}<h1>Akun Saya</h1><p class="mut">Masuk untuk melihat riwayat cucian, poin, dan saldo tanpa memasukkan nomor nota. Admin dan karyawan masuk lewat tautan &quot;Masuk sebagai admin / karyawan&quot;.</p></div><div class="card"><button class="b" style="width:100%;margin:0" onclick="go('pin')">Masuk</button><button class="b g" style="width:100%;margin:8px 0 0" onclick="go('reg')">Daftar akun baru</button></div><div class="card"><h2>Tampilan</h2>${themeChips()}</div></div>`;
  const mine=S.orders.filter(o=>nw(o.wa)===a.w).reverse(),w0=mine[0]&&mine[0].wa,sl=w0?((S.sal&&S.sal[nw(w0)])||0):0;
  return `<div class="pg">${ban()}<div class="hero"><div class="mono" style="width:72px;height:72px;font-size:30px;border-radius:50%">${esc((a.n||'?')[0].toUpperCase())}</div><h1>${esc(a.n)}</h1><p class="mut">${esc(a.tw||a.w)}</p></div>
  <div class="sg"><div class="st2" style="--c:#f59e0b"><small>Poin</small><b>${w0?poin(w0):0}</b></div><div class="st2" style="--c:#10b981"><small>Saldo</small><b>${rp(sl)}</b></div></div>
  <div class="card"><h2>Cucian saya</h2>${mine.length?mine.slice(0,10).map(x=>`<div class="row" style="padding:7px 0;border-top:1px solid var(--bd)"><span>${nn(x)} <span class="mut">· ${fmt(x.masuk)} · ${STN[x.st]}</span><br><span class="mut">${esc(itemsTxt(x))} · ${rp(x.total)}</span></span><button class="b g" style="margin:0;padding:6px 12px" onclick="cscr='lacak';found=S.orders.find(z=>z.id===${x.id});draw()">Lihat</button></div>`).join(''):'<p class="mut">Belum ada cucian pada nomor ini.</p>'}</div>
  <div class="card"><h2>Tampilan</h2>${themeChips()}</div><button class="b g" onclick="logoutAcc()">Keluar</button></div>`}
function tesSec(){const a=(S.tes||[]).filter(x=>x.on!==0),avg=a.length?a.reduce((s,x)=>s+x.b,0)/a.length:0;
  return `<h2 style="margin:22px 0 8px">Kata Pelanggan</h2>${a.length?`<p class="mut" style="margin:0 0 10px"><b style="color:var(--tx);font-size:18px">${avg.toFixed(1)}</b> <span style="color:#f5b301">★</span> dari ${a.length} ulasan</p><div class="ts">${a.map(x=>`<div class="tc"><div class="row" style="justify-content:flex-start;gap:10px"><div class="av">${esc(String(x.n||'?')[0].toUpperCase())}</div><div><b>${esc(x.n)}</b><div style="color:#f5b301">${'★'.repeat(x.b)}<span style="color:var(--bd)">${'★'.repeat(5-x.b)}</span></div></div></div><p style="margin:10px 0 0">${esc(x.t)}</p></div>`).join('')}</div>`:'<p class="mut" style="margin:0 0 10px">Belum ada testimoni. Jadilah yang pertama!</p>'}<button class="b g" style="margin:12px 0 0" onclick="nv('tes')">Tulis testimoni</button>`}
function dTes(){const a=curAcc();return `<div class="pg">${ban()}<h1>Tulis Testimoni</h1><p class="mut">Ceritakan pengalaman Anda. Testimoni tampil setelah disetujui admin.</p><div class="card" id="tsc"><label>Nama</label><input id="tn2" value="${esc(a?a.n:'')}"><label>Penilaian</label><div class="stars" id="tst">${[1,2,3,4,5].map(n=>`<a onclick="tsS(${n})" style="${n<=tsr?'':'opacity:.35'}">★</a>`).join('')}</div><label>Komentar</label><textarea id="tt2" placeholder="Tulis komentar Anda"></textarea><button class="b" style="width:100%;margin:14px 0 0" onclick="tesGen()">Kirim Testimoni</button></div><button class="b g" onclick="nv('home')">← Kembali</button></div>`}
function tsS(n){tsr=n;document.querySelectorAll('#tst a').forEach((a,i)=>a.style.opacity=i<n?1:.35)}
let tesBusy=false;
async function tesGen(){const n=$('#tn2').value.trim(),x=$('#tt2').value.trim();if(!n||!x||!tsr){toast('Isi nama, bintang, dan komentar');return}
  if(x.length<3){toast('Komentar terlalu pendek');return}if(tesBusy)return;tesBusy=true;const bt=document.querySelector('#tsc .b');if(bt){bt.disabled=true;bt.textContent='Mengirim…'}
  try{await sbRpc('kl_tes_kirim',{p_n:n,p_b:tsr,p_t:x});
    tsr=0;
    $('#tsc').innerHTML=`<div style="text-align:center"><div class="okc">✓</div><h2 style="margin:14px 0 6px">Terima kasih!</h2><p class="mut">Testimoni Anda sudah terkirim dan akan tampil di beranda setelah disetujui admin.</p><button class="b" style="margin:12px 0 0" onclick="nv('home')">Kembali ke beranda</button></div>`}
  catch(e){const m=String(e&&e.message||'');const sering=/TERLALU_(SERING|BANYAK)/.test(m);toast(sering?'Terlalu banyak testimoni masuk, coba lagi nanti':'Gagal mengirim, periksa koneksi lalu coba lagi');if(bt){bt.disabled=false;bt.textContent='Kirim Testimoni'}}
  finally{tesBusy=false}}
function rtUrl(o){const p=S.pm||{};if(!p.cs)return '';return 'https://wa.me/'+nomor(p.cs)+'?text='+encodeURIComponent('Halo '+S.nama+', saya '+o.nama+' (Nota '+nn(o)+') ingin memberi ulasan.\nBintang: '+(rt.n?'★'.repeat(rt.n)+' ('+rt.n+'/5)':'-')+'\nKomentar: '+rt.c)}
function rtStar(n){rt.n=n;draw()}
function rtIn(v,id){rt.c=v;const a=$('#rtA'),o=S.orders.find(x=>x.id===id);if(a&&o)a.href=rtUrl(o)}
function rateCard(o){const u=revUrl(),w=rtUrl(o);
  return `<div class="card" style="text-align:center"><h2>Bagaimana layanan kami?</h2><div class="stars">${[1,2,3,4,5].map(n=>`<a style="${n<=rt.n?'':'opacity:.35'}" onclick="rtStar(${n})" role="button" aria-label="${n} bintang">★</a>`).join('')}</div><textarea placeholder="Tulis komentar Anda (opsional)" oninput="rtIn(this.value,${o.id})" style="margin-top:10px">${esc(rt.c)}</textarea>${w?`<a id="rtA" class="b" style="display:block;text-align:center;margin:10px 0 0" target="_blank" rel="noopener" href="${w}">Kirim ulasan ke CS (WA)</a>`:''}${u?`<a class="b g" style="display:block;text-align:center;margin:8px 0 0" target="_blank" rel="noopener" href="${esc(u)}">Tulis di Google Maps</a>`:''}</div>`}
function riwCard(o){const k=nw(o.wa),a=S.orders.filter(x=>nw(x.wa)===k&&x.id!==o.id).slice(-4).reverse(),sl=(S.sal&&S.sal[k])||0;if(!a.length&&!sl)return '';
  return `<div class="card"><h2>Riwayat cucian Anda</h2>${sl>0?`<div class="row" style="padding:4px 0"><span class="mut">Saldo</span><b>${rp(sl)}</b></div>`:''}${a.map(x=>`<div class="row" style="padding:6px 0;border-top:1px solid var(--bd)"><span>${nn(x)} <span class="mut">· ${fmt(x.masuk)} · ${STN[x.st]}</span></span><button class="b g" style="margin:0;padding:6px 12px" onclick="found=S.orders.find(z=>z.id===${x.id});draw()">Lihat</button></div>`).join('')}</div>`}
const ATUR_AI={'Toko & Akses':['🏪','Nama laundry, PIN, batas hari, cadangan'],'Layanan & Harga':['🧺','Daftar layanan dan harganya'],'Diskon':['🏷️','Diskon yang bisa dipilih kasir'],'Produk':['🛍️','Barang yang dijual, mis. plastik dan parfum'],'Mutasi Bank':['🏦','Catat pembayaran otomatis dari mutasi'],'Pembayaran & QRIS':['💳','QRIS dan pembayaran'],'Tampilan pelanggan':['🎨','Warna, logo, banner, pesan status'],'Popup poster promo':['📣','Poster saat pelanggan membuka'],'Karyawan':['👥','Akun, PIN, impor Excel'],'Jam operasional & FAQ':['🕒','Jam buka dan pertanyaan umum'],'Template pesan WA':['💬','Isi pesan ke pelanggan'],'WA otomatis (Fonnte)':['🤖','Kirim WA ke pelanggan tanpa klik']};
function sbarShow(){if(document.getElementById('sbar'))return;$('#app').insertAdjacentHTML('beforeend','<div class="sbar" id="sbar"><span>Ada perubahan belum disimpan</span><button class="b" onclick="atur()">Simpan</button></div>')}
function tidyAtur(){const g=document.querySelector('#app .gr.two');if(!g)return;g.classList.remove('two','gr');g.classList.add('acl');
  const ord=['Toko & Akses','Layanan & Harga','Produk','Diskon','Pembayaran & QRIS','Mutasi Bank','Tampilan pelanggan','Popup poster promo','Karyawan','Jam operasional & FAQ','Template pesan WA','WA otomatis (Fonnte)'],nm=c=>{const h=c.querySelector('h2');return h?h.textContent:''};
  [...g.children].sort((a,b)=>{const x=ord.indexOf(nm(a)),y=ord.indexOf(nm(b));return (x<0?99:x)-(y<0?99:y)}).forEach((c,i)=>{const h=c.querySelector('h2');if(!h)return;const n=h.textContent,d=document.createElement('details'),s=document.createElement('summary');d.className='card ac';if(acOpen[n]||(!Object.keys(acOpen).length&&i===0))d.open=true;{const m=ATUR_AI[n]||['⚙️',''];s.innerHTML=`<span class="ai">${m[0]}</span><span class="at"><b>${esc(n)}</b>${m[1]?`<small>${m[1]}</small>`:''}</span>`}h.remove();d.appendChild(s);while(c.firstChild)d.appendChild(c.firstChild);d.addEventListener('toggle',()=>{acOpen[n]=d.open});g.appendChild(d);c.remove()});g.insertAdjacentHTML('beforeend',`<div class="card" style="margin-top:14px">${dirty?'<p style="color:var(--warn);margin:0 0 10px">⚠ Ada perubahan yang belum disimpan.</p>':'<p class="mut" style="margin:0 0 10px">Tidak ada perubahan yang tertunda.</p>'}<button class="b" style="width:100%;margin:0" onclick="atur()">Simpan Semua Perubahan</button><p class="mut" style="margin:10px 0 0;text-align:center">Ukuran data halaman: ${Math.round(JSON.stringify(S).length/1024)} KB dari batas 16.000 KB</p><button class="b g" style="width:100%;margin:12px 0 0;color:var(--bad);border-color:var(--bad)" onclick="askOut()">Keluar dari akun</button></div>`);if(dirty)sbarShow()}
const fx=x=>new Date(x).toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
function ordRows(){return S.orders.map(o=>({Nota:o.no||o.id,Tanggal:fx(o.masuk),Pelanggan:o.nama,WA:wShow(o.wa),Layanan:itemsTxt(o),Diskon:o.disk||0,Total:o.total,Dibayar:o.total-tagih(o),Sisa:tagih(o),Status:STN[o.st],Pembayaran:o.bayar,PJ:o.pj||'',Catatan:o.cat||'',Estimasi:fx(o.est)}))}
function pelRows(){return pelList().map(c=>({Nama:c.nama,WA:c.wa,'Jumlah order':c.c,'Total belanja':c.t,Terakhir:fx(c.l),Poin:poin(c.wa),Saldo:(S.sal&&S.sal[c.k])||0,Hutang:S.orders.filter(o=>nw(o.wa)===c.k&&o.st===3&&tagih(o)>0).reduce((s,o)=>s+tagih(o),0)}))}
function karRows(){return (S.kar||[]).map(k=>({Nama:k.n,'No HP':k.hp||'',Jabatan:k.jab||'',Status:k.on===0?'Nonaktif':'Aktif'}))}
function payRows(){const r=[];S.orders.forEach(o=>(o.pay||legacy(o)).forEach(p=>r.push({Nota:o.no||o.id,Pelanggan:o.nama,Waktu:fx(p.t),Metode:p.m,Jumlah:p.a,Catatan:p.n||'',Oleh:p.by||''})));(S.tu||[]).forEach(x=>r.push({Nota:'Saldo',Pelanggan:'',Waktu:fx(x.t),Metode:x.m,Jumlah:x.a,Catatan:'Isi saldo',Oleh:''}));return r}
let TA=null,TAerr='';
async function tesMuat(){try{TA=await sbRpc('kl_tes_daftar',{},true)||[];TAerr=''}catch(e){TA=[];TAerr=(e&&e.status===404)?'Fitur testimoni otomatis belum aktif: jalankan supabase_migrasi_v3.sql di Supabase.':'Gagal memuat testimoni masuk.'}if(ds==='tes'&&adm)draw()}
async function tesAksi(id,a){try{await sbRpc('kl_tes_atur',{p_id:id,p_aksi:a},true);toast(a==='hapus'?'Testimoni dihapus':a==='sembunyi'?'Testimoni disembunyikan':'Testimoni disetujui dan tampil');await tesMuat()}catch(e){toast(e&&e.message==='DITOLAK_PERAN'?'Hanya owner yang bisa mengubah testimoni':'Gagal: '+(e&&e.message||e))}}
function tesDelA(id){ask('Hapus testimoni ini?',()=>tesAksi(id,'hapus'),'Hapus')}
function tesAuto(){if(TA===null){setTimeout(tesMuat,0);return '<div class="card"><h2>Testimoni masuk otomatis</h2><p class="mut">Memuat…</p></div>'}
  const L=TA.slice().sort((a,b)=>(a.tampil===null?0:1)-(b.tampil===null?0:1)),w=TA.filter(x=>x.tampil===null).length;
  return `<div class="card"><h2>Testimoni masuk otomatis</h2><p class="mut">Testimoni dari form pelanggan menunggu persetujuan Anda. Hanya yang disetujui yang tampil di beranda.</p>${w?`<p style="color:var(--warn);font-weight:600;margin:6px 0 0">${w} menunggu persetujuan</p>`:''}${TAerr?`<p style="color:var(--bad)">${esc(TAerr)}</p>`:''}${TA.length?'':'<p class="mut">Belum ada.</p>'}</div>${L.map(x=>{const p=x.tampil===null,h=x.tampil===false;return `<div class="card"><div class="row"><b>${esc(x.n)} <span style="color:#f5b301">${'★'.repeat(x.b)}</span></b><span class="mut" style="${p?'color:var(--warn);font-weight:600':''}">${p?'Menunggu':h?'Disembunyikan':'Tampil'}</span></div><p>${esc(x.t)}</p><div class="mut" style="font-size:12px">${fx(x.d)}</div>${p?`<button class="b" onclick="tesAksi(${x.id},'tampil')">Setujui &amp; tampilkan</button>`:`<button class="b g" onclick="tesAksi(${x.id},'${h?'tampil':'sembunyi'}')">${h?'Tampilkan':'Sembunyikan'}</button>`}<button class="b g" style="color:var(--bad);border-color:var(--bad)" onclick="tesDelA(${x.id})">${p?'Tolak &amp; hapus':'Hapus'}</button></div>`}).join('')}`}
function tesRows(){return (S.tes||[]).map(x=>({Nama:x.n,Bintang:x.b,Isi:x.t,Tanggal:fx(x.d),Tampil:x.on===0?'Tidak':'Ya'}))}
function aknRows(){return (S.acc||[]).map(a=>({Nama:a.n,WA:a.w,Terdaftar:fx(a.t)}))}
const DS={ord:['Order',ordRows],pel:['Pelanggan',pelRows],kar:['Karyawan',karRows],pay:['Pembayaran',payRows],tes:['Testimoni',tesRows],akn:['Akun',aknRows],log:['Aktivitas',logRows],kas:['Tutup Kas',kasRows],mut:['Mutasi bank',()=>[]]};
function tbl(r){if(!r.length)return '<div class="card mut">Belum ada data.</div>';const h=Object.keys(r[0]);
  return `<div class="tw"><table class="dt2"><thead><tr>${h.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${r.slice(0,200).map(x=>`<tr>${h.map(k=>`<td>${esc(x[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${r.length>200?`<p class="mut">Menampilkan 200 dari ${r.length} baris. Unduh Excel untuk data lengkap.</p>`:''}`}
function dData(){const [nm,fn]=DS[ds],r=fn(),tabs=`<div class="seg" style="max-width:none;overflow:auto">${Object.entries(DS).map(([k,v])=>`<button class="${ds===k?'on':''}" onclick="ds='${k}';draw()">${v[0]}</button>`).join('')}</div>`;
  if(ds==='mut')return tabs+mutPanel();
  return `${tabs}
  <div class="qa"><button class="b" onclick="xlsDl('${ds}')">Unduh Excel (${nm})</button><button class="b g" onclick="xlsAll()">Unduh semua</button>${ds==='kar'?`<button class="b g" onclick="xlsTpl()">Template</button><label class="b g" style="cursor:pointer">Unggah Excel<input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="impKar(this)"></label>`:''}</div>
  <p class="mut">${r.length} baris</p>${ds==='tes'?tesAuto()+tesForm():''}${ds==='akn'?aknForm():''}${tbl(r)}`}
let mutT=sg('mt')||'',mutR=null;
function parseRp(s){let x=String(s||'').replace(/[^\d.,-]/g,'');if(!/\d/.test(x))return null;const d=x.lastIndexOf('.'),c=x.lastIndexOf(','),L=x.length;let dec=-1;if(d>=0&&c>=0)dec=Math.max(d,c);else if(c>=0&&L-c-1!==3)dec=c;else if(d>=0&&L-d-1!==3)dec=d;
  const n=parseFloat(dec>=0?x.slice(0,dec).replace(/[.,]/g,'')+'.'+x.slice(dec+1):x.replace(/[.,]/g,''));return isFinite(n)?Math.round(n):null}
function splitLine(l){if(l.indexOf('\t')>=0)return l.split('\t');if(l.indexOf(';')>=0)return l.split(';');const m=l.match(/("([^"]*)"|[^,]+)/g)||[];return m.map(v=>v.replace(/^"|"$/g,''))}
function mutParse(txt){const out=[];String(txt||'').split(/\r?\n/).forEach(l=>{l=l.trim();if(!l)return;const c=splitLine(l).map(v=>v.trim()).filter(Boolean);if(!c.length)return;let ai=-1,amt=0;
  for(let k=c.length-1;k>=0;k--){if(/^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}/.test(c[k])||/^\d{4}-\d{2}-\d{2}/.test(c[k]))continue;if(c[k].replace(/[^\d]/g,'').length<3)continue;const v=parseRp(c[k]);if(v&&v>0){ai=k;amt=v;break}}
  if(ai<0)return;out.push({amt,text:c.filter((_,k)=>k!==ai).join(' · '),key:String(h32(c.join('|')))})});return out}
function mutMatch(r){const t=r.text.toLowerCase();return S.orders.filter(o=>o.st!==4&&tagih(o)>0&&tagih(o)===r.amt).sort((a,b)=>(t.includes(String(b.nama).toLowerCase())?1:0)-(t.includes(String(a.nama).toLowerCase())?1:0))}
function mutPanel(){const used=new Set(S.mm||[]);
  return `<div class="card"><h2>Cocokkan mutasi bank</h2><p class="mut">Salin mutasi uang masuk dari m-banking atau hasil ekspor layanan mutasi (tanggal, keterangan, jumlah), lalu tempel di sini. Aplikasi mencari order belum lunas yang sisa tagihannya sama persis, dan kamu yang menentukan mana yang ditandai lunas. Jangan menempel kunci API di sini.</p><textarea id="mtx" placeholder="Contoh:&#10;10/10/2026;TRANSFER DARI SITI;35.000,00" oninput="mutT=this.value;ss('mt',mutT)">${esc(mutT)}</textarea><button class="b" onclick="mutCari()">Cocokkan</button></div>
  ${mutR?(mutR.length?mutR.map((r,i)=>{const u=used.has(r.key),c=u?[]:mutMatch(r);return `<div class="card"><div class="row"><b>${rp(r.amt)}</b>${u?'<span class="chip s2">Sudah diproses</span>':''}</div><p class="mut" style="margin:4px 0 8px">${esc(r.text)||'(tanpa keterangan)'}</p>${u?'':(c.length?c.slice(0,4).map(o=>`<div class="row" style="padding:5px 0;border-top:1px solid var(--bd)"><span>${esc(nn(o))} · ${esc(o.nama)}</span><button class="b" style="margin:0;padding:7px 12px" onclick="mutBayar(${i},${o.id})">Tandai lunas</button></div>`).join(''):'<p class="mut" style="margin:0">Tidak ada order dengan sisa tagihan sama persis.</p>')}${u?'':`<button class="b g" style="margin:8px 0 0;padding:6px 12px" onclick="mutAbaikan(${i})">Abaikan baris ini</button>`}</div>`}).join(''):'<div class="card mut">Tidak ada baris uang masuk yang terbaca. Pastikan tiap baris memuat jumlah.</div>'):''}`}
function mutCari(){mutR=mutParse(mutT);draw()}
function mutBayar(i,oid){const r=mutR[i],o=S.orders.find(x=>x.id===oid);if(!r||!o)return;
  ask('Tandai '+nn(o)+' ('+o.nama+') lunas dari mutasi '+rp(r.amt)+'?\n"'+r.text.slice(0,100)+'"',()=>{o.pay=o.pay||legacy(o);o.pay.push({t:Date.now(),a:r.amt,m:'Transfer',n:'Mutasi: '+r.text.slice(0,80),by:me()||'Admin',ref:''});sync(o);S.mm=(S.mm||[]).concat(r.key).slice(-500);aud('Pembayaran (mutasi)',o,rp(r.amt));ss('tab','dat');ss('ds','mut');save()},'Tandai lunas')}
function mutAbaikan(i){const r=mutR[i];if(!r)return;S.mm=(S.mm||[]).concat(r.key).slice(-500);aud('Abaikan mutasi',null,rp(r.amt));ss('tab','dat');ss('ds','mut');save()}
function tesForm(){const L=S.tes||[];if(!L.length)return '';return `<div class="card"><h2>Testimoni lama</h2><p class="mut">Testimoni yang dulu ditambahkan manual atau lewat kode. Bisa disembunyikan atau dihapus.</p></div>${(S.tes||[]).map((x,i)=>`<div class="card"><div class="row"><b>${esc(x.n)} <span style="color:#f5b301">${'★'.repeat(x.b)}</span></b><span class="mut">${x.on===0?'Disembunyikan':'Tampil'}</span></div><p>${esc(x.t)}</p><button class="b g" onclick="tesTog(${i})">${x.on===0?'Tampilkan':'Sembunyikan'}</button><button class="b g" style="color:var(--bad);border-color:var(--bad)" onclick="tesDel(${i})">Hapus</button></div>`).join('')}`}
function tesTog(i){S.tes[i].on=S.tes[i].on===0?1:0;ss('tab','dat');ss('ds','tes');save()}
function tesDel(i){ask('Hapus testimoni ini?',()=>tesDel2(i),'Hapus')}
function tesDel2(i){S.tes.splice(i,1);ss('tab','dat');ss('ds','tes');save()}
function aknForm(){return `<div class="card"><h2>Daftarkan akun pelanggan</h2><p class="mut">Tempel kode pendaftaran yang dikirim pelanggan lewat WA. Nomor yang sama akan diperbarui (reset kata sandi).</p><textarea id="ak" placeholder="Tempel kode pendaftaran"></textarea><button class="b" onclick="aknAdd()">Tambah akun</button></div>${(S.acc||[]).map((a,i)=>`<div class="card"><div class="row"><span><b>${esc(a.n)}</b><div class="mut">${esc(a.w)}</div></span><button class="b g" style="margin:0;color:var(--bad);border-color:var(--bad)" onclick="aknDel(${i})">Hapus</button></div></div>`).join('')}`}
function aknAdd(){let d;try{d=JSON.parse(ub64u(($('#ak').value||'').trim().split(/\s+/).pop()))}catch(e){toast('Kode tidak valid');return}
  if(!d||!d.n||!d.w||!d.s||!d.h){toast('Kode tidak lengkap');return}S.acc=S.acc||[];const x={n:String(d.n).slice(0,60),w:nw(d.w),s:d.s,h:d.h,t:Date.now()},i=S.acc.findIndex(a=>a.w===x.w);if(i<0)S.acc.push(x);else S.acc[i]=x;ss('tab','dat');ss('ds','akn');save()}
function aknDel(i){ask('Hapus akun pelanggan ini?',()=>aknDel2(i),'Hapus')}
function aknDel2(i){S.acc.splice(i,1);ss('tab','dat');ss('ds','akn');save()}
async function dlf(fn,data){const d=_d||(_d=await cap('downloads'));if(!d){toast('Unduhan tidak tersedia di tampilan ini');return}try{await d.save({filename:fn,data})}catch(e){}}
function toCsv(r){if(!r.length)return '';const h=Object.keys(r[0]),q=v=>{let s=String(v==null?'':v);if(/^[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};return [h.map(q).join(','),...r.map(x=>h.map(k=>q(x[k])).join(','))].join('\n')}
async function xlsSave(fn,sheets){
  if(typeof XLSX!=='undefined'&&XLSX.utils){try{const wb=XLSX.utils.book_new();sheets.forEach(([n,r])=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(r.length?r:[{}]),n.slice(0,30)));await dlf(fn+'.xlsx',new Blob([XLSX.write(wb,{bookType:'xlsx',type:'array'})],{type:'application/octet-stream'}));return}catch(e){}}
  await dlf(fn+'.csv','\ufeff'+toCsv(sheets[0][1]));if(sheets.length>1)toast('Excel belum termuat, yang diunduh hanya data aktif (CSV)')}
function xlsDl(k){xlsSave('data-laundry-'+DS[k][0].toLowerCase(),[[DS[k][0],DS[k][1]()]])}
function xlsAll(){xlsSave('data-laundry-lengkap',Object.entries(DS).map(([k,v])=>[v[0],v[1]()]))}
function xlsTpl(){xlsSave('template-karyawan',[['Karyawan',[{Nama:'Budi','No HP':'08123456789',Jabatan:'Kasir',Status:'Aktif'}]]])}
function csvRows(x){const rows=[];let cur=[],f='',q=false;x=x.replace(/^\ufeff/,'');
  for(let i=0;i<x.length;i++){const c=x[i];if(q){if(c==='"'){if(x[i+1]==='"'){f+='"';i++}else q=false}else f+=c}else if(c==='"')q=true;else if(c===','||c===';'){cur.push(f);f=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&x[i+1]==='\n')i++;cur.push(f);f='';if(cur.some(v=>v!==''))rows.push(cur);cur=[]}else f+=c}
  cur.push(f);if(cur.some(v=>v!==''))rows.push(cur);const h=(rows.shift()||[]).map(v=>v.trim());return rows.map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]||''])))}
async function impKar(inp){const f=inp.files&&inp.files[0];if(!f)return;let rows;
  try{if(typeof XLSX!=='undefined'&&XLSX.read){const wb=XLSX.read(await f.arrayBuffer(),{type:'array'});rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''})}else rows=csvRows(await f.text())}catch(e){toast('File tidak bisa dibaca');return}
  const g=(r,...ks)=>{for(const k of ks){const kk=Object.keys(r).find(x=>x.trim().toLowerCase()===k);if(kk!==undefined&&String(r[kk]).trim()!=='')return String(r[kk]).trim()}return ''};
  const inc=rows.map(r=>{return {n:g(r,'nama'),hp:g(r,'no hp','no. hp','hp','nomor hp'),jab:g(r,'jabatan'),on:/^(nonaktif|tidak|0|no)/i.test(g(r,'status','aktif'))?0:1}}).filter(x=>x.n);
  if(!inc.length){toast('Tidak ada data karyawan yang terbaca. Pakai template.');return}
  bacaSv();S.kar=S.kar||[];let add=0,upd=0;
  inc.forEach(x=>{const i=S.kar.findIndex(k=>(x.hp&&dig(k.hp||'')===dig(x.hp))||(!x.hp&&k.n.toLowerCase()===x.n.toLowerCase()));if(i<0){S.kar.push(x);add++}else{S.kar[i]=Object.assign({},S.kar[i],x);upd++}});
  draw();toast(add+' ditambah, '+upd+' diperbarui. Tekan Simpan.')}
/* ===== WA otomatis via Fonnte (token Fonnte ada di Edge Function Supabase, BUKAN di sini) ===== */
let _waQ=[];
function waAuto(o,k){const c=S.wa||{};if(!c.on||!c[k]||!o||o.jual||isTw(o.wa))return;const key=o.id+':'+(k==='selesai'?'selesai':'baru');if(wkAda(o,k==='selesai'?'selesai':'baru')||_waQ.some(x=>x.key===key))return;_waQ.push({id:o.id,k,key})}
async function waKirim(target,message,tes){try{const t=await sbToken();if(!t)return {ok:false,msg:'sesi habis, masuk lagi'};const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),15000);
  const r=await fetch(SB_URL+'/functions/v1/kirim-wa',{method:'POST',signal:ctl.signal,headers:{'Content-Type':'application/json',apikey:SB_KEY,Authorization:'Bearer '+t},body:JSON.stringify({target,message,tes:!!tes})});clearTimeout(tm);
  let j={};try{j=await r.json()}catch(e){}
  if(r.ok&&j.ok!==false)return {ok:true};
  return {ok:false,msg:r.status===404?'fungsi kirim-wa belum dipasang di Supabase':(j.error||('kode '+r.status))}}catch(e){return {ok:false,msg:e.name==='AbortError'?'waktu habis':'jaringan'}}}
async function waFlush(){if(!_waQ.length)return;const q=_waQ.splice(0);for(const x of q){const o=S.orders.find(z=>z.id===x.id);if(!o)continue;
  const r=await waKirim(nomor(o.wa),fill(x.k==='selesai'?'selesai':'baru',o));
  if(r.ok){sentSet(x.key);toast('WA terkirim ke '+o.nama)}else toast('WA otomatis gagal: '+r.msg+'. Kirim manual lewat tombol Kirim WA.')}}
async function waTes(){const v=($('#wat')||{}).value||'';const n=nomor(v);if(!/^62\d{8,13}$/.test(n)){toast('Isi nomor tujuan tes, mis. 08123456789');return}
  toast('Mengirim pesan tes…');const r=await waKirim(n,'Tes WA otomatis dari '+S.nama+'. Jika pesan ini masuk, pengiriman otomatis sudah aktif.',true);
  toast(r.ok?'Pesan tes terkirim. Cek WhatsApp di nomor itu.':'Gagal: '+r.msg)}
function sentGet(){try{return JSON.parse(localStorage.getItem('snt')||'{}')}catch(e){return {}}}
function wkAda(o,k){return !!((o.wk&&o.wk[k])||sentGet()[o.id+':'+k])}
function sentSet(key){const p=String(key).split(':'),o=S.orders.find(x=>String(x.id)===p[0]);if(o&&p[1]&&!(o.wk&&o.wk[p[1]])){o.wk=o.wk||{};o.wk[p[1]]=Date.now();dirty=true;setTimeout(save,300)}}
function kirimCard(){const lim=Date.now()-7*864e5,a=S.orders.filter(o=>o.masuk>lim&&!isTw(o.wa)&&((o.st===0&&!wkAda(o,'baru'))||(o.st===2&&!wkAda(o,'selesai'))));if(!a.length)return '';
  return `<div class="card"><h2>Perlu dikirim (${a.length})</h2><p class="mut" style="margin-top:0">Pelanggan yang belum dikabari lewat WA</p>${a.slice(0,6).map(o=>{const d=o.st===2;return `<div class="row" style="padding:6px 0;border-top:1px solid var(--bd)"><span>${nn(o)} ${esc(o.nama)}<div class="mut">${d?'Cucian selesai':'Konfirmasi order'}</div></span><button class="b" style="margin:0;padding:8px 14px" onclick="openKirim(${o.id})">Kirim WA</button></div>`}).join('')}</div>`}
function blmLine(){const a=S.orders.filter(o=>tagih(o)>0&&o.st<4),n=a.reduce((s,o)=>s+tagih(o),0);if(!a.length)return '';return `<p style="margin:0 0 12px;text-align:center"><a class="lnk2" onclick="fl='';tab='pend';q='';draw()">Belum lunas: ${a.length} order · ${rp(n)}</a></p>`}
function rekapUrl(){const n=new Date(),d0=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(),hr=S.orders.filter(o=>o.masuk>=d0&&o.st!==4),m={Tunai:0,Transfer:0,QRIS:0};
  S.orders.forEach(o=>(o.pay||[]).forEach(p=>{if(p.t>=d0&&p.m!=='Saldo')m[p.m]=(m[p.m]||0)+p.a}));
  const tx='Rekap '+S.nama+' - '+n.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'})+'\nOrder hari ini: '+hr.length+'\nNilai order: '+rp(hr.reduce((s,o)=>s+o.total,0))+'\nUang masuk: Tunai '+rp(m.Tunai)+', Transfer '+rp(m.Transfer)+', QRIS '+rp(m.QRIS)+'\nPending: '+S.orders.filter(o=>o.st<3).length+'\nBelum lunas: '+S.orders.filter(o=>tagih(o)>0).length;
  return 'https://wa.me/'+(S.admNo?nomor(S.admNo):'')+'?text='+encodeURIComponent(tx)}
function okHtml(){if(!okId)return '';const o=S.orders.find(x=>x.id===okId);if(!o){okId=null;return ''}
  return `<div class="ov hi"><div class="md"><div class="okc">✓</div><h2 style="margin:14px 0 6px">Pesanan Berhasil!</h2><div class="chipb">Nota ${nn(o)}</div><div class="card" style="margin:14px 0;text-align:left"><div class="row"><span class="mut">Pelanggan</span><b>${esc(o.nama)}</b></div><div class="row" style="margin-top:6px"><span class="mut">Total</span><b style="color:var(--pri)">${rp(o.total)}</b></div></div><div class="row" style="gap:10px"><button class="b g" style="flex:1;margin:0" onclick="okClose();nvA('pend')">Lihat Pesanan</button>${tagih(o)>0?'<button class="b" style="flex:1;margin:0" onclick="okBayar()">Bayar Sekarang</button>':'<span class="chip s2" style="flex:1;text-align:center;padding:12px">Sudah lunas ✓</span>'}</div><button class="b g" style="width:100%;margin:10px 0 0" onclick="okKirim()">Kirim WA ke pelanggan</button></div></div>`}
function okClose(){okId=null;ss('ok',null)}
function okBayar(){const i=okId;okClose();payOpen(i)}
function okKirim(){const i=okId;okClose();draw();openKirim(i)}
let _lk='',_pop=false;
function navSnap(){return {det:detId,scr,cscr,tab,ds,pid,ed,fid:(found&&found!=='x')?found.id:0,ad:adm?1:0}}
function navKey(){return JSON.stringify(navSnap())}
function pushH(){try{const k=navKey();if(k!==_lk){history.pushState(navSnap(),'');_lk=k}}catch(e){}}
window.addEventListener('popstate',e=>{const s=e.state;if(!s||typeof s!=='object')return;scr=s.scr||'cust';cscr=s.cscr||'home';tab=s.tab||'home';ds=s.ds||'ord';ed=s.ed||null;detId=s.det||null;
  if(s.pid&&S.orders.find(o=>o.id===s.pid))payInit(s.pid);else{pid=null;pm=null;qpop=false;if(newOid){const n=newOid;newOid=null;ss('ok',n);save();return}}
  found=s.fid?(S.orders.find(o=>o.id===s.fid)||null):null;_lk=navKey();_pop=true;draw()});
window.addEventListener('beforeunload',e=>{if(newOid){e.preventDefault();e.returnValue=''}});
let _ly=0;window.addEventListener('scroll',()=>{const y=window.scrollY||0,d=y-_ly,w=innerWidth;if(w<700||w>=1000){document.body.classList.remove('nvh');_ly=y;return}if(y<40){document.body.classList.remove('nvh');_ly=y;return}if(Math.abs(d)<8)return;document.body.classList.toggle('nvh',d>0);_ly=y},{passive:true});
function logRows(){return (S.al||[]).slice().reverse().map(x=>({Waktu:fx(x.t),Oleh:x.by,Aksi:x.a,Nota:x.n,Keterangan:x.x}))}
function kasRows(){return (S.kas||[]).slice().reverse().map(x=>({Waktu:fx(x.t),Oleh:x.by,'Modal awal':x.modal||0,'Menurut sistem':x.exp,'Uang di laci':x.act,Selisih:x.diff}))}
function kasExp(){const d0=new Date();d0.setHours(0,0,0,0);const f=d0.getTime();let e=0;S.orders.forEach(o=>(o.pay||[]).forEach(p=>{if(p.t>=f&&p.m==='Tunai')e+=p.a}));(S.tu||[]).forEach(x=>{if(x.t>=f&&x.m==='Tunai')e+=x.a});return e}
function kasCard(){const ex=kasExp(),L=(S.kas||[]).slice(-5).reverse();
  return `<div class="card"><h2>Tutup Kas Hari Ini</h2><div class="row"><span class="mut">Tunai masuk menurut sistem</span><b>${rp(ex)}</b></div><label>Modal awal laci (opsional)</label><input id="km" type="number" min="0" inputmode="numeric" placeholder="0" oninput="kasUpd()"><label>Uang tunai di laci sekarang</label><input id="ka" type="number" min="0" inputmode="numeric" oninput="kasUpd()"><p id="kd" style="font-weight:700;margin:10px 0 0"></p><button class="b" style="margin:10px 0 0" onclick="kasGo()">Simpan Tutup Kas</button>${L.length?`<div style="margin-top:12px">${L.map(x=>`<div class="row" style="padding:5px 0;border-top:1px solid var(--bd)"><span class="mut">${fx(x.t)} · ${esc(x.by)}</span><b style="color:${x.diff===0?'var(--ok)':x.diff>0?'var(--warn)':'var(--bad)'}">${x.diff>0?'+':''}${rp(x.diff)}</b></div>`).join('')}</div>`:''}</div>`}
function kasUpd(){const e=kasExp()+(+$('#km').value||0),el=$('#kd');if($('#ka').value===''){el.textContent='';return}const d=+$('#ka').value-e;el.style.color=d===0?'var(--ok)':d>0?'var(--warn)':'var(--bad)';el.textContent=d===0?'Kas sesuai ✓':(d>0?'Lebih ':'Kurang ')+rp(Math.abs(d))}
function kasGo(){if($('#ka').value===''){toast('Isi uang tunai di laci');return}const m=+$('#km').value||0,e=kasExp()+m,a=+$('#ka').value,d=a-e;
  ask('Simpan tutup kas? Menurut sistem '+rp(e)+', di laci '+rp(a)+', selisih '+rp(d)+'.',()=>{(S.kas=S.kas||[]).push({t:Date.now(),by:me()||'Admin',exp:e,act:a,diff:d,modal:m});aud('Tutup kas',null,'Selisih '+rp(d));ss('tab','lap');save()},'Simpan')}
async function cadangJson(){ask('File cadangan berisi PIN, data pelanggan, dan hash kata sandi. Simpan di tempat aman dan jangan dibagikan. Lanjut mengunduh?',async()=>{await dlf('cadangan-lengkap-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({app:'kasir-laundry',v:2,t:Date.now(),data:S}))},'Unduh')}
async function pulihJson(inp){const f=inp.files&&inp.files[0];if(!f)return;let d;try{d=JSON.parse(await f.text())}catch(e){toast('File JSON tidak bisa dibaca');return}
  const x=d&&d.data;if(!d||d.app!=='kasir-laundry'||!x||!Array.isArray(x.orders)||!Array.isArray(x.svc)){toast('Bukan file cadangan aplikasi ini');return}
  ask('Pulihkan data dari cadangan '+fx(d.t)+'? Seluruh data saat ini ('+S.orders.length+' order) akan DIGANTI dengan '+x.orders.length+' order dari file. Ini tidak bisa dibatalkan.',()=>{Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,x);migrate();aud('Pulihkan cadangan',null,x.orders.length+' order');save()},'Pulihkan')}
function migrate(){S.orders.forEach(o=>{if(!o.it)o.it=items(o).map(x=>({sv:x.sv,qty:x.qty,hs:x.hs}));if(!o.pay)o.pay=legacy(o);if(!o.log)o.log=[{t:o.masuk,s:0}].concat(o.sel?[{t:o.sel,s:2}]:[])});S.cu=S.cu||[];[...S.orders].sort((a,b)=>a.masuk-b.masuk).forEach(o=>{const k=nw(o.wa);if(k&&o.st!==4&&!S.cu.some(c=>nw(c.wa)===k))S.cu.push({nama:o.nama,wa:o.wa,alamat:'',cat:'',blok:0,t:o.masuk})});S.cu.forEach(c=>{if(!c.kd)c.kd=nextKd()});S.v=2}
function nextKd(){S.cuSeq=(S.cuSeq||0)+1;return 'CUST'+String(S.cuSeq).padStart(4,'0')}
function cuOf(w){return (S.cu||[]).find(c=>nw(c.wa)===nw(w))}
function kdTier(w){const n=S.orders.filter(o=>nw(o.wa)===nw(w)&&o.st!==4).length;return n>=10?'VIP':n>=3?'Langganan':''}
function kdHtml(w){const c=cuOf(w);if(!c||!c.kd)return '';const n=+c.kd.replace(/\D/g,'');return `<span class="kdc">${esc(c.kd)}</span>${kdTier(w)?`<span class="kdt">${kdTier(w)}</span>`:''}`}
/* ---- Pembaca URL (#lacak=KODE, ?lacak=KODE, atau #KODE). Tamu langsung melihat hasil di halaman utama, tanpa login. ---- */
let lcPre='',lcMsg='';
function bacaKodeUrl(){let h=location.hash||'',qs=location.search||'';
  try{h=decodeURIComponent(h)}catch(e){}
  const m=(h+'&'+qs).match(/lacak[=\/:]([A-Za-z0-9]{4,8})/i)||h.match(/^#\/?([A-Za-z0-9]{6})$/);
  return m?m[1].toUpperCase():''}
/* Hapus kode dari address bar saat pengguna pindah dari layar Lacak, supaya refresh tidak melempar balik ke hasil lama. */
function bersihHash(){try{if(bacaKodeUrl())history.replaceState(history.state,'',location.pathname)}catch(e){}}
async function lacakDariUrl(){
  const k=bacaKodeUrl();if(!k)return false;
  /* status layar diatur SEKARANG (sinkron) supaya tidak sempat tampil beranda/login.
     Link pelanggan selalu menampilkan layar pelanggan, walau perangkat ini pernah dipakai staf (hanya di memori; sesi staf tidak dihapus). */
  adm=false;scr='cust';cscr='lacak';lm='k';found=null;lcPre=k;lcMsg='Mencari pesanan…';
  if(SB_ROLE==='staf'){const o=S.orders.find(x=>tkc(x)===k);found=o||'x';lcMsg='';if(o)try{localStorage.setItem('lc',o.id+':k:'+k)}catch(e){}draw();return true}
  try{draw()}catch(e){}
  try{
    const r=await rpcUlang('kl_lacak_kode',{p_kode:k});
    if(r&&r.o){const o=sbInject(r.o,r.ctx,r.lim);found=o;lcMsg='';try{localStorage.setItem('lc2',JSON.stringify({m:'k',k}));localStorage.setItem('lc',o.id+':k:'+k)}catch(e){}}
    else{found='x';lcMsg=''}
  }catch(e){found=null;lcMsg=lcErr(e)+' Kode Anda tetap tersimpan di kolom, tekan Lacak Sekarang untuk mencoba lagi.'}
  try{draw()}catch(e){}return true}
window.addEventListener('hashchange',()=>{lacakDariUrl()});
function ukur(){return Math.round(JSON.stringify(S).length/1024)}
function reimg(u,w,h,q){return new Promise(res=>{if(!u||String(u).indexOf('data:image')!==0){res(u);return}const im=new Image();im.onload=()=>{const k=Math.min(1,w/im.width,h/im.height),cw=Math.max(1,Math.round(im.width*k)),ch=Math.max(1,Math.round(im.height*k)),c=document.createElement('canvas');c.width=cw;c.height=ch;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,cw,ch);g.drawImage(im,0,0,cw,ch);let o=c.toDataURL('image/webp',q);if(o.indexOf('data:image/webp')!==0)o=c.toDataURL('image/jpeg',q);res(o.length<u.length?o:u)};im.onerror=()=>res(u);im.src=u})}
async function kecilkan(){toast('Memperkecil gambar...');const b=ukur();S.logo=await reimg(S.logo,128,128,.8);if(S.pop&&S.pop.img)S.pop.img=await reimg(S.pop.img,560,700,.6);if(S.promo)S.promo=await Promise.all(S.promo.map(u=>reimg(u,560,245,.6)));if(S.prd)for(const p of S.prd){if(p.img){p.img=await reimg(p.img,240,240,.6);SV[p.k]=p}}dirty=true;const a=ukur();draw();ask('Ukuran data turun dari '+b+' KB menjadi '+a+' KB. Simpan sekarang?',()=>atur2(),'Simpan')}
document.addEventListener('input',e=>{if(tab==='set'&&e.target&&e.target.closest&&e.target.closest('.ac')&&!dirty){dirty=true;sbarShow()}});
function bkRaw(){try{const b=JSON.parse(localStorage.getItem('kl_bk')||'null');return (b&&b.data&&Array.isArray(b.data.orders)&&b.stamp>(S.stamp||0))?b:null}catch(e){return null}}
/* cadangan hanya boleh dipulihkan jika dibuat dari versi server yang SAMA (atau tepat sebelum simpanan yang berhasil) */
function bkLocal(){const b=bkRaw();if(!b)return null;if(SB_ROLE!=='staf')return null;
  return (b.ver===SB_VER||(b.from&&b.from===S.stamp&&b.ver+1===SB_VER))?b:null}
function bkBasi(){const b=bkRaw();return b&&SB_ROLE==='staf'&&!bkLocal()?b:null}
async function bkUnduh(){const b=bkBasi()||bkRaw();if(!b){toast('Tidak ada cadangan lokal');return}await dlf('cadangan-lokal-'+Date.now()+'.json',JSON.stringify({app:'kasir-laundry',v:2,t:b.t,data:b.data}));toast('Salinan diunduh')}
function bkBuang(){try{localStorage.removeItem('kl_bk')}catch(e){}draw()}
function bkPulih(){const b=bkLocal();if(!b)return;ask('Pulihkan data dari perangkat ini ('+fmt(b.t)+')? Halaman akan DIGANTI dengan '+b.data.orders.length+' order dari perangkat ini (halaman sekarang: '+S.orders.length+' order). Jika perangkat lain sudah menyimpan perubahan setelah itu, perubahan tersebut hilang.',()=>{Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,b.data);migrate();aud('Pulihkan data lokal',null,b.data.orders.length+' order');save()},'Pulihkan')}
let dsel=[],dman=0;
function dskTotal(){const sub=lnTot();let x=dman||0;dsel.forEach(i=>{const d=(S.dsk||[])[i];if(d)x+=d.t==='p'?Math.round(sub*d.v/100):d.v});x+=vcOn||0;return Math.min(x,sub)}
function dskText(){const a=dsel.map(i=>(S.dsk||[])[i]).filter(Boolean).map(d=>d.n);if(dman)a.push('Manual '+rp(dman));if(vcOn)a.push('Voucher '+rp(vcOn));return a.join(' + ')}
function closeDsk(){const e=document.getElementById('dk');if(e)e.remove()}
function openDsk(){closeDsk();const L=(S.dsk||[]).map((d,i)=>({d,i})).filter(x=>x.d.on!==0);
  $('#app').insertAdjacentHTML('beforeend',`<div class="ov hi mr" id="dk" onclick="if(event.target===this)closeDsk()"><div class="bs" style="max-height:88vh;overflow:auto"><div class="grip"></div><div class="row" style="margin:10px 0 4px"><div><b style="font-size:18px">Pilih Diskon</b><div class="mut">Bisa pilih lebih dari 1 diskon</div></div><button class="bk" onclick="closeDsk()" aria-label="Tutup">×</button></div>
  ${L.length?L.map(({d,i})=>`<label class="ck"><input type="checkbox" class="dkc" value="${i}" ${dsel.includes(i)?'checked':''} onchange="dskUpd()"><div><b>${esc(d.n)}</b><div class="mut">${d.t==='p'?d.v+'%':rp(d.v)}</div></div></label>`).join(''):'<p class="mut" style="text-align:center;margin:18px 0">Belum ada diskon tersimpan. Tambahkan di Atur → Diskon.</p>'}
  <div class="kth">DISKON MANUAL</div><input id="dkm" type="number" min="0" inputmode="numeric" placeholder="Nominal diskon (Rp)" value="${dman||''}" oninput="dskUpd()">
  <div class="row" style="margin-top:14px"><span id="dkn" class="mut"></span><div style="display:flex;gap:8px"><button class="b g" style="margin:0" onclick="dsel=[];dman=0;closeDsk();hitung()">Hapus Diskon</button><button class="b" style="margin:0" onclick="dskOk()">Terapkan</button></div></div></div></div>`);dskUpd()}
function dskUpd(){const c=document.querySelectorAll('.dkc:checked').length,m=+(($('#dkm')||{}).value)||0,e=$('#dkn');if(e)e.textContent=(c+(m?1:0))+' diskon dipilih'}
function dskOk(){dsel=[...document.querySelectorAll('.dkc:checked')].map(x=>+x.value);dman=+(($('#dkm')||{}).value)||0;closeDsk();hitung()}
function tambahDsk(){bacaSv();(S.dsk=S.dsk||[]).push({n:'Diskon baru',t:'p',v:10,on:1});draw()}
function togDsk(i){bacaSv();S.dsk[i].on=S.dsk[i].on===0?1:0;draw()}
function hapusDsk(i){ask('Hapus diskon "'+((S.dsk[i]||{}).n||'')+'"?',()=>{bacaSv();S.dsk.splice(i,1);draw()},'Hapus')}
let cuSelWa='';
function closeCu(){const e=document.getElementById('cu');if(e)e.remove()}
function cuSyn(){S.cuN=(S.cuN||0)+1;return '620000'+String(S.cuN).padStart(6,'0')}
function openCu(k){closeCu();let c=null;if(k){c=(S.cu||[]).find(x=>nw(x.wa)===k);if(!c){const q=pelList().find(x=>x.k===k);if(q)c={nama:q.nama,wa:q.wa,alamat:'',cat:'',blok:0}}}
  const tw=c&&isTw(c.wa),ada=c&&S.orders.some(o=>nw(o.wa)===nw(c.wa));
  $('#app').insertAdjacentHTML('beforeend',`<div class="sheet" id="cu"><div class="sin"><div class="hd2"><button class="bk" onclick="closeCu()" aria-label="Kembali">←</button><h1 style="margin:0">${c?'Ubah Pelanggan':'Tambah Pelanggan'}</h1></div><div class="card">
  ${c&&c.kd?`<div class="kdr" style="margin:0 0 8px">${kdHtml(c.wa)}</div>`:''}<label style="margin-top:0">Nama Pelanggan *</label><input id="cun" value="${esc(c?c.nama:'')}" placeholder="Contoh: Budi Santoso">
  <div class="row" style="gap:8px;margin:8px 0 4px"><button class="b g" style="flex:1;margin:0" onclick="cuKontak(0)">Ambil 1 Kontak</button><button class="b g" style="flex:1;margin:0" onclick="openIs()">Import Batch</button></div>
  <label>Nomor WhatsApp</label><input id="cuw" inputmode="tel" placeholder="081234567890" value="${tw?'':esc(c?c.wa:'')}" ${(tw||ada)?'disabled':''}>
  ${ada?'<p class="mut" style="font-size:12px;margin:4px 0 0">Nomor tidak bisa diubah karena sudah punya order.</p>':`<label class="ck" style="margin-top:10px"><input type="checkbox" id="cut" ${tw?'checked':''} onchange="$('#cuw').disabled=this.checked"><div>Tanpa No WA</div></label>`}
  <label>Alamat (opsional)</label><textarea id="cua" placeholder="Jl. Merdeka No. 123">${esc(c?c.alamat||'':'')}</textarea>
  <label>Catatan internal (opsional)</label><textarea id="cuc" placeholder="Mis. wajib bayar lunas, pelanggan diblokir, dll">${esc(c?c.cat||'':'')}</textarea><p class="mut" style="font-size:12px;margin:4px 0 0">Catatan untuk kasir: muncul saat membuat pesanan, tidak dicetak di nota.</p>
  <label class="ck" style="margin-top:10px"><input type="checkbox" id="cub" ${c&&c.blok?'checked':''}><div>Tandai bermasalah / diblokir</div></label>
  <button class="b" style="width:100%;margin:14px 0 0;padding:14px" onclick="cuSimpan('${k||''}')">Simpan Pelanggan</button></div></div></div>`)}
function cuSimpan(k){const nama=$('#cun').value.trim(),tw=$('#cut')&&$('#cut').checked;let wa=$('#cuw').value.trim();if(!nama){toast('Isi nama pelanggan');return}
  S.cu=S.cu||[];let c=k?S.cu.find(x=>nw(x.wa)===k):null;
  if(c&&isTw(c.wa))wa=c.wa;else if(k)wa=($('#cuw').disabled?(c?c.wa:(pelList().find(x=>x.k===k)||{}).wa):wa)||wa;
  if(!k||(c&&!c.wa)){if(tw)wa=cuSyn();else if(!validWa(wa)){toast('Isi nomor WA yang valid (contoh 081234567890) atau centang Tanpa No WA');return}}
  if(!isTw(wa)&&!validWa(wa)){toast('Nomor WA tidak valid (contoh 081234567890)');return}
  if((!k||nw(wa)!==k)&&S.cu.some(x=>nw(x.wa)===nw(wa))){toast('Pelanggan dengan nomor ini sudah ada');return}
  const d={nama,wa,alamat:$('#cua').value.trim(),cat:$('#cuc').value.trim(),blok:$('#cub').checked?1:0,t:(c&&c.t)||Date.now(),kd:(c&&c.kd)||nextKd()};
  if(c)Object.assign(c,d);else S.cu.push(d);aud('Pelanggan',null,nama);ss('tab','pel');closeCu();save()}
async function cuKontak(multi){if(!('contacts' in navigator)){toast('Kontak HP belum bisa dibuka di sini. Pakai Import Batch (berkas .vcf atau tempel daftar).');openIs();return}try{const r=await navigator.contacts.select(['name','tel'],{multiple:!!multi});if(!r||!r.length)return;
  if(!multi){const c=r[0];$('#cun').value=(c.name&&c.name[0])||'';$('#cuw').value=(c.tel&&c.tel[0])||'';return}
  ikShow(r.map(c=>({n:(c.name&&c.name[0])||'',t:(c.tel&&c.tel[0])||''})).filter(c=>c.t))}catch(e){toast('Kontak tidak bisa diakses di tampilan ini. Isi manual.')}}
function closePc(){const e=document.getElementById('pc');if(e)e.remove()}
function pcList(q){q=String(q||'').toLowerCase();const a=pelList().filter(c=>c.nama.toLowerCase().includes(q)||String(c.wa).includes(q)||String((c.cu&&c.cu.kd)||'').toLowerCase().includes(q));
  return a.map(c=>{const sl=(S.sal&&S.sal[c.k])||0,kd=c.cu&&c.cu.kd;return `<button class="pcr" onclick="pcPick('${c.k}')"><span class="pca">${esc(String(c.nama||'?')[0].toUpperCase())}</span><span class="pcn"><b>${esc(c.nama)}${c.cu&&c.cu.blok?' <i class="pcb">Bermasalah</i>':''}</b><small>${esc(wShow(c.wa))}${kd?' · '+esc(kd):''}</small></span>${sl>0?`<span class="pcs">${rp(sl)}</span>`:''}<svg class="pcc" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>`}).join('')||'<p class="mut" style="text-align:center;margin:22px 0">Tidak ditemukan.</p>'}
function openPc(){closePc();$('#app').insertAdjacentHTML('beforeend',`<div class="ov hi mr pcw" id="pc"><div class="bs"><div class="pch"><b>Pilih Customer</b><button class="pcx" onclick="closePc()" aria-label="Tutup">×</button></div><div class="pcq"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="pcs" placeholder="Cari nama atau nomor HP..." oninput="$('#pcl').innerHTML=pcList(this.value)"></div><div id="pcl">${pcList('')}</div><button class="pcnew" onclick="closePc();openCu()">+ Tambah Customer Baru</button></div></div>`)}
function pcPick(k){const c=pelList().find(x=>x.k===k);closePc();if(!c)return;$('#fn').value=c.nama;const tw=isTw(c.wa);$('#fw').value=tw?'':c.wa;$('#fw').disabled=tw;cuSelWa=c.wa;if(c.cu&&c.cu.alamat&&$('#fa')&&!$('#fa').value)$('#fa').value=c.cu.alamat;hitung()}
const MUT_ST=[['Buat akun penyedia & hubungkan rekening','Daftar di situs resmi penyedia, hubungkan rekening/e-wallet laundry. Lebih aman memakai rekening khusus laundry dan akses baca saja.'],['Baca dokumentasi webhook','Catat contoh isi kiriman (nomor transaksi, waktu, jumlah, tipe masuk/keluar), cara tanda tangannya (HMAC/token), dan apakah ada kode unik nominal.'],['Siapkan hosting Node.js + MySQL + HTTPS','Hosting yang punya Node.js (atau VPS kecil), database MySQL, dan domain ber-HTTPS. Impor schema.sql.'],['Pasang kode penerima (folder api/)','Unggah mutasi-core.js, adapter-mysql.js, server.js lalu jalankan npm i mysql2.'],['Sesuaikan pemetaan kolom','Edit PETA di mutasi-core.js agar nama kolom sama dengan contoh kiriman penyedia.'],['Isi variabel lingkungan di server','MUTASI_SECRET, MUTASI_MODE, MUTASI_HEADER, DB_HOST, DB_USER, DB_PASS, DB_NAME. Jangan di kode, jangan di aplikasi ini.'],['Daftarkan alamat webhook di penyedia','Alamatnya https://domainmu.com/webhook/mutasi. Catat juga di kolom alamat di atas.'],['Uji dengan transfer kecil','Buat pesanan Rp1.000, transfer Rp1.000 dari rekening lain. Mutasi harus berstatus dicocokkan dan pesanan lunas.'],['Pantau minggu pertama','Cek mutasi berstatus baru (tidak cocok) dan cocokkan manual lewat Pusat Data → Mutasi bank.']];
function mutTog(i){bacaSv();const a=S.mutCk=S.mutCk||[],k=a.indexOf(i);if(k<0)a.push(i);else a.splice(k,1);draw()}
let detId=null;
function openDet(id){detId=id;tab='det';draw()}
function detAdv(id){adv(id)}
function itemSiap(oid,i){const o=S.orders.find(x=>x.id===oid);if(!o||!o.it||!o.it[i])return;o.it[i].s=1;aud('Item siap',o,SV[o.it[i].sv].n);
  if(o.st<2&&o.it.every(x=>x.s)){o.st=2;o.sel=Date.now();(o.log=o.log||[]).push({t:o.sel,s:2,by:me()||'Admin'});ss('last',oid+':d');waAuto(o,'selesai')}save()}
function detTambah(id){pkTarget=id;openPk()}
function addToOrder(oid,it){pkTarget=null;const o=S.orders.find(x=>x.id===oid);if(!o)return;if(!o.it)o.it=items(o).map(x=>({sv:x.sv,qty:x.qty,hs:x.hs}));
  o.it.push(it);o.total+=Math.round(it.qty*it.hs);o.est=Math.max(o.est,Date.now()+(SV[it.sv].j||24)*36e5);
  if(o.st>=2&&o.st<3){o.st=1;o.sel=null;(o.log=o.log||[]).push({t:Date.now(),s:1,by:me()||'Admin'})}
  sync(o);aud('Tambah layanan',o,SV[it.sv].n+' '+rp(Math.round(it.qty*it.hs)));save()}
function dDet(){const o=S.orders.find(x=>x.id===detId);if(!o)return '<div class="card mut">Order tidak ditemukan.</div>';
  const bt=o.st===4,its=items(o),pays=o.pay||legacy(o),lun=tagih(o)<=0&&!bt,stC=['#3b82f6','#f59e0b','#10b981','#8b5cf6','#ef4444'][o.st],act=o.st===0?'→ Mulai Diproses':o.st===1?'Tandai Siap Diambil':o.st===2?'Tandai Sudah Diambil':null;
  return `<div class="hd2"><button class="bk" onclick="nvA('pend')" aria-label="Kembali">←</button><h1 style="margin:0;font-size:20px">${esc(nn(o))}</h1></div>
  ${bt?`<div class="card" style="border-left:4px solid var(--bad)"><b style="color:var(--bad)">Pesanan dibatalkan</b><div class="mut">${esc((o.batal||{}).alasan||'')}</div></div>`:''}
  <div class="dgrid"><div><div class="card" style="padding:4px 0"><div class="row" style="gap:0"><button class="dtb" onclick="openKirim(${o.id})">💬<span>WhatsApp</span></button><button class="dtb" onclick="${o.st>=2?`window.open(wr(S.orders.find(x=>x.id===${o.id})),'_blank')`:`toast('Pengingat tersedia setelah cucian selesai')`}">🔔<span>Ingatkan</span></button><button class="dtb" onclick="nota(${o.id})">🧾<span>Struk</span></button><button class="dtb" onclick="nota(${o.id},{cetak:1})">🖨<span>Cetak</span></button></div></div>
  <div class="card" style="border-left:4px solid ${stC}"><div class="row"><div><div class="mut">Status Pesanan</div><b style="font-size:20px;color:${stC}">${STN[o.st]}</b></div><div class="mut" style="text-align:right">Masuk ${fmt(o.masuk)}</div></div>${(act&&!bt)?`<button class="b" style="width:100%;margin:12px 0 0;padding:14px;background:${stC}" onclick="detAdv(${o.id})">${act}</button>`:''}${bt?'':`<div class="mut" style="margin-top:10px">⏱ Estimasi selesai: <b style="color:var(--tx)">${fmt(o.est)}</b></div>`}</div>
  <div class="card"><div class="row" style="justify-content:flex-start;gap:12px"><span class="av">${esc(String(o.nama)[0].toUpperCase())}</span><div><b>${esc(o.nama)}</b><div class="kdr">${kdHtml(o.wa)}</div><div class="mut">${esc(wShow(o.wa))}</div>${o.alm?`<div class="mut">📍 ${esc(o.alm)}</div>`:''}</div></div></div>
  <div class="card"><div class="row"><h2 style="margin:0">Item Pesanan</h2><span class="chip s0">${its.length} layanan</span></div>${its.map((x,i)=>{const v=SV[x.sv],siap=x.s||o.st>=2;return `<div style="border-top:1px solid var(--bd);margin-top:12px;padding-top:10px"><div class="row"><b>${esc(v.n)}</b><b>${rp(Math.round(x.qty*x.hs))}</b></div><div class="mut">${x.qty} ${esc(v.u)} × ${rp(x.hs)}</div>${x.c?`<div class="mut"><i>${esc(x.c)}</i></div>`:''}<div class="row" style="margin-top:8px"><span><span class="chip ${siap?'s2':'s1'}">${siap?'Siap':'Diproses'}</span> <span class="chip">${durTxt(v.j)}</span>${x.jp?` <span class="chip">${x.jp} pakaian</span>`:''}</span>${(!siap&&o.st<3&&!bt)?`<button class="b g" style="margin:0;padding:7px 12px" onclick="itemSiap(${o.id},${i})">✓ Tandai Siap</button>`:''}</div></div>`}).join('')}${(o.st<3&&!bt)?`<button class="b g" style="width:100%;margin:14px 0 0" onclick="detTambah(${o.id})">+ Tambah Layanan</button>`:''}</div>
  </div><div><div class="card"><h2>Pembayaran</h2><div class="row"><span class="mut">Total Layanan</span><span>${rp(its.reduce((s,x)=>s+Math.round(x.qty*x.hs),0))}</span></div>${o.disk?`<div class="row"><span class="mut">Diskon${o.dn?' ('+esc(o.dn)+')':''}</span><span style="color:var(--ok)">-${rp(o.disk)}</span></div>`:''}<div class="row" style="margin-top:6px"><b>Total</b><b style="color:var(--pri);font-size:20px">${rp(o.total)}</b></div>
  <div class="row" style="margin-top:12px;padding:12px;border-radius:14px;background:color-mix(in srgb,${lun?'var(--ok)':'var(--bad)'} 12%,transparent);color:${lun?'var(--ok)':'var(--bad)'};font-weight:700"><span>${bt?'DIBATALKAN':lun?'✓ LUNAS':'BELUM LUNAS · sisa '+rp(tagih(o))}</span>${(!bt&&!lun)?`<button class="b" style="margin:0;padding:8px 14px" onclick="payOpen(${o.id})">Bayar</button>`:''}</div></div>
  <div class="card"><div class="row"><h2 style="margin:0">Riwayat Pembayaran</h2><span class="chip s2">${pays.length} transaksi</span></div>${pays.length?pays.map(y=>`<div style="border-top:1px solid var(--bd);margin-top:10px;padding-top:8px"><div class="row"><b>${rp(y.a)}</b><span class="chip">${esc(y.m)}</span></div><div class="mut" style="font-size:13px">${fmt(y.t)} · ${esc(y.by||'-')}${y.ref?' · ref '+esc(y.ref):''}${y.n?' · '+esc(y.n):''}</div></div>`).join(''):'<p class="mut">Belum ada pembayaran.</p>'}</div>
  <div class="card"><h2>Aktivitas</h2>${acts(o).map(a=>`<div class="ac2"><i style="background:${a.c}"></i><div><small>${fmt(a.t)}</small><div>${esc(a.x)}</div></div></div>`).join('')}</div></div></div>`}
(function(){let st=null;
  document.addEventListener('touchstart',e=>{const bs=e.target.closest&&e.target.closest('.ov .bs');if(!bs||bs.closest('.pcw'))return;const r=bs.getBoundingClientRect(),y=e.touches[0].clientY;if(y-r.top>96&&bs.scrollTop>0)return;st={bs,y0:y,dy:0,ov:bs.closest('.ov')};bs.style.transition='none'},{passive:true});
  document.addEventListener('touchmove',e=>{if(!st)return;const dy=e.touches[0].clientY-st.y0;if(dy<=0||st.bs.scrollTop>0){st.dy=0;st.bs.style.transform='';return}st.dy=dy;st.bs.style.transform='translateY('+dy+'px)'},{passive:true});
  document.addEventListener('touchend',()=>{if(!st)return;const s=st;st=null;s.bs.style.transition='transform .2s ease';if(s.dy>110&&s.ov&&s.ov.getAttribute('onclick')){s.bs.style.transform='translateY(100%)';setTimeout(()=>s.ov.click(),170)}else s.bs.style.transform=''},{passive:true});
  document.addEventListener('touchcancel',()=>{if(st){st.bs.style.transform='';st=null}},{passive:true})
})();
function tsInit(){const e=document.querySelector('.ts');if(!e||e.dataset.run)return;e.dataset.run='1';
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const n=e.children.length;if(n<2||e.scrollWidth<=e.clientWidth+8)return;
  e.insertAdjacentHTML('beforeend',e.innerHTML);[...e.children].slice(n).forEach(c=>c.setAttribute('aria-hidden','true'));
  let pos=e.scrollLeft,hold=false,rs=0,last=0,vis=true;
  const pause=()=>{hold=true;clearTimeout(rs)},go=(ms)=>{clearTimeout(rs);rs=setTimeout(()=>{pos=e.scrollLeft;hold=false},ms)};
  e.addEventListener('touchstart',pause,{passive:true});e.addEventListener('touchend',()=>go(3500),{passive:true});e.addEventListener('touchcancel',()=>go(3500),{passive:true});
  e.addEventListener('mouseenter',pause);e.addEventListener('mouseleave',()=>go(1200));
  e.addEventListener('wheel',()=>{pause();go(3500)},{passive:true});
  try{new IntersectionObserver(r=>{vis=r[0].isIntersecting}).observe(e)}catch(x){}
  const half=()=>e.children[n].offsetLeft-e.children[0].offsetLeft;
  const step=ts=>{if(!document.contains(e))return;if(last&&!hold&&vis){const dt=Math.min(64,ts-last);pos+=dt*0.035;const h=half();if(h>0&&pos>=h)pos-=h;e.scrollLeft=pos}last=ts;requestAnimationFrame(step)};
  e.addEventListener('scroll',()=>{if(hold){pos=e.scrollLeft;const h=half();if(h>0&&pos>=h){pos-=h;e.scrollLeft=pos}}},{passive:true});
  requestAnimationFrame(step)}
function isDark(){const a=document.documentElement.getAttribute('data-theme');return a?a==='dark':!!(window.matchMedia&&matchMedia('(prefers-color-scheme:dark)').matches)}
function thToggle(){setTh(isDark()?'light':'dark')}
function thSw(){const d=isDark();return `<button class="tsw" role="switch" aria-checked="${d}" aria-label="Mode gelap" onclick="thToggle()"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/></svg><i></i></button>`}
let ikL=[];
function ikVcf(tx){const o=[];String(tx).split(/BEGIN:VCARD/i).slice(1).forEach(b=>{b=b.replace(/\r/g,'').replace(/\n[ \t]/g,'');let fn=((b.match(/^FN[^:\n]*:(.*)$/mi)||[])[1]||'').trim();if(!fn)fn=((b.match(/^N[^:\n]*:(.*)$/mi)||[])[1]||'').split(';').filter(Boolean).reverse().join(' ').trim();[...b.matchAll(/^TEL[^:\n]*:(.*)$/gmi)].forEach(m=>o.push({n:fn,t:m[1].trim()}))});return o}
function ikTxt(tx){const o=[];String(tx).split(/\n/).forEach(l=>{l=l.trim();if(!l)return;const m=l.match(/(\+?\d[\d\s\-().]{7,}\d)/);if(!m)return;o.push({n:l.replace(m[1],'').replace(/[,;|\t]+/g,' ').trim(),t:m[1].trim()})});return o}
function closeIs(){const e=document.getElementById('is');if(e)e.remove()}
function openIs(){closeIs();const api='contacts' in navigator;
  $('#app').insertAdjacentHTML('beforeend',`<div class="ov hi mr" id="is" onclick="if(event.target===this)closeIs()"><div class="bs" style="max-height:90vh;overflow:auto"><div class="grip"></div><div class="row" style="margin:10px 0"><b style="font-size:19px">Import Kontak</b><button class="bk" onclick="closeIs()" aria-label="Tutup">×</button></div>
  ${api?'<button class="mrow" onclick="cuKontak(1)"><span class="sic">📇</span><span><b>Dari kontak HP</b><div class="mut" style="font-size:13px">Pilih kontak lewat jendela bawaan HP</div></span></button>':''}
  <label class="mrow" style="cursor:pointer"><span class="sic">📄</span><span><b>Dari berkas kontak (.vcf)</b><div class="mut" style="font-size:13px">Ekspor kontak dari aplikasi Kontak, lalu pilih berkasnya</div></span><input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" style="display:none" onchange="ikFile(this)"></label>
  <div class="kth">ATAU TEMPEL DAFTAR</div><textarea id="ikt" placeholder="Satu baris satu kontak. Contoh:&#10;Budi Santoso, 081234567890&#10;Siti 0812-3456-7777" style="min-height:96px"></textarea><button class="b" style="width:100%;margin:10px 0 0" onclick="ikShow(ikTxt($('#ikt').value))">Lanjut</button></div></div>`)}
function ikFile(el){const f=el.files&&el.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const tx=String(r.result||'');ikShow(/BEGIN:VCARD/i.test(tx)?ikVcf(tx):ikTxt(tx))};r.readAsText(f)}
function ikShow(a){closeIs();closeIk();if(!a||!a.length){toast('Tidak ada nomor yang terbaca');return}
  const seen=new Set((S.cu||[]).map(c=>nw(c.wa)));
  ikL=a.map(x=>{const k=nw(x.t),ok=validWa(x.t);let st=ok?'':'Nomor tidak valid';if(ok&&seen.has(k))st='Sudah ada';else if(ok)seen.add(k);return {n:(x.n||'').trim(),t:x.t,k,st,on:false}});
  $('#app').insertAdjacentHTML('beforeend',`<div class="sheet" id="ik"><div class="sin"><div class="hd2"><button class="bk" onclick="closeIk()" aria-label="Kembali">←</button><h1 style="margin:0">Import Kontak</h1><a class="lnk2" style="margin-left:auto" onclick="ikAll()">Pilih Semua</a></div><input id="iks" placeholder="Cari nama atau nomor..." oninput="ikDraw()"><div id="ikl"></div><div style="position:sticky;bottom:0;padding:12px 0;background:var(--bg)"><button class="b" id="ikb" style="width:100%;margin:0;padding:14px" onclick="ikGo()"></button></div></div></div>`);ikDraw()}
function closeIk(){const e=document.getElementById('ik');if(e)e.remove()}
function ikDraw(){const q=String((($('#iks')||{}).value)||'').toLowerCase();
  $('#ikl').innerHTML=ikL.map((x,i)=>({x,i})).filter(({x})=>(x.n+' '+x.t).toLowerCase().includes(q)).map(({x,i})=>`<div class="ikr ${x.st?'off':''}" onclick="ikTog(${i})"><span class="pca">${esc((x.n||x.t||'?')[0].toUpperCase())}</span><span class="pcn"><b>${esc(x.n||x.t)}</b><small>${esc(x.t)}${x.st?' · '+x.st:''}</small></span><input type="checkbox" ${x.on?'checked':''} ${x.st?'disabled':''} onclick="event.stopPropagation()" onchange="ikTog(${i})"></div>`).join('')||'<p class="mut" style="text-align:center">Tidak ditemukan.</p>';
  const n=ikL.filter(x=>x.on).length,b=$('#ikb');if(b){b.textContent=n?'Impor '+n+' pelanggan':'Pilih kontak yang akan diimpor';b.disabled=!n;b.style.opacity=n?1:.5}}
function ikTog(i){const x=ikL[i];if(!x||x.st)return;x.on=!x.on;ikDraw()}
function ikAll(){const ok=ikL.filter(x=>!x.st),all=ok.every(x=>x.on);ok.forEach(x=>x.on=!all);ikDraw()}
function ikGo(){const a=ikL.filter(x=>x.on&&!x.st);if(!a.length)return;S.cu=S.cu||[];a.forEach(x=>{if(S.cu.some(c=>nw(c.wa)===x.k))return;S.cu.push({nama:x.n||('Pelanggan '+String(x.k).slice(-4)),wa:x.t,alamat:'',cat:'',blok:0,t:Date.now(),kd:nextKd()})});aud('Import kontak',null,a.length+' pelanggan');ss('tab','pel');closeIk();save()}
document.addEventListener('click',e=>{try{if(navigator.vibrate&&e.target.closest&&e.target.closest('.b,.nv button,.kc,.tl,.st2,.mrow,.pcr'))navigator.vibrate(8)}catch(x){}},{passive:true});
function stokMap(items){const m={};(items||[]).forEach(x=>{const v=SV[x.sv];if(v&&v.p&&v.st!=null)m[x.sv]=(m[x.sv]||0)+(+x.qty||0)});return m}
function stokCek(it,old){const n=stokMap(it),o=stokMap(old);for(const k in n){const s=(SV[k].st||0)+(o[k]||0);if(n[k]>s)return SV[k].n+' hanya tersisa '+s}return ''}
function stokGeser(items,sg){const m=stokMap(items);for(const k in m)SV[k].st=Math.max(0,(SV[k].st||0)+sg*m[k])}
function umumWa(){let c=(S.cu||[]).find(x=>x.wa==='620000000000');if(!c)(S.cu=S.cu||[]).push(c={nama:'Pelanggan Umum',wa:'620000000000',alamat:'',cat:'',blok:0,t:Date.now(),kd:nextKd()});return c.wa}
function jualOpen(){if(!S.prd.some(p=>p.on!==0)){toast('Belum ada produk. Tambahkan di Atur → Produk.');if(owner())nvA('set');return}nvA('baru');setTimeout(()=>openPk('Produk'),60)}
function tambahPrd(n){bacaSv();S.prd.push({k:'p'+Date.now().toString(36),n:n||'Produk baru',h:0,u:'pcs',j:0,on:1,p:1,st:null});S.prd.forEach(p=>{SV[p.k]=p});draw()}
function togPrd(i){bacaSv();S.prd[i].on=S.prd[i].on===0?1:0;draw()}
function hapusPrd(i){const p=S.prd[i];if(!p)return;if(S.orders.some(o=>items(o).some(x=>x.sv===p.k))){toast('Produk ini sudah dipakai di order. Nonaktifkan saja.');return}ask('Hapus produk "'+p.n+'"?',()=>{bacaSv();delete SV[p.k];S.prd.splice(i,1);draw()},'Hapus')}
function draw(){const sh=document.querySelector('.sheet:not(#pk)'),st=sh?sh.scrollTop:0,wy=window.scrollY,ch=navKey()!==_lk;
  adm?dAdm():scr==='pin'?dPin():scr==='sbl'?dSbLogin():scr==='reg'?dReg():dCust();
  if(_pop)_pop=false;else pushH();
  const s2=document.querySelector('.sheet:not(#pk)');if(s2)s2.scrollTop=ch?0:st;
  if(ch){document.body.classList.remove('nvh');const a=document.getElementById('app');if(a){a.classList.remove('pgin');void a.offsetWidth;a.classList.add('pgin')}}
  try{window.scrollTo(0,ch?0:wy)}catch(e){}
  setTimeout(tsInit,60)}
function backfill(){['sal','tebus'].forEach(f=>{if(!S[f])return;const n={};Object.keys(S[f]).forEach(k=>{const nk=nw(k);n[nk]=(n[nk]||0)+S[f][k]});S[f]=n});(S.tu||[]).forEach(x=>{x.k=nw(x.k)});
  [...S.orders].sort((a,b)=>a.id-b.id).forEach(o=>{if(!o.no)o.no=newNo(o.masuk)});migrate()}
function splash(){if(adm)return;const d=document.createElement('div');d.id='spl';d.innerHTML=`${S.logo?`<img src="${esc(S.logo)}" alt="">`:''}<b>${esc(S.nama)}</b>`;document.body.appendChild(d);setTimeout(()=>{d.style.opacity=0;setTimeout(()=>d.remove(),450)},800)}

(async function boot(){
{const a=document.getElementById('app');if(a&&sbOk())a.innerHTML='<p style="text-align:center;margin:40vh 16px 0;opacity:.6">Memuat data…</p>'}
await sbBoot();
if(SB_ROLE!=='staf'){adm=false;ss('adm',null)}else{adm=true;ss('adm','1')}
if(S.warna)document.documentElement.style.setProperty('--pri',S.warna);
backfill();applyTh();
let _autoSave=false;{const bk=SB_ROLE==='staf'?bkLocal():null;if(bk&&bk.from&&bk.from===S.stamp){try{Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,bk.data);backfill();_autoSave=true}catch(e){}}}
{const t0=+sg('t0');if(t0){ss('t0',null);const s=(Date.now()-t0)/1000;if(s>0&&s<180)setTimeout(()=>toast('Tersimpan dalam '+s.toFixed(1)+' detik'),500)}}
{const t0=sg('tab'),d0=sg('ds'),dt=sg('det'),sy=+sg('sy');if(t0){tab=t0;ss('tab',null)}if(d0){ds=d0;ss('ds',null)}if(dt){detId=+dt;ss('det',null)}if(sy){ss('sy',null);setTimeout(()=>{try{window.scrollTo(0,sy)}catch(e){}},120)}}
if(ds==='mut'&&mutT)mutR=mutParse(mutT);
lacakDariUrl();try{history.replaceState(navSnap(),'');_lk=navKey()}catch(e){}
splash();draw();
if(_autoSave)setTimeout(()=>{toast('Menyimpan perubahan berikutnya…');save()},500);
else if(SB_PERAN==='owner'&&(S.pin||(S.kar||[]).some(k=>k.pin)))setTimeout(save,900);
})();
