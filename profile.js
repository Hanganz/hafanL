/* Hafan Laundry - halaman Profile (v1.3.12)
   Modul mandiri: window.PF. Dipakai oleh dProf() (staf) dan dAkun() (pelanggan) di app.js.
   Staf      : data profil di Supabase Auth (user_metadata), kata sandi lewat Auth, foto di perangkat.
   Pelanggan : bio, foto, dan preferensi disimpan di perangkat (akun pelanggan dikelola admin). */
(function(){
'use strict';
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const LS={g(k){try{return localStorage.getItem(k)}catch(e){return null}},s(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v);return true}catch(e){return false}}};
const DEF={getar:true,telat:true,sistem:false,mask:false,hidefoto:false,accent:'violet',ts:'n',rad:'round'};
const ST={st:0,p:null,user:null,meta:{},prefs:null,act:'semua',cat:'semua',draft:null};
let RI=1;

/* ---------- ikon ---------- */
const IC={
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
at:'<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
mail:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',
phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
cal:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
edit:'<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
cam:'<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
lock:'<rect x="4" y="11" width="16" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3"/>',
shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
bell:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
eyeoff:'<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
hist:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>',
info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
out:'<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="m16 8 4 4-4 4M20 12H9"/>',
check:'<path d="m5 12 5 5 9-10"/>',
x:'<path d="M6 6l12 12M18 6 6 18"/>',
chev:'<path d="M9 6l6 6-6 6"/>',
trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
img:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m4 18 5-5 4 4 3-3 4 4"/>',
dev:'<rect x="7" y="2" width="10" height="20" rx="3"/><path d="M11 18h2"/>',
star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
vib:'<rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4 9v6M20 9v6"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
wa:'<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/>',
copy:'<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
refresh:'<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>',
bio:'<path d="M5 5h14M5 10h14M5 15h9"/>',
mask:'<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>',
palette:'<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2-.6-1.3.2-3 2-3H18a3 3 0 0 0 3-3c0-5-4-10-9-10z"/><path d="M7.5 11h.01M10 7.5h.01M14.5 7.5h.01"/>'};
const ico=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||''}</svg>`;
const CH='<svg class="pf-ch" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';

/* ---------- identitas & penyimpanan ---------- */
const staf=()=>{try{return SB_ROLE==='staf'}catch(e){return false}};
const isOwner=()=>{try{return owner()}catch(e){return false}};
const acc=()=>{try{return curAcc()||{}}catch(e){return {}}};
const fk=()=>'kl_pf_foto_'+(staf()?'s_'+(typeof SB_EM!=='undefined'?SB_EM:''):'c_'+(acc().w||''));
const ck=()=>'kl_pf_c_'+(acc().w||'');
function P(){if(ST.prefs)return ST.prefs;let l={};try{l=JSON.parse(LS.g('kl_pf_pref')||'{}')||{}}catch(e){}ST.prefs=Object.assign({},DEF,l,(staf()&&ST.meta&&ST.meta.prefs)||{});return ST.prefs}
let _pt=0;
function setPref(k,v){const p=P();p[k]=v;LS.s('kl_pf_pref',JSON.stringify(p));if(staf()){clearTimeout(_pt);_pt=setTimeout(()=>{authReq('PUT',{data:{prefs:p}}).catch(()=>{})},700)}}
function ident(){
  if(staf()){const m=ST.meta||{},em=(typeof SB_EM!=='undefined'&&SB_EM)||(ST.user&&ST.user.email)||'',loc=em.split('@')[0]||'';
    const nm=String(m.full_name||(typeof SB_NAMA!=='undefined'&&SB_NAMA)||loc||(isOwner()?'Owner':'Kasir')).trim()||'Staf';
    return {mode:'staf',nama:nm,un:m.username||loc.toLowerCase().replace(/[^a-z0-9_.]/g,''),email:em,tel:m.phone||'',bio:m.bio||'',joined:ST.user&&ST.user.created_at,last:ST.user&&ST.user.last_sign_in_at,role:isOwner()?'Owner':'Kasir'}}
  const a=acc();let l={};try{l=JSON.parse(LS.g(ck())||'{}')||{}}catch(e){}
  return {mode:'pelanggan',nama:String(a.n||'Pelanggan').trim()||'Pelanggan',un:'',email:'',tel:a.tw||'',bio:l.bio||'',role:'Pelanggan'}}
const maskE=e=>{const i=e.indexOf('@');return i<2?e:e[0]+'•••'+e.slice(i)};
const maskT=t=>{t=String(t);return t.length<6?t:t.slice(0,4)+'••••'+t.slice(-2)};
const fdate=i=>{try{return new Date(i).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}catch(e){return '-'}};
const fdt=i=>{try{return new Date(i).toLocaleString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch(e){return '-'}};

/* ---------- jaringan (Supabase Auth) ---------- */
async function authReq(method,body){
  const t=await sbToken();if(!t){const e=new Error('Sesi habis. Masuk lagi.');e.status=401;throw e}
  const r=await fetch(SB_URL+'/auth/v1/user',{method,headers:{apikey:SB_KEY,'Content-Type':'application/json',Authorization:'Bearer '+t},body:body?JSON.stringify(body):undefined});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(j.msg||j.message||j.error_description||('HTTP '+r.status));e.status=r.status;throw e}return j}
function load(){
  if(!staf())return Promise.resolve();if(ST.p)return ST.p;ST.st=1;
  ST.p=(async()=>{try{const u=await authReq('GET');ST.user=u;ST.meta=u.user_metadata||{};ST.prefs=null;ST.st=2}catch(e){ST.st=3}ST.p=null;redraw()})();
  return ST.p}
async function ensure(){if(ST.st===2)return true;if(ST.p)await ST.p;else{ST.st=0;await load()}return ST.st===2}
function redraw(){try{if(document.querySelector('#app .pf'))draw()}catch(e){}}
function errMsg(e){const m=String((e&&e.message)||e);
  if(/same|different/i.test(m))return 'Kata sandi baru harus berbeda dari yang lama';
  if(/weak|at least|short|characters|pwned/i.test(m))return 'Kata sandi terlalu lemah. Pakai minimal 8 karakter, campur huruf dan angka';
  if(/invalid login|credentials/i.test(m))return 'Kata sandi saat ini salah';
  if(/reauth|recent/i.test(m))return 'Demi keamanan, keluar lalu masuk lagi sebelum mengganti kata sandi';
  if(/fetch|network|load failed|abort/i.test(m))return 'Tidak ada koneksi. Periksa internet lalu coba lagi';
  return m}

/* ---------- tampilan (aksen, ukuran teks, sudut) ---------- */
function applyLook(p){const h=document.documentElement;if(h.dataset.pfa!==p.accent)h.dataset.pfa=p.accent;if(h.dataset.pfs!==p.ts)h.dataset.pfs=p.ts;if(h.dataset.pfr!==p.rad)h.dataset.pfr=p.rad}
const ACC=[['violet','#8b7bff','Violet'],['blue','#4f8cff','Biru'],['pink','#f472b6','Merah muda'],['green','#34d399','Hijau'],['orange','#fb923c','Oranye']];
const TSZ=[['s','Kecil'],['n','Normal'],['l','Besar']],RAD=[['round','Bulat'],['soft','Lembut'],['crisp','Tegas']];
const themeMode=()=>{try{return thAuto()?'auto':isDark()?'dark':'light'}catch(e){return 'auto'}};
const lab=(a,k)=>(a.find(x=>x[0]===k)||[])[a===ACC?2:1]||'';
const nChg=()=>ST.draft?['accent','ts','rad'].filter(k=>ST.draft[k]!==P()[k]).length:0;
function openLook(){const p=P();
  sheet('Tampilan','Sesuaikan gaya halaman profil. Perubahan langsung terlihat.','<div id="pf-lk"></div><div class="pf-pend" id="pf-pb"><span id="pf-pn"></span><button class="pf-lnk" onclick="PF.lookReset()">Buang</button><button class="pf-btn" onclick="PF.lookSave()">Simpan</button></div>');ST.draft={accent:p.accent,ts:p.ts,rad:p.rad};lookRender()}
function lookRender(){const d=ST.draft;if(!d||!$('#pf-lk'))return;const m=themeMode(),seg=(arr,key,cur,fn)=>`<div class="pf-seg" role="group">${arr.map(x=>`<button class="${cur===x[0]?'on':''}" onclick="${fn}('${x[0]}')">${x[1]}</button>`).join('')}</div>`;
  $('#pf-lk').innerHTML=`<div class="pf-day" style="margin-top:2px">Tema aplikasi</div>${seg([['auto','Otomatis'],['light','Terang'],['dark','Gelap']],'t',m,'PF.theme')}
   <div class="pf-day">Warna aksen</div><div class="pf-dots">${ACC.map(a=>`<button class="${d.accent===a[0]?'on':''}" style="--d:${a[1]}" aria-label="${a[2]}" onclick="PF.look('accent','${a[0]}')">${d.accent===a[0]?ico('check'):''}</button>`).join('')}</div>
   <div class="pf-day">Ukuran teks</div>${seg(TSZ,'ts',d.ts,"PF.look.bind(null,'ts')")}
   <div class="pf-day">Gaya sudut</div>${seg(RAD,'rad',d.rad,"PF.look.bind(null,'rad')")}`;
  const n=nChg(),pb=$('#pf-pb');if(pb){pb.classList.toggle('on',n>0);$('#pf-pn').textContent=n+' perubahan'}}
function look(k,v){if(!ST.draft)return;ST.draft[k]=v;applyLook(ST.draft);lookRender()}
function lookReset(){const p=P();ST.draft={accent:p.accent,ts:p.ts,rad:p.rad};applyLook(ST.draft);lookRender()}
function lookSave(){const d=ST.draft;if(!d)return;['accent','ts','rad'].forEach(k=>{if(d[k]!==P()[k])setPref(k,d[k])});ST.draft=null;close();toast('Tampilan disimpan');redraw()}
function theme(k){try{setTh(k)}catch(e){}setTimeout(lookRender,30)}

/* ---------- toast ---------- */
function toast(m,type){let t=$('#pf-toast');if(!t){t=document.createElement('div');t.id='pf-toast';t.setAttribute('role','status');document.body.appendChild(t)}
  const bad=type===true||type==='bad',warn=type==='warn';t.className=bad?'bad':warn?'warn':'';
  t.innerHTML=`<i>${ico(bad?'x':warn?'bell':'check')}</i><span>${E(m)}</span>`;void t.offsetWidth;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2800)}

/* ---------- bottom sheet ---------- */
function sheet(title,sub,body){
  close(true);const o=document.createElement('div');o.className='pf-ov';o.id='pf-ov';
  o.innerHTML=`<div class="pf-sh" role="dialog" aria-modal="true" aria-label="${E(title)}"><div class="pf-gr"></div><button class="pf-x" aria-label="Tutup" onclick="PF.close()">${ico('x')}</button><h2>${E(title)}</h2>${sub?`<p class="pf-sub">${E(sub)}</p>`:''}<div class="pf-bd2" id="pf-bd">${body}</div></div>`;
  document.body.appendChild(o);document.documentElement.classList.add('pf-lock');
  requestAnimationFrame(()=>requestAnimationFrame(()=>o.classList.add('in')));
  o.addEventListener('mousedown',e=>{if(e.target===o)close()});grab(o)}
function close(now){if(ST.draft){ST.draft=null;applyLook(P())}const o=$('#pf-ov');if(!o)return;o.removeAttribute('id');document.documentElement.classList.remove('pf-lock');
  if(now){o.remove();return}o.classList.remove('in');setTimeout(()=>o.remove(),460)}
function grab(o){const sh=o.querySelector('.pf-sh'),g=o.querySelector('.pf-gr');let y0=0,dy=0,on=false;
  g.addEventListener('pointerdown',e=>{on=true;y0=e.clientY;dy=0;o.classList.add('drag');try{g.setPointerCapture(e.pointerId)}catch(x){}});
  g.addEventListener('pointermove',e=>{if(!on)return;dy=Math.max(0,e.clientY-y0);sh.style.transform='translateY('+dy+'px)'});
  const end=()=>{if(!on)return;on=false;o.classList.remove('drag');sh.style.transform='';if(dy>110)close()};
  g.addEventListener('pointerup',end);g.addEventListener('pointercancel',end)}
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});

/* ---------- potongan HTML ---------- */
function row(o){const tag=o.act?'button':'div';
  return `<${tag} class="pf-row${o.bad?' bad':''}"${o.act?` onclick="${o.act}"`:''}><span class="pf-ic"${o.bad?' style="--c:#ff6b7a"':''}>${ico(o.ic)}</span><span class="pf-t"><b>${o.t}</b>${o.s!=null&&o.s!==''?`<span${o.cls?` class="${o.cls}"`:''}>${o.s}</span>`:''}</span>${o.end||''}${o.act&&!o.nochev&&!o.end?CH:''}</${tag}>`}
const grp=a=>`<div class="pf-grp">${a.join('')}</div>`;
const lbl=t=>`<div class="pf-lbl">${t}</div>`;
const r=h=>`<div class="pf-r" style="--i:${Math.min(RI++,10)}">${h}</div>`;
const sk='<span class="pf-sk"></span>';
const swEl=on=>`<span class="pf-sw${on?' on':''}"><i></i></span>`;
function avatar(pc){const d=ident(),f=!P().hidefoto&&LS.g(fk());
  return `<div class="pf-av" style="--pc:${pc}"><div class="pf-ph">${f?`<img src="${E(f)}" alt="Foto profil">`:E(d.nama[0].toUpperCase())}</div><button class="pf-cam" onclick="PF.open('foto')" aria-label="Ganti foto profil">${ico('cam')}</button></div>`}

function lengkap(){const d=ident(),f=!!LS.g(fk());const a=d.mode==='staf'?[true,!!(ST.meta&&ST.meta.username),!!d.tel,!!d.bio,f]:[true,!!d.bio,f];return Math.round(a.filter(Boolean).length/a.length*100)}
function hero(o){o=o||{};RI=1;const d=ident(),pc=lengkap();if(staf()&&ST.st===0&&!ST.p)setTimeout(load,0);
  const mask=P().mask;
  const em=d.email?`<p class="pf-em">${E(mask?maskE(d.email):d.email)}</p>`:'';
  const un=d.un?`<p class="pf-un">@${E(d.un)}</p>`:(d.mode==='pelanggan'?`<p class="pf-un">${E(d.tel)}</p>`:'');
  const bg=d.mode==='staf'?`<span class="pf-bg">${ico(isOwner()?'star':'shield')}${E(d.role)}${isOwner()?' · akses penuh':' · akses kasir'}</span>`:`<span class="pf-bg">${ico('star')}${E(o.tier||'Member')}</span>`;
  return `<div class="pf-hero pf-r" style="--i:0">${avatar(pc)}<h1 class="pf-nm">${E(d.nama)}</h1>${un}${em}<div class="pf-bd">${bg}<span class="pf-bg ok"><i></i>Akun aktif</span></div><p class="pf-pcl"><b>Profil ${pc}% lengkap</b>${pc<100?' · lengkapi bio dan foto':''}</p><button class="pf-edit" onclick="PF.open('edit')">${ico('edit')}Edit profil</button></div>`}

function menus(){
  const d=ident(),s=d.mode==='staf',net=s&&ST.st!==2,mask=P().mask;
  const live=v=>net?sk:v;
  const info=[
    row({ic:'user',c:'#8b7bff',t:'Nama lengkap',s:E(d.nama)}),
    ...(s?[row({ic:'at',c:'#4f8cff',t:'Username',s:net&&!(ST.meta&&ST.meta.username)?sk:(d.un?'@'+E(d.un):'Belum diatur')}),
      row({ic:'mail',c:'#c084fc',t:'Email',s:E(mask?maskE(d.email):d.email||'-')}),
      row({ic:'phone',c:'#34d399',t:'Nomor telepon',s:live(d.tel?E(mask?maskT(d.tel):d.tel):'Belum diisi')}),
      row({ic:'cal',c:'#fbbf24',t:'Tanggal bergabung',s:live(d.joined?fdate(d.joined):'-')})]
     :[row({ic:'phone',c:'#34d399',t:'Nomor WhatsApp',s:E(d.tel||'-')})]),
    row({ic:'bio',c:'#f472b6',t:'Bio',s:live(d.bio?E(d.bio):'Belum ada deskripsi'),cls:'pf-bio'})];
  const p=P(),s2=s;
  const sumLook=({auto:'Otomatis',light:'Terang',dark:'Gelap'})[themeMode()]+' · '+lab(ACC,p.accent)+' · '+lab(RAD,p.rad);
  const sumNotif=[p.getar&&'Getar',s2&&p.telat&&'Pengingat',s2&&p.sistem&&'Sistem'].filter(Boolean).join(' · ')||'Semua mati';
  const pers=[
    row({ic:'edit',t:'Edit profil',s:s?'Nama, username, telepon, bio':'Bio profil',act:"PF.open('edit')"}),
    row({ic:'cam',t:'Foto profil',s:LS.g(fk())?'Foto sudah dipasang':'Pilih dari galeri atau kamera',act:"PF.open('foto')"}),
    row({ic:'palette',t:'Tampilan',s:E(sumLook),act:"PF.open('look')"})];
  const alert=[row({ic:'bell',t:'Notifikasi',s:E(sumNotif),act:"PF.open('notif')"})];
  const priv=[
    row({ic:'mask',t:'Privasi',s:p.mask||p.hidefoto?'Data disamarkan':'Data terlihat',act:"PF.open('privasi')"}),
    row({ic:'key',t:'Ganti kata sandi',s:s?'Perbarui kata sandi akun':'Cara mengatur ulang kata sandi',act:"PF.open('pass')"}),
    row({ic:'shield',t:'Keamanan akun',s:'Sesi, login terakhir, perangkat',act:"PF.open('aman')"})];
  const more=[
    row({ic:'hist',t:'Riwayat aktivitas',s:s?'Catatan tindakan di aplikasi':'Cucian yang pernah Anda buat',act:"PF.open('aktif')"}),
    row({ic:'help',t:'Pusat bantuan',s:'Pertanyaan umum dan kontak',act:"PF.open('bantuan')"}),
    row({ic:'info',t:'Tentang',s:'Versi dan informasi aplikasi',act:"PF.open('tentang')"})];
  return r(`<div class="pf-hd">${lbl('Informasi pribadi')}<button class="pf-lnk" onclick="PF.open('edit')">Ubah</button></div>${grp(info)}`)
    +r(lbl('Personalisasi')+grp(pers))
    +r(lbl('Pengingat')+grp(alert))
    +r(lbl('Privasi dan keamanan')+grp(priv))
    +r(lbl('Lainnya')+grp(more))
    +r(`<div style="margin-top:22px">${grp([row({ic:'out',t:'Keluar',s:s?'Akhiri sesi di perangkat ini':'Keluar dari akun pelanggan',act:"PF.open('keluar')",bad:1,nochev:1})])}</div>`)
    +`<p class="mut" style="text-align:center;margin:20px 0 0;font-size:12px;color:#9b97b0">${E((typeof S!=='undefined'&&S.nama)||'Hafan Laundry')} · v${E((window.KL_CONFIG||{}).VERSI||'')}</p>`}

/* ---------- edit profil ---------- */
const fld=(id,label,val,o)=>{o=o||{};return `<div class="pf-f" data-h="${E(o.hint||'')}"><label for="${id}">${label}</label>${o.area?`<textarea id="${id}" maxlength="${o.max}" oninput="PF.cnt(this)" placeholder="${E(o.ph||'')}">${E(val)}</textarea><span class="pf-cnt" id="${id}c" style="top:2px">${String(val).length}/${o.max}</span>`:`<input id="${id}" value="${E(val)}"${o.max?` maxlength="${o.max}"`:''}${o.ro?' readonly':''}${o.type?` type="${o.type}"`:''}${o.mode?` inputmode="${o.mode}"`:''}${o.ac?` autocomplete="${o.ac}"`:''}${o.on?` oninput="${o.on}"`:''} placeholder="${E(o.ph||'')}">`}<small>${E(o.hint||'')}</small></div>`};
function editForm(){const d=ident(),s=d.mode==='staf';
  return (s?fld('pf-n','Nama lengkap',d.nama,{max:40,ac:'name',hint:'Nama yang tampil di profil Anda'})
      +fld('pf-u','Username',d.un,{max:20,on:'PF.un(this)',ac:'username',hint:'3–20 karakter: huruf kecil, angka, titik, garis bawah'})
      +fld('pf-e','Email',d.email,{ro:1,hint:'Email dipakai untuk masuk dan tidak bisa diubah di sini'})
      +fld('pf-p','Nomor telepon',d.tel,{mode:'tel',max:20,ac:'tel',ph:'08123456789',hint:'Opsional'})
     :fld('pf-n','Nama',d.nama,{ro:1,hint:'Nama diatur admin saat akun dibuat'})+fld('pf-p','Nomor WhatsApp',d.tel,{ro:1,hint:'Dipakai untuk masuk'}))
    +fld('pf-b','Bio',d.bio,{area:1,max:160,ph:'Ceritakan sedikit tentang Anda',hint:s?'Tersimpan di akun Anda':'Tersimpan di perangkat ini'})
    +`<button class="pf-btn" id="pf-sv" onclick="PF.saveEdit()">Simpan perubahan</button>`}
async function openEdit(){
  if(!staf()){sheet('Edit profil','Perbarui bio profil Anda.',editForm());return}
  sheet('Edit profil','Perbarui informasi akun Anda.',`<div class="pf-f"><span class="pf-sk" style="width:100%;height:48px;border-radius:16px"></span></div><div class="pf-f"><span class="pf-sk" style="width:100%;height:48px;border-radius:16px"></span></div><div class="pf-f"><span class="pf-sk" style="width:100%;height:92px;border-radius:16px"></span></div>`);
  const ov=$('#pf-ov'),ok=await ensure();if(!ov||$('#pf-ov')!==ov)return;
  $('#pf-bd').innerHTML=ok?editForm():`<div class="pf-empty">${ico('info')}<p>Data profil belum bisa dimuat.<br>${ST.st===3?'Periksa koneksi internet Anda.':''}</p><button class="pf-btn sec" onclick="PF.open('edit')">Coba lagi</button></div>`}
function setErr(id,m){const f=$('#'+id).closest('.pf-f');f.classList.toggle('err',!!m);f.querySelector('small').textContent=m||f.getAttribute('data-h')||''}
const val=id=>($('#'+id)||{value:''}).value.trim();
function busy(id,on,txt){const b=$('#'+id);if(!b)return;if(on){b._h=b.innerHTML;b.disabled=true;b.innerHTML=`<i class="pf-sp"></i>${txt||'Menyimpan…'}`}else{b.disabled=false;if(b._h)b.innerHTML=b._h}}
async function saveEdit(){
  const s=staf(),bio=val('pf-b');let bad=false;
  if(s){const n=val('pf-n'),u=val('pf-u').toLowerCase();let p=val('pf-p').replace(/[\s-]/g,'');
    if(n.length<2){setErr('pf-n','Nama minimal 2 karakter');bad=true}else setErr('pf-n');
    if(!/^[a-z0-9_.]{3,20}$/.test(u)){setErr('pf-u','Username 3–20 karakter: huruf kecil, angka, titik, garis bawah');bad=true}else setErr('pf-u');
    if(p&&!/^\+?\d{8,15}$/.test(p)){setErr('pf-p','Nomor telepon tidak valid (8–15 angka)');bad=true}else setErr('pf-p');
    if(bad)return;busy('pf-sv',1);
    try{const u2=await authReq('PUT',{data:{full_name:n,username:u,phone:p,bio}});ST.user=u2;ST.meta=u2.user_metadata||{};ST.prefs=null;ST.st=2}
    catch(e){busy('pf-sv',0);toast(errMsg(e),true);return}}
  else{if(!LS.s(ck(),JSON.stringify({bio}))){toast('Penyimpanan perangkat penuh',true);return}}
  busy('pf-sv',0);close();toast('Profil berhasil diperbarui');redraw()}
function un(el){const v=el.value.toLowerCase().replace(/[^a-z0-9_.]/g,'');if(v!==el.value)el.value=v}
function cnt(el){const c=$('#'+el.id+'c');if(c)c.textContent=el.value.length+'/'+el.maxLength}

/* ---------- foto profil ---------- */
const C={img:null,x:0,y:0,z:1,min:1};
function openFoto(){const d=ident(),f=LS.g(fk());
  sheet('Foto profil','Geser untuk mengatur posisi, lalu simpan.',
   `<div class="pf-crop${f?'':' empty'}" id="pf-cr">${f?`<img src="${E(f)}" alt="" style="width:100%;height:100%;object-fit:cover">`:E(d.nama[0].toUpperCase())}</div>
    <input type="range" class="pf-zm" id="pf-zm" min="1" max="3" step=".01" value="1" style="display:none" aria-label="Perbesar" oninput="PF.zoom(this.value)">
    <div class="pf-two"><label class="pf-btn sec" style="cursor:pointer">${ico('img')}Galeri<input type="file" accept="image/*" hidden onchange="PF.pick(this)"></label><label class="pf-btn sec" style="cursor:pointer">${ico('cam')}Kamera<input type="file" accept="image/*" capture="user" hidden onchange="PF.pick(this)"></label></div>
    <button class="pf-btn" id="pf-fs" disabled onclick="PF.saveFoto()">Simpan foto</button>${f?`<button class="pf-btn sec" onclick="PF.delFoto()">${ico('trash')}Hapus foto</button>`:''}`)}
function pick(inp){const f=inp.files&&inp.files[0];inp.value='';if(!f)return;
  if(!/^image\//.test(f.type)){toast('Pilih file gambar (JPG atau PNG)',true);return}
  const u=URL.createObjectURL(f),im=new Image();
  im.onload=()=>{URL.revokeObjectURL(u);if(!im.width||!im.height){toast('Gambar tidak bisa dibaca',true);return}cropStart(im)};
  im.onerror=()=>{URL.revokeObjectURL(u);toast('Gambar tidak bisa dibaca. Coba foto lain',true)};im.src=u}
function cropStart(im){const box=$('#pf-cr');if(!box)return;C.img=im;C.min=Math.max(240/im.width,240/im.height);C.z=C.min;C.x=(240-im.width*C.z)/2;C.y=(240-im.height*C.z)/2;
  box.classList.remove('empty');box.innerHTML='<canvas id="pf-cv" width="480" height="480"></canvas>';
  const z=$('#pf-zm');z.style.display='';z.value=1;$('#pf-fs').disabled=false;paint();
  let on=false,px=0,py=0;
  box.onpointerdown=e=>{on=true;px=e.clientX;py=e.clientY;try{box.setPointerCapture(e.pointerId)}catch(x){}};
  box.onpointermove=e=>{if(!on)return;C.x+=e.clientX-px;C.y+=e.clientY-py;px=e.clientX;py=e.clientY;clamp();paint()};
  box.onpointerup=box.onpointercancel=()=>{on=false}}
function clamp(){const w=C.img.width*C.z,h=C.img.height*C.z;C.x=Math.min(0,Math.max(240-w,C.x));C.y=Math.min(0,Math.max(240-h,C.y))}
function paint(){const cv=$('#pf-cv');if(!cv||!C.img)return;const k=cv.width/240,x=cv.getContext('2d');x.fillStyle='#0f0d19';x.fillRect(0,0,cv.width,cv.height);x.drawImage(C.img,C.x*k,C.y*k,C.img.width*C.z*k,C.img.height*C.z*k)}
function zoom(v){if(!C.img)return;const nz=C.min*(+v),cx=(120-C.x)/C.z,cy=(120-C.y)/C.z;C.z=nz;C.x=120-cx*nz;C.y=120-cy*nz;clamp();paint()}
function saveFoto(){if(!C.img)return;const cv=document.createElement('canvas');cv.width=cv.height=256;const k=256/240,x=cv.getContext('2d');
  x.fillStyle='#0f0d19';x.fillRect(0,0,256,256);x.drawImage(C.img,C.x*k,C.y*k,C.img.width*C.z*k,C.img.height*C.z*k);
  let q=.86,u=cv.toDataURL('image/jpeg',q);while(u.length>240000&&q>.4){q-=.1;u=cv.toDataURL('image/jpeg',q)}
  if(!LS.s(fk(),u)){toast('Penyimpanan perangkat penuh. Foto tidak tersimpan',true);return}
  C.img=null;close();toast('Foto profil diperbarui');redraw()}
function delFoto(){LS.s(fk(),null);close();toast('Foto profil dihapus');redraw()}

/* ---------- kata sandi ---------- */
const pwf=(id,label,ac,hint,on)=>`<div class="pf-f" data-h="${E(hint||'')}"><label for="${id}">${label}</label><input id="${id}" type="password" autocomplete="${ac}"${on?` oninput="${on}"`:''}><button type="button" class="pf-eye" aria-label="Tampilkan kata sandi" onclick="PF.eye('${id}',this)">${ico('eye')}</button><small>${E(hint||'')}</small></div>`;
function openPass(){
  if(!staf()){const u=(()=>{try{return csUrl()}catch(e){return ''}})();
    sheet('Ganti kata sandi','Akun pelanggan dikelola oleh admin.',`<div class="pf-info">${ico('info')}<span>Demi keamanan, kata sandi akun pelanggan diatur ulang oleh admin. Hubungi admin lewat WhatsApp, sebutkan nomor yang terdaftar, lalu admin akan membuat kode pendaftaran baru untuk Anda.</span></div>${u?`<a class="pf-btn" href="${E(u)}" target="_blank" rel="noopener">${ico('wa')}Hubungi admin</a>`:`<p class="pf-sub" style="margin:14px 0 0">Nomor admin belum diatur. Hubungi toko secara langsung.</p>`}`);return}
  sheet('Ganti kata sandi','Gunakan kata sandi yang kuat dan belum pernah dipakai.',
   pwf('pf-c','Kata sandi saat ini','current-password')+pwf('pf-n1','Kata sandi baru','new-password','Minimal 8 karakter, campur huruf dan angka','PF.str(this)')+`<div class="pf-str" id="pf-str" data-s="0"><i></i><i></i><i></i><i></i></div>`+pwf('pf-n2','Ulangi kata sandi baru','new-password')+`<button class="pf-btn" id="pf-ps" onclick="PF.savePass()">Perbarui kata sandi</button>`)}
function str(el){const v=el.value;let s=0;if(v.length>=8)s++;if(/[a-z]/.test(v)&&/[A-Z]/.test(v))s++;if(/\d/.test(v)&&/[a-zA-Z]/.test(v))s++;if(v.length>=12||/[^a-zA-Z0-9]/.test(v))s++;if(!v)s=0;$('#pf-str').setAttribute('data-s',s)}
function eye(id,b){const i=$('#'+id),h=i.type==='password';i.type=h?'text':'password';b.innerHTML=ico(h?'eyeoff':'eye')}
async function savePass(){
  const cur=$('#pf-c').value,n1=$('#pf-n1').value,n2=$('#pf-n2').value;let bad=false;
  if(!cur){setErr('pf-c','Isi kata sandi saat ini');bad=true}else setErr('pf-c');
  if(n1.length<8||!/[a-zA-Z]/.test(n1)||!/\d/.test(n1)){setErr('pf-n1','Minimal 8 karakter, campur huruf dan angka');bad=true}else if(n1===cur){setErr('pf-n1','Kata sandi baru harus berbeda dari yang lama');bad=true}else setErr('pf-n1');
  if(n2!==n1){setErr('pf-n2','Kata sandi tidak sama');bad=true}else setErr('pf-n2');
  if(bad)return;busy('pf-ps',1,'Memeriksa…');
  try{const j=await sbAuth('token?grant_type=password',{email:SB_EM,password:cur});sbSesiSet(sbMk(j,SB_EM))}
  catch(e){busy('pf-ps',0);setErr('pf-c',/invalid|credentials/i.test(String(e.message))?'Kata sandi saat ini salah':errMsg(e));return}
  try{await authReq('PUT',{password:n1})}catch(e){busy('pf-ps',0);toast(errMsg(e),true);return}
  busy('pf-ps',0);close();toast('Kata sandi berhasil diganti')}

/* ---------- privasi & notifikasi ---------- */
const swRow=(k,ic,c,t,s)=>row({ic,c,t,s,act:`PF.tog('${k}',this)`,end:swEl(P()[k])});
function openPrivasi(){sheet('Pengaturan privasi','Atur apa yang tampak di layar Anda.',grp([
  swRow('mask','mask','#34d399','Samarkan email dan telepon','Berguna saat layar dibagikan atau dilihat orang lain'),
  swRow('hidefoto','eye','#4f8cff','Sembunyikan foto profil','Tampilkan inisial nama sebagai gantinya')])
  +`<div class="pf-info">${ico('info')}<span>${staf()?'Pengaturan ini tersimpan di akun Anda dan berlaku di semua perangkat.':'Pengaturan ini tersimpan di perangkat ini.'}</span></div>`)}
function openNotif(){const s=staf();
  sheet('Pengaturan notifikasi','Pilih pengingat yang Anda butuhkan.',grp([
   swRow('getar','vib','#8b7bff','Getar saat menekan menu','Umpan balik halus di HP'),
   ...(s?[swRow('telat','clock','#fbbf24','Pengingat cucian terlambat','Muncul saat aplikasi dibuka jika ada cucian lewat estimasi'),
     swRow('sistem','bell','#4f8cff','Notifikasi sistem','Tampilkan pengingat sebagai notifikasi peramban')]:[])])
   +(s?`<button class="pf-btn sec" onclick="PF.testNotif()">${ico('bell')}Kirim uji notifikasi</button>`:`<div class="pf-info">${ico('info')}<span>Status cucian dapat dilihat kapan saja di menu Lacak. Pengingat WhatsApp dikirim oleh toko.</span></div>`))}
async function tog(k,el){const sw=el.querySelector('.pf-sw'),v=!P()[k];
  if(k==='sistem'&&v){if(!('Notification' in window)){toast('Peramban ini tidak mendukung notifikasi',true);return}
    let p=Notification.permission;if(p==='default'){try{p=await Notification.requestPermission()}catch(e){}}
    if(p!=='granted'){toast('Izin notifikasi ditolak di peramban',true);return}}
  sw.classList.toggle('on',v);setPref(k,v);
  if(k==='getar'&&v){try{navigator.vibrate&&navigator.vibrate(30)}catch(e){}}
  toast('Pengaturan disimpan');if(k==='mask'||k==='hidefoto')redraw()}
function testNotif(){const p=P();if(p.sistem&&'Notification' in window&&Notification.permission==='granted'){try{new Notification((S.nama||'Hafan Laundry'),{body:'Notifikasi berfungsi dengan baik.'});toast('Uji notifikasi dikirim');return}catch(e){}}
  toast('Notifikasi berfungsi dengan baik','warn')}

/* ---------- keamanan ---------- */
function openAman(){const s=staf(),d=ident();
  const ingat=(window.KL_CONFIG||{}).INGAT_LOGIN;
  const own=isOwner(),akses=['Order','Order baru','Pelanggan','Pembayaran','Hutang'].concat(own?['Laporan','Pengaturan','Pusat Data','Stok','Batalkan order']:[]);
  const rows=s?[row({ic:'clock',c:'#4f8cff',t:'Login terakhir',s:ST.st===2&&d.last?fdt(d.last):(ST.st===2?'-':sk)}),
    row({ic:'cal',c:'#fbbf24',t:'Akun dibuat',s:ST.st===2&&d.joined?fdate(d.joined):(ST.st===2?'-':sk)}),
    row({ic:'dev',c:'#8b7bff',t:'Sesi di perangkat ini',s:ingat?'Diingat sampai Anda keluar':'Berakhir saat tab ditutup'}),
    row({ic:'shield',c:'#34d399',t:'Peran akun',s:E(d.role)+(own?' · akses penuh':' · akses kasir')})]
   :[row({ic:'dev',c:'#8b7bff',t:'Sesi di perangkat ini',s:'Aktif, tersimpan di perangkat ini'}),row({ic:'lock',c:'#34d399',t:'Kata sandi',s:'Disimpan terenkripsi, tidak pernah terkirim'})];
  sheet('Keamanan akun','Pantau sesi dan lindungi akun Anda.',grp(rows)
   +(s?`<div class="pf-day">Akses akun ini</div><div class="pkg pkch" style="background:#1c1829;box-shadow:none;border:1px solid #2a2639;border-radius:22px;display:flex;flex-wrap:wrap;gap:8px;padding:14px">${akses.map(a=>`<span style="padding:7px 12px;border-radius:999px;border:1px solid #2f2a45;font-size:13px">${E(a)}</span>`).join('')}</div>`:'')
   +`<button class="pf-btn sec" onclick="PF.open('pass')">${ico('key')}Ganti kata sandi</button>`
   +(s?`<button class="pf-btn bad" onclick="PF.open('global')">${ico('out')}Keluar dari semua perangkat</button>`:''))}
function unsaved(){try{return dirty||_sv||_q||!!bkLocal()}catch(e){return false}}
function openGlobal(){sheet('Keluar dari semua perangkat','Semua sesi aktif akan berakhir.',`<div class="pf-info">${ico('info')}<span>${unsaved()?'Ada perubahan yang belum tersimpan dan akan hilang. ':''}Anda perlu masuk lagi di setiap perangkat, termasuk perangkat ini.</span></div><button class="pf-btn bad" id="pf-gl" onclick="PF.doGlobal()">Keluar dari semua perangkat</button><button class="pf-btn sec" onclick="PF.close()">Batal</button>`)}
async function doGlobal(){busy('pf-gl',1,'Memproses…');
  try{const t=await sbToken();if(!t)throw new Error('Sesi habis');await sbAuth('logout?scope=global',{},t)}catch(e){busy('pf-gl',0);toast(errMsg(e),true);return}
  sbSesiSet(null);try{['kl_sb','kl_bk','kl_at','lc','lc2','acc'].forEach(k=>localStorage.removeItem(k));sessionStorage.clear()}catch(e){}location.replace('/')}
function openKeluar(){const s=staf();
  sheet('Keluar dari akun?',s?'Sesi di perangkat ini akan diakhiri.':'Anda bisa masuk lagi kapan saja dengan nomor WhatsApp dan kata sandi.',
   (s&&unsaved()?`<div class="pf-info">${ico('info')}<span>Ada perubahan yang belum tersimpan dan akan hilang kalau keluar.</span></div>`:'')
   +`<button class="pf-btn bad" onclick="PF.doKeluar()">${ico('out')}Keluar</button><button class="pf-btn sec" onclick="PF.close()">Batal</button>`)}
function doKeluar(){close();setTimeout(()=>{if(staf())sbKeluarGo();else logoutAcc()},180)}

/* ---------- riwayat aktivitas ---------- */
const CAT_C={order:'#4f8cff',bayar:'#34d399',lain:'#c084fc'};
function catOf(a){a=String(a||'').toLowerCase();return /bayar|lunas|dp\b|saldo|hutang|kas|uang|tebus|poin/.test(a)?'bayar':/order|pesan|status|batal|nota|buat|ubah|selesai|ambil/.test(a)?'order':'lain'}
function dayLbl(t){const d=new Date(t),n=new Date(),a=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(),b=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime(),k=Math.round((a-b)/864e5);
  return k===0?'Hari ini':k===1?'Kemarin':d.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'})}
function events(){
  if(staf()){const L=(S.al||[]).slice().reverse(),me0=(()=>{try{return me()}catch(e){return ''}})();
    return L.filter(x=>isOwner()||x.by===me0).slice(0,120).map(x=>({t:x.t,b:E(x.a),s:E([x.n,x.x].filter(Boolean).join(' · ')+(isOwner()&&x.by?(x.n||x.x?' · ':'')+'oleh '+x.by:'')),c:catOf(x.a),k:catOf(x.a)}))}
  const a=acc();let m=[];try{m=S.orders.filter(o=>nw(o.wa)===a.w).sort((x,y)=>y.masuk-x.masuk)}catch(e){}
  return m.slice(0,60).map(o=>({t:o.masuk,b:'Cucian '+E(nn(o)),s:E(STN[o.st]+' · '+rp(o.total)),c:o.st>=3?'bayar':'order',k:'semua'}))}
function actList(){const ev=events().filter(e=>ST.cat==='semua'||e.k===ST.cat);
  if(!ev.length)return `<div class="pf-empty">${ico('hist')}<p>${ST.cat==='semua'?(staf()?'Belum ada aktivitas tercatat.':'Belum ada cucian pada akun ini.'):'Tidak ada aktivitas pada kategori ini.'}</p></div>`;
  let h='',last='';ev.forEach(e=>{const l=dayLbl(e.t);if(l!==last){if(last)h+='</div>';h+=`<div class="pf-day">${E(l)}</div><div class="pf-tl">`;last=l}
    h+=`<div class="pf-ev" style="--c:${CAT_C[e.c]||'#8b7bff'}"><b>${e.b}</b><span>${e.s?e.s+' · ':''}${new Date(e.t).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</span></div>`});
  return h+'</div>'}
function openAktif(){ST.cat='semua';const s=staf();
  sheet('Riwayat aktivitas',s?(isOwner()?'Semua tindakan di aplikasi.':'Tindakan Anda di aplikasi.'):'Cucian yang pernah Anda buat.',
   (s?`<div class="pf-chips" id="pf-ch">${[['semua','Semua'],['order','Order'],['bayar','Pembayaran'],['lain','Lainnya']].map(([k,l])=>`<button class="${k==='semua'?'on':''}" onclick="PF.cat('${k}')">${l}</button>`).join('')}</div>`:'')+`<div id="pf-al">${actList()}</div>`)}
function cat(k){ST.cat=k;document.querySelectorAll('#pf-ch button').forEach(b=>b.classList.toggle('on',b.getAttribute('onclick')==="PF.cat('"+k+"')"));$('#pf-al').innerHTML=actList()}

/* ---------- bantuan & tentang ---------- */
const FAQ_S=[['Bagaimana mengganti kata sandi?','Buka Profil, pilih Ganti kata sandi, isi kata sandi saat ini, lalu kata sandi baru (minimal 8 karakter, campur huruf dan angka).'],
 ['Kenapa foto profil tidak muncul di perangkat lain?','Foto disimpan di perangkat ini agar data aplikasi tetap ringan. Pasang ulang di perangkat lain lewat Ganti foto profil.'],
 ['Perubahan profil tidak tersimpan, kenapa?','Pastikan internet aktif. Nama, username, telepon, dan bio disimpan di akun Anda. Jika masih gagal, keluar lalu masuk lagi.'],
 ['Apa bedanya nama profil dengan nama penanggung jawab?','Nama penanggung jawab order diatur owner di Pengaturan, bagian Karyawan. Mengubah nama profil tidak mengubahnya, jadi riwayat order tetap rapi.'],
 ['Bagaimana keluar dari semua perangkat?','Buka Keamanan akun, lalu pilih Keluar dari semua perangkat. Semua sesi akan berakhir dan Anda perlu masuk lagi.']];
const FAQ_P=[['Bagaimana melacak cucian saya?','Buka menu Lacak lalu masukkan kode atau nomor nota. Cucian di akun Anda juga muncul di halaman Akun.'],
 ['Bagaimana cara mendapat poin?','Setiap belanja Rp10.000 mendapat 1 poin. Dengan 50 poin Anda bisa memakai diskon Rp25.000, sampaikan ke kasir saat membayar.'],
 ['Saya lupa kata sandi. Apa yang harus dilakukan?','Hubungi admin lewat WhatsApp. Admin akan membuat kode pendaftaran baru untuk mengatur ulang kata sandi Anda.'],
 ['Di mana foto dan bio saya disimpan?','Di perangkat ini saja. Jika berganti HP, Anda bisa menambahkannya lagi dengan mudah.']];
function openBantuan(){const f=staf()?FAQ_S:FAQ_P,u=(()=>{try{return csUrl()}catch(e){return ''}})();
  sheet('Pusat bantuan','Jawaban untuk pertanyaan yang sering muncul.',`<div class="pf-grp" style="padding:2px 16px">${f.map((q,i)=>`<div class="pf-q" id="pf-q${i}"><button onclick="PF.faq(${i})" aria-expanded="false">${E(q[0])}<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button><div><p>${E(q[1])}</p></div></div>`).join('')}</div>${u?`<a class="pf-btn" href="${E(u)}" target="_blank" rel="noopener">${ico('wa')}Hubungi kami via WhatsApp</a>`:''}`)}
function faq(i){const q=$('#pf-q'+i),on=!q.classList.contains('on');document.querySelectorAll('.pf-q.on').forEach(x=>{x.classList.remove('on');x.querySelector('button').setAttribute('aria-expanded','false')});if(on){q.classList.add('on');q.querySelector('button').setAttribute('aria-expanded','true')}}
function info(){const v=(window.KL_CONFIG||{}).VERSI||'-';return 'Hafan Laundry v'+v+' | '+(S.nama||'')+' | '+(staf()?'Staf':'Pelanggan')+' | '+(navigator.userAgent||'').slice(0,90)}
function openTentang(){const nm=S.nama||'Hafan Laundry',v=(window.KL_CONFIG||{}).VERSI||'-';
  sheet('Tentang','',`<div class="pf-about"><div class="pf-logo">${S.logo?`<img src="${E(S.logo)}" alt="">`:E(nm[0].toUpperCase())}</div><h3>${E(nm)}</h3><p>Aplikasi kasir dan pelacakan laundry</p></div>${grp([row({ic:'info',c:'#8b7bff',t:'Versi aplikasi',s:'v'+E(v)}),row({ic:'user',c:'#4f8cff',t:'Masuk sebagai',s:staf()?E(isOwner()?'Owner':'Kasir'):'Pelanggan'}),row({ic:'shield',c:'#34d399',t:'Penyimpanan data',s:'Supabase, terenkripsi saat transit'})])}<button class="pf-btn sec" onclick="PF.copy()">${ico('copy')}Salin info versi</button><button class="pf-btn sec" onclick="location.reload()">${ico('refresh')}Muat ulang aplikasi</button>`)}
function copy(){const t=info();
  const ok=()=>toast('Info versi disalin');
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,()=>fb())}else fb();
  function fb(){const a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();try{document.execCommand('copy')?ok():toast('Tidak bisa menyalin',true)}catch(e){toast('Tidak bisa menyalin',true)}a.remove()}}

/* ---------- dispatcher & sinkron ---------- */
function open(n){({edit:openEdit,foto:openFoto,pass:openPass,privasi:openPrivasi,look:openLook,notif:openNotif,aman:openAman,aktif:openAktif,bantuan:openBantuan,tentang:openTentang,keluar:openKeluar,global:openGlobal})[n]()}
function sync(){applyLook(ST.draft||P());const on=!!document.querySelector('#app .pf');document.body.classList.toggle('pf-on',on);
  const m=document.querySelector('meta[name=theme-color]');if(m){if(on){if(!m._o)m._o=m.content;m.content='#0b0a14'}else if(m._o)m.content=m._o}}
function startup(){try{if(!staf()||sessionStorage.getItem('pf_st'))return;sessionStorage.setItem('pf_st','1');
  const p=P();if(!p.telat)return;const n=S.orders.filter(o=>o.st<2&&o.est&&o.est<Date.now()).length;if(!n)return;
  const m=n+' cucian melewati estimasi selesai';setTimeout(()=>toast(m,'warn'),1400);
  if(p.sistem&&'Notification' in window&&Notification.permission==='granted'){try{new Notification(S.nama||'Hafan Laundry',{body:m})}catch(e){}}}catch(e){}}
function pav(nm){const f=!P().hidefoto&&LS.g(fk());return f?`<img src="${E(f)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`:E(String(nm||'?')[0].toUpperCase())}

window.PF={hero,menus,r,lbl,grp,row,open,close,toast,sync,startup,pav,pref:k=>P()[k],
  saveEdit,un,cnt,look,lookReset,lookSave,theme,pick,zoom,saveFoto,delFoto,savePass,str,eye,tog,testNotif,doGlobal,doKeluar,cat,faq,copy};
})();
