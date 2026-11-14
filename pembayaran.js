/* Hafan Laundry - halaman Pembayaran (v1.3.16)
   Dua area TERPISAH: QIOS (QiosPay) dan Mutasiku. Tiap area punya service, state, filter, dan daftar sendiri.
   Sumber data (hanya baca, lewat RPC staf): kl_mutasi_riwayat (pembayaran diterima) dan kl_tagihan_qris (tagihan QRIS online).
   Catatan: data pembayaran KELUAR tidak ada di sistem ini (webhook hanya mengirim uang masuk), jadi tidak ditampilkan. */
(function(){
'use strict';
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const rp=n=>'Rp'+Math.round(+n||0).toLocaleString('id-ID');
const JAM=t=>{try{return new Date(t).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}catch(e){return ''}};
const TGL=t=>{try{return new Date(t).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}catch(e){return ''}};
const WKT=t=>{try{return new Date(t).toLocaleString('id-ID',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return '-'}};
const ymd=d=>{const z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())};
function dayLbl(t){const d=new Date(t),n=new Date(),a=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(),b=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime(),k=Math.round((a-b)/864e5);
  return k===0?'Hari ini':k===1?'Kemarin':d.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
const IK=(n,s)=>(window.ikt&&window.IK&&window.IK[n])?window.ikt(n,s||40):'';

/* ---------- konfigurasi area ---------- */
const AREA={
  qios:{id:'qios',nama:'QIOS',penyedia:'QiosPay',tag:'qp',
    tentang:'Tagihan QRIS dibuat per pesanan oleh QiosPay. Pembayaran terdeteksi otomatis lewat webhook QiosPay.',
    kosongTagihan:'Belum ada tagihan QRIS QiosPay untuk pesanan Toko atau halaman Lacak.',
    kosongDiterima:'Belum ada pembayaran yang diterima lewat QiosPay.'},
  mutasiku:{id:'mutasiku',nama:'Mutasiku',penyedia:'Mutasiku',tag:'mq',
    tentang:'Memantau mutasi uang masuk di akun GoPay Merchant (atau akun lain) yang terhubung ke Mutasiku. Mode QRIS per tagihan membuat QR per pesanan seperti QiosPay.',
    kosongTagihan:'Belum ada tagihan QRIS Mutasiku. Tagihan muncul bila Penyedia memakai "Mutasiku QRIS per tagihan".',
    kosongDiterima:'Belum ada mutasi uang masuk yang diterima lewat Mutasiku.'}};
const STS={ // status pembayaran diterima (kl_mutasi.status)
  baru:{t:'Belum dicocokkan',c:'warn'},selesai:{t:'Sudah dicatat',c:'ok'},abaikan:{t:'Diabaikan',c:'mut'}};
const STT={ // status tagihan QRIS
  menunggu:{t:'Menunggu',c:'warn'},lunas:{t:'Lunas',c:'ok'},kedaluwarsa:{t:'Kedaluwarsa',c:'mut'}};

/* ---------- state: terpisah per area ---------- */
const mk=()=>({dtOpen:false,tab:'diterima',status:'',pre:'semua',dari:'',sampai:'',cari:'',items:[],ada:false,cur:null,off:0,ring:null,load:false,err:'',ok:false,req:0});
const ST={area:(function(){try{return sessionStorage.getItem('byr_area')||''}catch(e){return ''}})(),a:{qios:mk(),mutasiku:mk()},sel:null,busy:false};
if(!AREA[ST.area])ST.area=null;
const cur=()=>ST.a[ST.area];
function aktif(){try{return S.mutProv===MUT_QP?'qios':(S.mutProv===MUT_MQ||S.mutProv==='Mutasiku')?'mutasiku':''}catch(e){return ''}}
function areaDefault(){return ST.area||aktif()||'qios'}

/* ---------- service ---------- */
const SVC={
  async diterima(area,s){
    const a={p_area:area,p_status:s.status||null,p_dari:s.dari||null,p_sampai:s.sampai||null,p_cari:s.cari||null,p_sebelum:s.cur,p_limit:30};
    return await sbRpc('kl_mutasi_riwayat',a,true)},
  async tagihan(area,s){
    const a={p_area:area,p_status:s.status||null,p_dari:s.dari||null,p_sampai:s.sampai||null,p_cari:s.cari||null,p_offset:s.off,p_limit:30};
    return await sbRpc('kl_tagihan_qris',a,true)}};
function errMsg(e){const m=String((e&&e.message)||e||'');
  if(e&&(e.status===404)||/Could not find|PGRST202|does not exist|42883/i.test(m))return 'Fitur ini belum aktif di server. Jalankan sql/19_riwayat_pembayaran.sql di Supabase.';
  if(/DITOLAK|42501|permission/i.test(m))return 'Akses ditolak. Masuk lagi sebagai staf.';
  if(/fetch|network|load failed|abort|timeout|JARINGAN/i.test(m))return 'Tidak ada koneksi internet. Periksa jaringan lalu coba lagi.';
  return 'Gagal memuat data. '+m.slice(0,80)}

async function muat(ulang){
  const area=ST.area,s=cur();if(!s)return;
  if(ulang){s.items=[];s.cur=null;s.off=0;s.ada=false;s.ring=null}
  const id=++s.req;s.load=true;s.err='';paintList();if(ulang)paintTop();
  try{
    const j=s.tab==='tagihan'?await SVC.tagihan(area,s):await SVC.diterima(area,s);
    if(id!==s.req)return;                 // jawaban basi (filter/area sudah berganti)
    const it=(j&&j.items)||[];s.items=s.items.concat(it);s.ada=!!(j&&j.ada_lagi);s.ring=(j&&j.ringkas)||s.ring;s.ok=true;
    if(s.tab==='tagihan')s.off=s.items.length;else s.cur=it.length?it[it.length-1].id:s.cur;
  }catch(e){if(id!==s.req)return;s.err=errMsg(e)}
  s.load=false;paintTop();paintList()}

/* ---------- tampilan ---------- */
function page(){
  if(!ST.area)ST.area=areaDefault();
  setTimeout(()=>{const s=cur();if(!s.ok&&!s.load&&!s.err)muat(true)},0);
  return `<div class="by" id="pb-root"><div id="pb-top">${top()}</div><div id="pb-list">${list()}</div></div>`}
function top(){
  const s=cur(),A=AREA[ST.area],ak=aktif(),own=(()=>{try{return owner()}catch(e){return false}})();
  const areas=['qios','mutasiku'].map(k=>`<button role="tab" aria-selected="${k===ST.area}" class="${k===ST.area?'on':''}" onclick="PB.area('${k}')"><span>${AREA[k].nama}</span>${ak===k?'<i>Aktif</i>':''}</button>`).join('');
  const info=`<div class="by-info"><div><b>${A.nama}${ak===ST.area?' · penyedia aktif':''}</b><p>${E(A.tentang)}</p></div>${own&&ak!==ST.area?`<button class="b g" onclick="PB.aktifkan()">Jadikan aktif</button>`:''}</div>`;
  const r=s.ring,sum=s.tab==='tagihan'
    ?(r?[['Menunggu',r.menunggu||0,'#d99a00'],['Lunas',r.lunas||0,'#1e9e5a'],['Kedaluwarsa',r.kedaluwarsa||0,'']]:null)
    :(r?[['Total diterima',rp(r.total),'#1e9e5a'],['Transaksi',r.n||0,''],['Belum dicocokkan',r.baru||0,(r.baru||0)>0?'#d99a00':'']]:null);
  const sm=sum?`<div class="by-sum">${sum.map(([l,v,c])=>`<div><small>${l}</small><b${c?` style="color:${c}"`:''}>${v}</b></div>`).join('')}</div>`:`<div class="by-sum"><div><small>Memuat</small><b><span class="pf-sk"></span></b></div></div>`;
  const tabs=`<div class="by-tabs" role="tablist"><button role="tab" class="${s.tab==='diterima'?'on':''}" onclick="PB.tab('diterima')">Diterima</button><button role="tab" class="${s.tab==='tagihan'?'on':''}" onclick="PB.tab('tagihan')">Tagihan online</button></div>`;
  const stOp=s.tab==='tagihan'?[['','Semua'],['menunggu','Menunggu'],['lunas','Lunas'],['kedaluwarsa','Kedaluwarsa']]:[['','Semua'],['baru','Belum dicocokkan'],['selesai','Dicatat'],['abaikan','Diabaikan']];
  const chipS=`<div class="by-chips" role="group" aria-label="Status">${stOp.map(([k,l])=>`<button class="${s.status===k?'on':''}" onclick="PB.status('${k}')">${l}</button>`).join('')}</div>`;
  const chipD=`<div class="by-chips" role="group" aria-label="Periode">${[['semua','Semua tanggal'],['hari','Hari ini'],['7','7 hari'],['30','30 hari']].map(([k,l])=>`<button class="${s.pre===k?'on':''}" onclick="PB.pre('${k}')">${l}</button>`).join('')}</div>`;
  const q=`<div class="by-flt"><input id="pb-q" type="search" inputmode="search" placeholder="${s.tab==='tagihan'?'Cari kode atau nama':'Cari referensi, keterangan, nominal'}" value="${E(s.cari)}" oninput="PB.cari(this.value)" aria-label="Cari"></div>`;
  const dtl=`<details class="by-dtl"${s.dtOpen||s.dari||s.sampai?' open':''} ontoggle="PB.dtl(this.open)"><summary>Pilih tanggal sendiri</summary><div class="by-dt"><label>Dari<input type="date" id="pb-d1" value="${E(s.dari)}" onchange="PB.tgl()"></label><label>Sampai<input type="date" id="pb-d2" value="${E(s.sampai)}" onchange="PB.tgl()"></label></div></details>`;
  return `<div class="by-area" role="tablist" aria-label="Area pembayaran">${areas}</div>${info}${sm}${tabs}${q}${chipS}${chipD}${dtl}`}
const skel=()=>Array.from({length:5},()=>`<div class="by-it"><span class="pf-sk" style="width:42px;height:42px;border-radius:14px"></span><div style="flex:1"><span class="pf-sk" style="width:55%"></span><br><span class="pf-sk" style="width:80%;margin-top:8px"></span></div></div>`).join('');
function itemHtml(x,i){
  const s=cur();
  if(s.tab==='tagihan'){const st=STT[x.status]||STT.menunggu;
    const sisa=x.status==='menunggu'&&x.batas?Math.max(0,Math.round((new Date(x.batas)-Date.now())/60000)):0;
    return `<button class="by-it" onclick="PB.detail(${i})"><span class="by-ic">${IK(x.sumber==='lacak'?'lacak':'toko',42)}</span><span class="by-t"><b>${rp(x.tb)}</b><span>${x.sumber==='lacak'?'Lacak':'Toko'} · ${E(x.kode)}${x.nama&&x.sumber==='toko'?' · '+E(x.nama):''}</span></span><span class="by-r"><i class="by-p ${st.c}">${st.t}</i><small>${x.status==='menunggu'&&sisa?sisa+' mnt lagi':JAM(x.bayar_t||x.dibuat)}</small></span></button>`}
  const st=STS[x.status]||STS.baru;
  return `<button class="by-it" onclick="PB.detail(${i})"><span class="by-ic">${IK('bayar',42)}</span><span class="by-t"><b class="by-in">+${rp(x.jumlah)}</b><span>${E((x.ket||x.ref||'Pembayaran masuk').slice(0,70))}</span></span><span class="by-r"><i class="by-p ${st.c}">${st.t}</i><small>${JAM(x.waktu||x.dibuat)}</small></span></button>`}
function list(){
  const s=cur(),A=AREA[ST.area];
  if(s.err)return `<div class="by-empty"><p>${E(s.err)}</p><button class="b" onclick="PB.coba()">Coba lagi</button></div>`;
  if(!s.items.length&&s.load)return `<div class="by-list">${skel()}</div>`;
  if(!s.items.length){
    const filt=s.cari||s.status||s.dari||s.sampai||s.pre!=='semua';
    return `<div class="by-empty">${IK('bayar',56)}<p>${filt?'Tidak ada data yang cocok dengan filter ini.':E(s.tab==='tagihan'?A.kosongTagihan:A.kosongDiterima)}</p>${filt?`<button class="b g" onclick="PB.reset()">Hapus filter</button>`:''}</div>`}
  let h='',last='';
  s.items.forEach((x,i)=>{const t=s.tab==='tagihan'?(x.dibuat):(x.waktu||x.dibuat),l=dayLbl(t);if(l!==last){h+=`<div class="by-day">${E(l)}</div>`;last=l}h+=itemHtml(x,i)});
  return `<div class="by-list">${h}</div>${s.ada?`<button class="b g by-more" onclick="PB.lagi()"${s.load?' disabled':''}>${s.load?'Memuat…':'Muat lebih banyak'}</button>`:`<p class="by-end">${s.items.length} data ditampilkan</p>`}`}
function paintTop(){const e=$('#pb-top');if(!e)return;const q=$('#pb-q'),keep=q&&document.activeElement===q,pos=keep?q.selectionStart:0;e.innerHTML=top();if(keep){const n=$('#pb-q');n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}}
function paintList(){const e=$('#pb-list');if(e)e.innerHTML=list()}

/* ---------- aksi ---------- */
let _tm=0;
function setArea(k){if(!AREA[k]||k===ST.area)return;ST.area=k;try{sessionStorage.setItem('byr_area',k)}catch(e){}paintTop();paintList();const s=cur();if(!s.ok&&!s.load)muat(true)}
function setTab(t){const s=cur();if(s.tab===t)return;s.tab=t;s.status='';s.ok=false;s.items=[];s.ring=null;s.err='';muat(true)}
function setStatus(v){const s=cur();s.status=v;muat(true)}
function setPre(k){const s=cur(),n=new Date();s.pre=k;
  if(k==='semua'){s.dari='';s.sampai=''}else if(k==='hari'){s.dari=s.sampai=ymd(n)}
  else{const d=new Date(n);d.setDate(d.getDate()-(+k-1));s.dari=ymd(d);s.sampai=ymd(n)}
  muat(true)}
function setTgl(){const s=cur(),a=$('#pb-d1').value,b=$('#pb-d2').value;
  if(a&&b&&a>b){toast('Tanggal awal tidak boleh setelah tanggal akhir');paintTop();return}
  s.dari=a;s.sampai=b;s.pre=(a||b)?'':'semua';muat(true)}
function setCari(v){const s=cur();s.cari=String(v||'').trim().slice(0,60);clearTimeout(_tm);_tm=setTimeout(()=>muat(true),350)}
function dtl(o){const s=cur();if(s)s.dtOpen=!!o}
function reset(){const s=cur();s.cari='';s.status='';s.dari='';s.sampai='';s.pre='semua';muat(true)}
function lagi(){const s=cur();if(s.load||!s.ada)return;muat(false)}
function coba(){const s=cur();s.err='';muat(true)}

function detail(i){
  const s=cur(),x=s.items[i];if(!x)return;const A=AREA[ST.area];
  let rows,judul,sub;
  const R=(a,b)=>`<div class="pf-row" style="padding:11px 0"><span class="pf-t"><span>${a}</span><b style="font-size:15px;font-weight:650;overflow-wrap:anywhere">${b}</b></span></div>`;
  if(s.tab==='tagihan'){const st=STT[x.status]||STT.menunggu;judul='Tagihan QRIS';sub=A.nama+' · '+(x.sumber==='lacak'?'halaman Lacak':'pesanan Toko');
    rows=[R('Status',`<i class="by-p ${st.c}">${st.t}</i>`),R('Total tagihan',rp(x.tb)),R('Nominal',rp(x.nominal)),...(x.ku>0?[R('Kode unik',x.ku)]:[]),R('Kode',E(x.kode)),...(x.nama?[R('Nama',E(x.nama))]:[]),R('Dibuat',WKT(x.dibuat)),...(x.bayar_t?[R('Dibayar',WKT(x.bayar_t))]:x.batas?[R('Berlaku sampai',WKT(x.batas))]:[]),R('Percobaan tagihan ke-',x.n||1)]}
  else{const st=STS[x.status]||STS.baru;judul='Pembayaran diterima';sub=A.nama;
    let ord='';try{if(x.ke){const o=(S.orders||[]).find(z=>String(z.id)===String(x.ke));ord=o?nn(o)+' · '+o.nama:'Order #'+x.ke}}catch(e){}
    rows=[R('Jumlah',`<span class="by-in">+${rp(x.jumlah)}</span>`),R('Status',`<i class="by-p ${st.c}">${st.t}</i>`),R('Waktu',WKT(x.waktu||x.dibuat)),R('Referensi',E(x.ref||'-')),R('Sumber',E(x.akun||A.penyedia)),...(x.ket?[R('Keterangan',E(x.ket))]:[]),...(ord?[R('Dicocokkan ke',E(ord))]:[])]}
  const ref=s.tab==='tagihan'?x.kode:(x.ref||'');
  PF.sheet(judul,sub,`<div class="pf-grp">${rows.join('')}</div>${ref?`<button class="pf-btn sec" onclick="PB.salin('${E(ref).replace(/'/g,'')}')">${PF.ico('copy')}Salin ${s.tab==='tagihan'?'kode':'referensi'}</button>`:''}`)}
function salin(t){const ok=()=>PF.toast('Disalin');
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,()=>PF.toast('Tidak bisa menyalin',true))}else{PF.toast('Tidak bisa menyalin',true)}}

/* ganti penyedia aktif (owner) */
function aktifkan(){
  const A=AREA[ST.area],mode=ST.area==='qios'?MUT_QP:MUT_MQ;
  PF.sheet('Jadikan '+A.nama+' penyedia aktif?','Hanya berlaku untuk pembayaran baru.',
    `<div class="pf-info">${PF.ico('info')}<span>Tagihan yang sudah dibuat tetap berlaku dan tetap terdeteksi. ${ST.area==='mutasiku'?'Mode ini memakai Mutasiku QRIS per tagihan (GoPay Merchant). Untuk QRIS statis, ubah di Pengaturan.':'Pastikan fungsi dan secret QiosPay masih terpasang.'}</span></div>
     <button class="pf-btn" id="pb-ak" onclick="PB.doAktif()">Ya, jadikan aktif</button><button class="pf-btn sec" onclick="PF.close()">Batal</button>`)}
async function doAktif(){
  if(ST.busy)return;ST.busy=true;const b=$('#pb-ak');if(b){b.disabled=true;b.innerHTML='<i class="pf-sp"></i>Menyimpan…'}
  const lama=S.mutProv,lamaPm=S.pm&&S.pm.qp;
  try{S.mutProv=ST.area==='qios'?MUT_QP:MUT_MQ;S.pm=Object.assign({},S.pm||{},{qp:1});S.mutCk=[];
    const ok=await save();
    if(ok===false){throw new Error('Penyimpanan tidak selesai')}
    PF.close();PF.toast('Penyedia aktif: '+AREA[ST.area].nama);paintTop();
  }catch(e){S.mutProv=lama;S.pm=Object.assign({},S.pm||{},{qp:lamaPm});PF.close();PF.toast('Gagal mengganti penyedia. '+String(e.message||e).slice(0,60),true)}
  ST.busy=false}

window.PB={dtl,page,area:setArea,tab:setTab,status:setStatus,pre:setPre,tgl:setTgl,cari:setCari,reset,lagi,coba,detail,salin,aktifkan,doAktif};
})();
