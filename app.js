const KEY="cadde_bordro_v2";
const HS_BIRIM=2500,PRIM_BIRIM=7,DIS_BIRIM=1;
const TITLES={liste:"Personel",hs:"Toplu HS",kurye:"Kurye prim",devam:"Devamsizlik",ceza:"Cezalar",ozet:"Ozet",finans:"Finans"};

function num(v,d){const n=parseFloat(v);return Number.isFinite(n)?n:(d||0);}
function hydratePerson(p){
  p=p||{};
  const mesaiSaat=num(p.mesaiSaat??p.saat??p.mesai??p.hours,0);
  const mesaiBirim=num(p.mesaiBirim??p.birim??p.ucret??p.rate,300);
  return {
    id:p.id,
    name:p.name||"Isimsiz",
    kurye:!!p.kurye,
    mesaiSaat,
    mesaiBirim,
    hsSaat:num(p.hsSaat??p.hs,0),
    hsVar:p.hsVar!==undefined?!!p.hsVar:num(p.hsSaat??p.hs,0)>0,
    primAdet:num(p.primAdet??p.prim,0),
    yolGun:num(p.yolGun??p.yol,0),
    yolBirim:num(p.yolBirim,1200),
    yolVar:p.yolVar!==undefined?!!p.yolVar:num(p.yolGun??p.yol,0)>0,
    izinTutar:num(p.izinTutar??p.izin,0),
    yillikTutar:num(p.yillikTutar??p.yillik,0),
    disiplinDk:num(p.disiplinDk??p.disiplin,0)
  };
}
function hydratePeople(s){
  s=s||{};
  s.people=Array.isArray(s.people)?s.people.map(hydratePerson):[];
  s.cezalar=Array.isArray(s.cezalar)?s.cezalar:[];
  s.devamsizlik=Array.isArray(s.devamsizlik)?s.devamsizlik:[];
  return s;
}
function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){
      const s=hydratePeople(JSON.parse(raw));
      if(s.people.length)return s;
    }
  }catch(e){}
  return hydratePeople(JSON.parse(JSON.stringify(typeof SEED!=="undefined"?SEED:{people:[]})));
}
function persist(){localStorage.setItem(KEY,JSON.stringify(state));}
let state=load();
let filter="hepsi",editId=null,moveId=null,ozetMode="ayrinti";
persist();

