function nextId(){return state.people.reduce((m,p)=>Math.max(m,p.id||0),0)+1;}
function addKisi(){
  const name=(document.getElementById("nAd")?.value||"").trim();
  if(!name){toast("Isim yaz");return;}
  const kurye=!!document.getElementById("nKurye")?.checked;
  const birim=num(document.getElementById("nBirim")?.value,300);
  state.people.push(hydratePerson({id:nextId(),name,kurye,mesaiBirim:birim}));
  persist();
  document.getElementById("nAd").value="";
  renderAll();
  toast(name+" eklendi");
}
function silKisi(id){
  const p=state.people.find(x=>x.id===id);
  if(!p||!confirm(p.name+" silinsin mi?"))return;
  state.people=state.people.filter(x=>x.id!==id);
  persist();renderAll();
}
function ozetMod(m){
  document.querySelectorAll("[data-ozet]").forEach(b=>b.classList.toggle("on",b.dataset.ozet===m));
  const kisa=document.getElementById("ozetKisa");
  const ayr=document.getElementById("ozetAyrinti");
  if(kisa)kisa.classList.toggle("hide",m!=="kisa");
  if(ayr)ayr.classList.toggle("hide",m!=="ayrinti");
}
function sums(){
  const all=state.people.map(p=>({p,c:calc(p)}));
  const pay=all.filter(x=>x.c.toplam>0);
  const add=k=>all.reduce((a,x)=>a+x.c[k],0);
  return {all,pay,add,toplam:add("toplam"),mesai:add("mesai"),hs:add("hs"),prim:add("prim"),yol:add("yol"),izin:add("izin"),yillik:add("yillik"),dis:add("dis")};
}
const _renderListe=renderListe;
renderListe=function(){
  _renderListe();
  const box=document.getElementById("mobileList");
  if(!box)return;
  const rows=visible();
  box.innerHTML=rows.map(p=>{
    const c=calc(p);
    return `<article class="pcard ${c.toplam>0?"pay":"zero"}">
      <div class="phd"><b>${p.name}</b>${p.kurye?" <small>KURYE</small>":""}<span class="ptot">${dash(c.toplam)} TL</span></div>
      <div class="pgrid">
        <label>Mesai saat<input type="number" step="0.5" value="${p.mesaiSaat||""}" onchange="setVal(${p.id},'mesaiSaat',this.value)"></label>
        <label>HS adet<input type="number" step="0.5" value="${p.hsSaat||""}" onchange="setVal(${p.id},'hsSaat',this.value)"></label>
        <label>Yol<input type="number" value="${p.yolTutar||""}" onchange="setVal(${p.id},'yolTutar',this.value)"></label>
        <label>Izin gun<input type="number" step="0.5" value="${p.izinGun||""}" onchange="setVal(${p.id},'izinGun',this.value)"></label>
        <label>Izin tutar<input type="number" value="${p.izinTutar||""}" onchange="setVal(${p.id},'izinTutar',this.value)"></label>
        <label>Yillik<input type="number" value="${p.yillikTutar||""}" onchange="setVal(${p.id},'yillikTutar',this.value)"></label>
      </div>
      <div class="pline">Mesai ${dash(c.mesai)} · HS ${dash(c.hs)} · Izin ${dash(c.izin+c.yillik)}</div>
    </article>`;
  }).join("");
};
const _renderOzet=renderOzet;
renderOzet=function(){
  const s=sums();
  const kisa=document.getElementById("ozetKisa");
  const ayr=document.getElementById("ozetAyrinti");
  if(!kisa||!ayr){ _renderOzet(); return; }
  kisa.innerHTML=`<h2>Kisa ozet</h2><p>${s.all.length} kisi · ${s.pay.length} odeme · <b>${tl(s.toplam)} TL</b></p>
    <table class="sheet slim"><thead><tr><th>No</th><th>Ad Soyad</th><th>Toplam</th></tr></thead>
    <tbody>${s.all.map((x,i)=>`<tr class="${x.c.toplam>0?"pay":"zero"}"><td>${i+1}</td><td class="name">${x.p.name}</td><td class="tot">${dash(x.c.toplam)}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td></td><td>TOPLAM</td><td>${tl(s.toplam)}</td></tr></tfoot></table>`;
  ayr.innerHTML=`<h2>Ayrintili ozet</h2><p>${s.all.length} kisi · ${s.pay.length} odeme · ${tl(s.toplam)} TL</p>
    <table class="sheet slim"><thead><tr><th>No</th><th>Ad</th><th>Mesai</th><th>HS</th><th>Prim</th><th>Yol</th><th>Izin</th><th>Yillik</th><th>Toplam</th></tr></thead>
    <tbody>${s.all.map((x,i)=>`<tr class="${x.c.toplam>0?"pay":"zero"}">
      <td>${i+1}</td><td class="name">${x.p.name}</td><td>${dash(x.c.mesai)}</td><td>${dash(x.c.hs)}</td>
      <td>${dash(x.c.prim)}</td><td>${dash(x.c.yol)}</td><td>${dash(x.c.izin)}</td>
      <td>${dash(x.c.yillik)}</td><td>${dash(x.c.toplam)}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td></td><td>TOPLAM</td><td>${tl(s.mesai)}</td><td>${tl(s.hs)}</td><td>${tl(s.prim)}</td><td>${tl(s.yol)}</td><td>${tl(s.izin)}</td><td>${tl(s.yillik)}</td><td>${tl(s.toplam)}</td></tr></tfoot></table>`;
};
function periodLabel(){
  const d=new Date();
  return (state.period||"")+" · "+d.toLocaleDateString("tr-TR",{month:"long",year:"numeric"});
}
function renderRapor(){
  const box=document.getElementById("raporBox");
  if(!box)return;
  const s=sums();
  const kalem=[["Hafta sonu",s.hs],["Izin",s.izin],["Yillik izin",s.yillik],["Mesai",s.mesai],["Kurye prim",s.prim],["Yol",s.yol],["Disiplin",s.dis]];
  const devam=state.devamsizlik||[];
  box.innerHTML=`
    <div class="rapor-head">
      <div>
        <div class="muted">Aylik finansal rapor</div>
        <h2>Cadde Personel Odemeleri</h2>
        <p>${periodLabel()} · ${s.pay.length} kisiye odeme · ${s.all.length} kisi kayitli</p>
      </div>
      <button class="btn" onclick="window.print()">Yazdir</button>
    </div>
    <div class="stats rapor-stats">
      <div class="stat"><span>Odenecek toplam</span><b>${tl(s.toplam)} TL</b></div>
      <div class="stat"><span>Odemesi olan</span><b>${s.pay.length} / ${s.all.length}</b></div>
      <div class="stat"><span>Hafta sonu</span><b>${tl(s.hs)} TL</b></div>
      <div class="stat"><span>Mesai + izin</span><b>${tl(s.mesai+s.izin+s.yillik)} TL</b></div>
    </div>
    <div class="panel">
      <h3>Kalem dagilimi</h3>
      <table class="sheet slim"><thead><tr><th>Kalem</th><th>Tutar</th><th>Pay</th></tr></thead>
      <tbody>${kalem.map(([k,v])=>`<tr><td class="name">${k}</td><td>${dash(v)}</td><td>${s.toplam?((v/s.toplam)*100).toFixed(1):"0"}%</td></tr>`).join("")}</tbody>
      <tfoot><tr><td>GENEL TOPLAM</td><td>${tl(s.toplam)}</td><td>100%</td></tr></tfoot></table>
    </div>
    <div class="panel">
      <h3>Kisi kisi odeme listesi</h3>
      <table class="sheet slim"><thead><tr><th>No</th><th>Ad Soyad</th><th>Mesai</th><th>HS</th><th>Izin+Yillik</th><th>Diger</th><th>Odenecek</th></tr></thead>
      <tbody>${s.all.map((x,i)=>`<tr class="${x.c.toplam>0?"pay":"zero"}">
        <td>${i+1}</td><td class="name">${x.p.name}${x.p.kurye?" <small>KURYE</small>":""}</td>
        <td>${dash(x.c.mesai)}</td><td>${dash(x.c.hs)}</td>
        <td>${dash(x.c.izin+x.c.yillik)}</td>
        <td>${dash(x.c.prim+x.c.yol+x.c.dis)}</td>
        <td class="tot">${dash(x.c.toplam)}</td></tr>`).join("")}</tbody>
      <tfoot><tr><td colspan="2">TOPLAM</td><td>${tl(s.mesai)}</td><td>${tl(s.hs)}</td><td>${tl(s.izin+s.yillik)}</td><td>${tl(s.prim+s.yol+s.dis)}</td><td>${tl(s.toplam)}</td></tr></tfoot></table>
    </div>
    <div class="panel">
      <h3>Devamsizlik</h3>
      ${devam.length?`<table class="sheet slim"><thead><tr><th>No</th><th>Ad Soyad</th><th>Gun</th><th>Not</th></tr></thead><tbody>${devam.map((d,i)=>`<tr><td>${i+1}</td><td class="name">${d.kisi}</td><td>${d.gun}</td><td class="name">${d.not||"-"}</td></tr>`).join("")}</tbody></table>`:"<p class='muted'>Kayit yok</p>"}
    </div>`;
}
const _tab=tab;
tab=function(el){
  document.querySelectorAll(".tab[data-tab]").forEach(t=>t.classList.toggle("on",t===el));
  const id=el.dataset.tab;
  ["liste","kurye","devam","ceza","ozet","rapor"].forEach(s=>{
    const e=document.getElementById("sec-"+s);
    if(e)e.classList.toggle("hide",s!==id);
  });
  if(id==="kurye")renderKurye();
  if(id==="devam")renderDevam();
  if(id==="ceza")renderCeza();
  if(id==="ozet"){renderOzet();ozetMod(document.querySelector("[data-ozet].on")?.dataset.ozet||"kisa");}
  if(id==="rapor")renderRapor();
};
const _renderAll=renderAll;
renderAll=function(){
  _renderAll();
  renderRapor();
};
