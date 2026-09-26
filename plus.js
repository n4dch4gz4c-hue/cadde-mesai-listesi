function nextId(){return state.people.reduce((m,p)=>Math.max(m,p.id||0),0)+1;}
function addKisi(){
  const name=(document.getElementById("nAd")?.value||"").trim();
  if(!name){toast("Isim yaz");return;}
  const kurye=!!document.getElementById("nKurye")?.checked;
  const birim=num(document.getElementById("nBirim")?.value,300);
  state.people.push(hydratePerson({id:nextId(),name,kurye,mesaiBirim:birim}));
  if(typeof sortByTrName==="function") sortByTrName(state.people,"name");
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
async function outPdf(doc,name){
  const blob=doc.output("blob");
  const file=new File([blob],name,{type:"application/pdf"});
  try{
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      await navigator.share({files:[file],title:name});
      toast("Paylasildi");
      return;
    }
  }catch(e){ if(e&&e.name==="AbortError") return; }
  doc.save(name);
  toast("PDF indirildi");
}
async function shareOzetPDF(mode){
  if(typeof pagePdf==="function"){ return pagePdf(mode==="kisa"?"ozet-kisa":"ozet-ayrinti",true); }
}
let openMob=null;
function toggleMob(id,ev){
  if(ev&&ev.target&&ev.target.tagName==="INPUT")return;
  openMob=openMob===id?null:id;
  renderListe();
}
const _renderListe=renderListe;
renderListe=function(){
  _renderListe();
  const box=document.getElementById("mobileList");
  if(!box)return;
  const rows=visible();
  box.innerHTML=`<div class="mlist">`+rows.map(p=>{
    const c=calc(p);
    const no=state.people.findIndex(x=>x.id===p.id)+1;
    const on=openMob===p.id;
    return `<div class="mrow ${c.toplam>0?"pay":""} ${on?"on":""}">
      <button type="button" class="mhead" onclick="toggleMob(${p.id},event)">
        <span class="mno">${no}</span>
        <span class="mname">${p.name}${p.kurye?" <span class='kmark'>K</span>":""}</span>
        <span class="mtot">${dash(c.toplam)}</span>
      </button>
      ${on?`<div class="mfields">
        <label>Mesai<input type="number" step="0.5" value="${p.mesaiSaat||""}" onchange="setVal(${p.id},'mesaiSaat',this.value)"></label>
        <label>HS<input type="number" step="0.5" value="${p.hsSaat||""}" onchange="setVal(${p.id},'hsSaat',this.value)"></label>
        <label>Yol<input type="number" value="${p.yolTutar||""}" onchange="setVal(${p.id},'yolTutar',this.value)"></label>
        <label>Izin g<input type="number" step="0.5" value="${p.izinGun||""}" onchange="setVal(${p.id},'izinGun',this.value)"></label>
        <label>Izin TL<input type="number" value="${p.izinTutar||""}" onchange="setVal(${p.id},'izinTutar',this.value)"></label>
        <label>Yillik<input type="number" value="${p.yillikTutar||""}" onchange="setVal(${p.id},'yillikTutar',this.value)"></label>
      </div>`:""}
    </div>`;
  }).join("")+`</div>`;
};
const _renderOzet=renderOzet;
renderOzet=function(){
  const s=sums();
  const kisa=document.getElementById("ozetKisa");
  const ayr=document.getElementById("ozetAyrinti");
  if(!kisa||!ayr){ if(typeof _renderOzet==="function") _renderOzet(); return; }
  kisa.innerHTML=`<div class="row" style="justify-content:space-between;padding:0 0 10px"><h2 style="margin:0">Kisa ozet</h2><button class="btn primary" onclick="pagePdf('ozet-kisa',false)">PDF indir</button></div>
    <p>${s.all.length} kisi · ${s.pay.length} odeme · <b>${tl(s.toplam)} TL</b></p>
    <table class="sheet slim"><thead><tr><th>No</th><th>Ad Soyad</th><th>Toplam</th></tr></thead>
    <tbody>${s.all.map((x,i)=>`<tr class="${x.c.toplam>0?"pay":"zero"}"><td>${i+1}</td><td class="name">${x.p.name}</td><td class="tot">${dash(x.c.toplam)}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td></td><td>TOPLAM</td><td>${tl(s.toplam)}</td></tr></tfoot></table>`;
  ayr.innerHTML=`<div class="row" style="justify-content:space-between;padding:0 0 10px"><h2 style="margin:0">Ayrintili ozet</h2><button class="btn primary" onclick="pagePdf('ozet-ayrinti',false)">PDF indir</button></div>
    <p>${s.all.length} kisi · ${s.pay.length} odeme · ${tl(s.toplam)} TL</p>
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
  const colors=["#1f4b8f","#0f7b4c","#c45c26","#7c3aed","#0891b2","#b45309","#991b1b"];
  const kalem=[
    ["Hafta sonu",s.hs,colors[0]],
    ["Mesai",s.mesai,colors[1]],
    ["Yol",s.yol,colors[2]],
    ["Izin",s.izin,colors[3]],
    ["Yillik izin",s.yillik,colors[4]],
    ["Kurye prim",s.prim,colors[5]],
    ["Disiplin",s.dis,colors[6]]
  ];
  const maxV=Math.max.apply(null,kalem.map(x=>x[1]).concat([1]));
  const devam=state.devamsizlik||[];
  const chartHtml=kalem.map(([k,v,col])=>{
    const pct=s.toplam?((v/s.toplam)*100):0;
    const barW=Math.max(2,(v/maxV)*100);
    return `<div class="kbar-row" style="display:flex;align-items:center;gap:8px;margin:6px 0;font-size:13px;color:#111">
      <div style="width:90px;flex:none;font-weight:600;text-align:right">${k}</div>
      <div style="flex:1;background:#eef2f7;border-radius:6px;height:22px;overflow:hidden;position:relative">
        <div style="width:${barW}%;height:100%;background:${col};border-radius:6px;min-width:${v>0?4:0}px;transition:width .3s"></div>
      </div>
      <div style="width:88px;flex:none;text-align:right;font-weight:700">${dash(v)}</div>
      <div style="width:48px;flex:none;text-align:right;color:#64748b;font-size:12px">${pct.toFixed(1)}%</div>
    </div>`;
  }).join("");
  box.innerHTML=`
    <div class="rapor-head">
      <div>
        <div class="muted">Aylik finansal rapor</div>
        <h2>Cadde Personel Odemeleri</h2>
        <p>${periodLabel()} · ${s.pay.length} kisiye odeme · ${s.all.length} kisi kayitli</p>
      </div>
      <div class="row page-pdf" data-pdfbar="rapor">
        <button class="btn primary" type="button" onclick="pagePdf('rapor',false)">PDF indir</button>
        <button class="btn" type="button" onclick="pagePdf('rapor',true)">Paylas</button>
      </div>
    </div>
    <div class="stats rapor-stats">
      <div class="stat"><span>Odenecek toplam</span><b>${tl(s.toplam)} TL</b></div>
      <div class="stat"><span>Odemesi olan</span><b>${s.pay.length} / ${s.all.length}</b></div>
      <div class="stat"><span>Hafta sonu</span><b>${tl(s.hs)} TL</b></div>
      <div class="stat"><span>Mesai + izin</span><b>${tl(s.mesai+s.izin+s.yillik)} TL</b></div>
    </div>
    <div class="panel" id="kalemPanel">
      <h3>Kalem dagilimi</h3>
      <div class="kchart" style="padding:4px 0 12px">${chartHtml}</div>
      <table class="sheet slim kalem-table"><thead><tr><th>Kalem</th><th>Tutar</th><th>Pay</th></tr></thead>
      <tbody>${kalem.map(([k,v])=>`<tr><td class="name">${k}</td><td>${dash(v)}</td><td>${s.toplam?((v/s.toplam)*100).toFixed(1):"0"}%</td></tr>`).join("")}</tbody>
      <tfoot><tr><td>GENEL TOPLAM</td><td>${tl(s.toplam)}</td><td>100%</td></tr></tfoot></table>
    </div>
    <div class="panel" id="kisiPanel">
      <h3>Kisi kisi odeme listesi</h3>
      <table class="sheet slim kisi-table"><thead><tr><th>No</th><th>Ad Soyad</th><th>Mesai</th><th>HS</th><th>Izin+Yillik</th><th>Diger</th><th>Odenecek</th></tr></thead>
      <tbody>${s.all.map((x,i)=>`<tr class="${x.c.toplam>0?"pay":"zero"}">
        <td>${i+1}</td><td class="name">${x.p.name}${x.p.kurye?" <span class='kmark'>K</span>":""}</td>
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
  ["liste","kurye","devam","ceza","ozet","rapor","duzenle"].forEach(s=>{
    const e=document.getElementById("sec-"+s);
    if(e)e.classList.toggle("hide",s!==id);
  });
  if(id==="kurye")renderKurye();
  if(id==="devam")renderDevam();
  if(id==="ceza")renderCeza();
  if(id==="ozet"){renderOzet();ozetMod(document.querySelector("[data-ozet].on")?.dataset.ozet||"kisa");}
  if(id==="rapor")renderRapor();
  if(id==="duzenle" && typeof renderDuzenle==="function") renderDuzenle();
};
const _renderAll=renderAll;
renderAll=function(){
  _renderAll();
};