function calc(p){
  p=hydratePerson(p);
  const mesai=p.mesaiSaat*p.mesaiBirim;
  const hs=p.hsVar?p.hsSaat*HS_BIRIM:0;
  const prim=p.kurye?p.primAdet*PRIM_BIRIM:0;
  const yol=p.yolVar?p.yolGun*p.yolBirim:0;
  const izin=p.izinTutar,yillik=p.yillikTutar,dis=p.disiplinDk*DIS_BIRIM;
  return {mesai,hs,prim,yol,izin,yillik,dis,toplam:mesai+hs+prim+yol+izin+yillik+dis};
}
function tl(n){return (Math.round(n)||0).toLocaleString("tr-TR")+" TL";}
function toast(t){
  const el=document.getElementById("toast");
  el.textContent=t;el.style.display="block";
  setTimeout(()=>el.style.display="none",1400);
}
function setTitles(id){
  document.getElementById("pageTitle").textContent=TITLES[id]||"Cadde Mesai";
  document.getElementById("pageSub").textContent=state.people.length+" kisi · tarayicide kayitli";
}
function tab(el){
  document.querySelectorAll(".nav-btn").forEach(t=>t.classList.toggle("on",t.dataset.tab===el.dataset.tab));
  const id=el.dataset.tab;
  ["liste","hs","kurye","devam","ceza","ozet","finans"].forEach(s=>{
    const e=document.getElementById("sec-"+s);
    if(e)e.classList.toggle("hide",s!==id);
  });
  setTitles(id);
  if(id==="hs")renderTopluHs();
  if(id==="kurye")renderKurye();
  if(id==="devam")renderDevam();
  if(id==="ceza")renderCeza();
  if(id==="ozet")renderOzet();
  if(id==="finans")renderFinans();
}
function filt(el){
  document.querySelectorAll("[data-f]").forEach(p=>p.classList.remove("on"));
  el.classList.add("on");filter=el.dataset.f;renderListe();
}
function visiblePeople(){
  const q=(document.getElementById("q")?.value||"").toLocaleLowerCase("tr-TR");
  return state.people.filter(p=>{
    if(q&&!(p.name||"").toLocaleLowerCase("tr-TR").includes(q))return false;
    const c=calc(p);
    if(filter==="kurye"&&!p.kurye)return false;
    if(filter==="pozitif"&&c.toplam<=0)return false;
    if(filter==="sifir"&&c.toplam!==0)return false;
    return true;
  });
}
function renderListe(){
  const people=visiblePeople();
  const all=state.people.map(calc);
  const sum=all.reduce((a,b)=>a+b.toplam,0);
  const poz=all.filter(x=>x.toplam>0).length;
  const mesai=all.reduce((a,b)=>a+b.mesai,0);
  const hs=all.reduce((a,b)=>a+b.hs,0);
  document.getElementById("stats").innerHTML=`
    <div class="stat"><span>Genel toplam</span><b>${tl(sum)}</b></div>
    <div class="stat"><span>Odemesi olan</span><b>${poz} / ${state.people.length}</b></div>
    <div class="stat"><span>Mesai</span><b>${tl(mesai)}</b></div>
    <div class="stat"><span>HS</span><b>${tl(hs)}</b></div>`;
  document.getElementById("list").innerHTML=people.map(p=>{
    const c=calc(p);
    const sira=state.people.findIndex(x=>x.id===p.id)+1;
    return `<article class="card ${p.kurye?"kurye":""}" onclick="onCardTap(${p.id})">
      <div class="name"><strong>${sira}. ${p.name}</strong>${p.kurye?'<span class="badge">KURYE</span>':""}</div>
      <div class="meta">Mesai ${p.mesaiSaat||0} sa x ${p.mesaiBirim||0} TL${p.hsVar?` · HS ${p.hsSaat} x 2500`:""}${p.yolVar?` · Yol ${p.yolGun} x ${p.yolBirim}`:""}</div>
      <div class="rowtot"><span>Toplam</span><span>${tl(c.toplam)}</span></div>
      <div class="movebar">
        <button class="btn" onclick="event.stopPropagation();startMove(${p.id})">${moveId===p.id?"Tasima iptal":"Tasi"}</button>
        <button class="btn danger" onclick="event.stopPropagation();delById(${p.id})">Sil</button>
      </div>
    </article>`;
  }).join("");
  setTitles("liste");
}
function onCardTap(id){if(moveId!=null){placeMove(id);return;}openEdit(id);}
function startMove(id){moveId=moveId===id?null:id;renderListe();}
function placeMove(id){
  if(moveId==null||moveId===id){moveId=null;renderListe();return;}
  const a=state.people.findIndex(p=>p.id===moveId);
  const b=state.people.findIndex(p=>p.id===id);
  if(a<0||b<0)return;
  const [item]=state.people.splice(a,1);
  state.people.splice(b,0,item);
  moveId=null;persist();renderListe();
}
function hsSet(p,saat){saat=num(saat,0);p.hsSaat=saat;p.hsVar=saat>0;}
function renderTopluHs(){
  const box=document.getElementById("hsList");if(!box)return;
  const q=(document.getElementById("hsQ")?.value||"").toLocaleLowerCase("tr-TR");
  const list=state.people.filter(p=>!q||(p.name||"").toLocaleLowerCase("tr-TR").includes(q));
  box.innerHTML=list.map(p=>{
    const saat=p.hsVar?(p.hsSaat||0):0;
    return `<article class="card"><div class="name"><label style="flex-direction:row;align-items:center;gap:8px;color:var(--txt)"><input type="checkbox" class="hsChk" data-id="${p.id}" ${saat>0?"checked":""}/><strong>${p.name}</strong></label><span class="muted">${saat?(saat+" sa · "+tl(saat*HS_BIRIM)):"0 TL"}</span></div><label>HS saat<input type="number" step="0.5" value="${saat}" onchange="hsTekKaydet(${p.id}, this.value)"/></label></article>`;
  }).join("");
}
function hsTekKaydet(id,val){const p=state.people.find(x=>x.id===id);if(!p)return;hsSet(p,val);persist();renderTopluHs();renderListe();}
function hsCheckedIds(){return[...document.querySelectorAll(".hsChk:checked")].map(el=>Number(el.dataset.id));}
function hsSec(on){document.querySelectorAll(".hsChk").forEach(el=>el.checked=!!on);}
function hsUygulaSecili(){
  const saat=num(document.getElementById("hsTopluSaat").value,0);
  const ids=new Set(hsCheckedIds());
  if(!ids.size){toast("Once kisi sec");return;}
  state.people.forEach(p=>{if(ids.has(p.id))hsSet(p,saat);});
  persist();renderTopluHs();renderListe();toast(ids.size+" kisiye HS");
}
function hsUygulaHepsine(){
  const saat=num(document.getElementById("hsTopluSaat").value,0);
  const q=(document.getElementById("hsQ")?.value||"").toLocaleLowerCase("tr-TR");
  let n=0;
  state.people.forEach(p=>{if(!q||(p.name||"").toLocaleLowerCase("tr-TR").includes(q)){hsSet(p,saat);n++;}});
  persist();renderTopluHs();renderListe();toast(n+" kisiye HS");
}
function hsSifirlaSecili(){
  const ids=new Set(hsCheckedIds());
  if(!ids.size){toast("Once kisi sec");return;}
  state.people.forEach(p=>{if(ids.has(p.id))hsSet(p,0);});
  persist();renderTopluHs();renderListe();toast("HS sifirlandi");
}
function renderKurye(){
  const list=state.people.filter(p=>p.kurye);
  const sumAdet=list.reduce((a,p)=>a+(p.primAdet||0),0);
  document.getElementById("kuryeList").innerHTML=list.map(p=>`<article class="card kurye"><div class="name"><strong>${p.name}</strong></div><label>Prim adet<input type="number" value="${p.primAdet||0}" onchange="setPrim(${p.id},this.value)"/></label></article>`).join("")+`<article class="card"><div class="rowtot"><span>Adet ${sumAdet}</span><span>${tl(sumAdet*PRIM_BIRIM)}</span></div></article>`;
}
function setPrim(id,v){const p=state.people.find(x=>x.id===id);p.primAdet=num(v,0);persist();renderKurye();renderListe();}
function fillSel(id){
  const sel=document.getElementById(id);if(!sel)return;
  const cur=sel.value;
  sel.innerHTML='<option value="">Kisi sec</option>'+state.people.map(p=>`<option value="${p.name}">${p.name}</option>`).join("");
  if(cur)sel.value=cur;
}
function renderDevam(){
  fillSel("dKisi");
  document.getElementById("devamList").innerHTML=(state.devamsizlik||[]).map((d,i)=>`<article class="card"><b>${d.kisi}</b><div class="meta">${d.gun} gun · ${d.not||""}</div><button class="btn danger" onclick="state.devamsizlik.splice(${i},1);persist();renderDevam()">Sil</button></article>`).join("");
}
function addDevam(){
  const kisi=document.getElementById("dKisi").value;
  if(!kisi){toast("Kisi sec");return;}
  state.devamsizlik.push({kisi,gun:num(document.getElementById("dGun").value,1),not:document.getElementById("dNot").value||""});
  persist();renderDevam();
}
function renderCeza(){
  fillSel("cKisi");
  document.getElementById("cezaList").innerHTML=(state.cezalar||[]).map((c,i)=>`<article class="card"><b>${c.kisi}</b><div class="meta">${tl(c.tutar)} · ${c.neden||""}</div><button class="btn danger" onclick="state.cezalar.splice(${i},1);persist();renderCeza()">Sil</button></article>`).join("");
}
function addCeza(){
  const kisi=document.getElementById("cKisi").value;
  if(!kisi){toast("Kisi sec");return;}
  state.cezalar.push({kisi,tutar:num(document.getElementById("cTutar").value,0),neden:document.getElementById("cNeden").value||""});
  persist();renderCeza();
}
function setOzetMode(el){
  document.querySelectorAll("[data-oz]").forEach(p=>p.classList.remove("on"));
  el.classList.add("on");ozetMode=el.dataset.oz;renderOzet();
}
function renderOzet(){
  const all=state.people.map(p=>({p,c:calc(p)})).filter(x=>ozetMode==="kisa"?x.c.toplam>0:true);
  const sum=all.reduce((a,x)=>a+x.c.toplam,0);
  document.getElementById("ozetBox").innerHTML=`<h2>Ozet</h2><p class="muted">${all.length} kisi · ${tl(sum)}</p><table><tr><th>Ad</th><th>Mesai</th><th>HS</th><th>Toplam</th></tr>${all.map(x=>`<tr><td>${x.p.name}</td><td>${tl(x.c.mesai)}</td><td>${tl(x.c.hs)}</td><td>${tl(x.c.toplam)}</td></tr>`).join("")}</table>`;
}
function renderFinans(){
  const all=state.people.map(calc);
  document.getElementById("finansBox").innerHTML=`<div class="stats">
    <div class="stat"><span>Mesai</span><b>${tl(all.reduce((a,b)=>a+b.mesai,0))}</b></div>
    <div class="stat"><span>HS</span><b>${tl(all.reduce((a,b)=>a+b.hs,0))}</b></div>
    <div class="stat"><span>Yol</span><b>${tl(all.reduce((a,b)=>a+b.yol,0))}</b></div>
    <div class="stat"><span>Prim</span><b>${tl(all.reduce((a,b)=>a+b.prim,0))}</b></div>
    <div class="stat"><span>Izin + yillik</span><b>${tl(all.reduce((a,b)=>a+b.izin+b.yillik,0))}</b></div>
    <div class="stat"><span>Genel</span><b>${tl(all.reduce((a,b)=>a+b.toplam,0))}</b></div>
  </div>`;
}
function save(){persist();toast("Kaydedildi");}
function resetData(){
  if(!confirm("Tum yerel kayit sifirlansin mi?"))return;
  localStorage.removeItem(KEY);
  state=hydratePeople(JSON.parse(JSON.stringify(SEED||{people:[]})));
  persist();renderListe();toast("Sifirlandi");
}
function openAdd(){
  editId=null;
  document.getElementById("modalTitle").textContent="Yeni kisi";
  fName.value="";fSira.value=state.people.length+1;fMesai.value=0;fMesaiBirim.value=300;fHs.value=0;fPrim.value=0;fYol.value=0;fYolBirim.value=1200;fIzin.value=0;fYillik.value=0;fDisk.value=0;fKurye.value="0";
  document.getElementById("primBox").classList.add("hide");
  document.getElementById("modal").classList.add("show");
}
function openEdit(id){
  const p=state.people.find(x=>x.id===id);if(!p)return;
  editId=id;
  document.getElementById("modalTitle").textContent=p.name;
  fName.value=p.name;fSira.value=state.people.findIndex(x=>x.id===id)+1;
  fMesai.value=p.mesaiSaat||0;fMesaiBirim.value=p.mesaiBirim||0;fHs.value=p.hsSaat||0;fPrim.value=p.primAdet||0;
  fYol.value=p.yolGun||0;fYolBirim.value=p.yolBirim||1200;fIzin.value=p.izinTutar||0;fYillik.value=p.yillikTutar||0;fDisk.value=p.disiplinDk||0;fKurye.value=p.kurye?"1":"0";
  document.getElementById("primBox").classList.toggle("hide",!p.kurye);
  document.getElementById("modal").classList.add("show");
}
function closeModal(){document.getElementById("modal").classList.remove("show");}
function savePerson(){
  const obj=hydratePerson({
    name:fName.value.trim()||"Isimsiz",
    mesaiSaat:fMesai.value,mesaiBirim:fMesaiBirim.value,hsSaat:fHs.value,primAdet:fPrim.value,
    yolGun:fYol.value,yolBirim:fYolBirim.value,izinTutar:fIzin.value,yillikTutar:fYillik.value,disiplinDk:fDisk.value,
    kurye:fKurye.value==="1"
  });
  if(!obj.kurye)obj.primAdet=0;
  if(editId==null){
    obj.id=Math.max(0,...state.people.map(p=>p.id||0))+1;
    state.people.splice(Math.max(0,(parseInt(fSira.value,10)||1)-1),0,obj);
  }else{
    const p=state.people.find(x=>x.id===editId);
    Object.assign(p,obj,{id:p.id});
  }
  persist();closeModal();renderListe();
}
function delPerson(){if(editId==null)return;delById(editId);closeModal();}
function delById(id){if(!confirm("Silinsin mi?"))return;state.people=state.people.filter(p=>p.id!==id);persist();renderListe();}
function exportCSV(){
  const rows=[["No","Ad","Mesai saat","Birim","HS","Toplam"].join(";")].concat(
    state.people.map((p,i)=>{const c=calc(p);return [i+1,p.name,p.mesaiSaat||0,p.mesaiBirim||0,p.hsSaat||0,Math.round(c.toplam)].join(";");})
  );
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob(["\ufeff"+rows.join("\n")],{type:"text/csv;charset=utf-8"}));
  a.download="cadde-bordro.csv";a.click();
}
async function sharePDF(){
  if(!window.jspdf||!window.jspdf.jsPDF){toast("PDF yok");return;}
  const doc=new window.jspdf.jsPDF();
  doc.setFontSize(14);doc.text("Cadde Mesai Listesi",10,12);
  let y=20;
  state.people.forEach(p=>{
    const c=calc(p);if(c.toplam<=0)return;
    if(y>280){doc.addPage();y=16;}
    doc.setFontSize(10);doc.text(p.name+"  "+Math.round(c.toplam)+" TL",10,y);y+=6;
  });
  doc.save("cadde-bordro.pdf");
}
function buildMobileNav(){
  const nav=document.getElementById("mobileNav");
  nav.innerHTML=["liste","hs","kurye","devam","ceza","ozet","finans"].map(id=>`<button class="nav-btn ${id==="liste"?"on":""}" data-tab="${id}" onclick="tab(this)">${TITLES[id]}</button>`).join("");
}
buildMobileNav();
renderListe();
