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
  if(!window.jspdf||!window.jspdf.jsPDF){toast("PDF yok");return;}
  toast("Ozet PDF hazirlaniyor...");
  const {jsPDF}=window.jspdf;
  const s=sums();
  const now=new Date().toLocaleString("tr-TR",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"});
  const land=mode!=="kisa";
  const doc=new jsPDF({orientation:land?"landscape":"portrait",unit:"mm",format:"a4"});
  const hasFont=await ensurePdfFont(doc);
  const font=hasFont?"DejaVu":"helvetica";
  const W=doc.internal.pageSize.getWidth();
  const H=doc.internal.pageSize.getHeight();
  const title=mode==="kisa"?"KISA OZET":"AYRINTILI OZET";
  pdfDrawChrome(doc,font,W,H,now,s.pay.length,s.all.length);
  doc.setPage(1);
  doc.setTextColor(31,75,143);
  doc.setFont(font,"normal");
  doc.setFontSize(11);
  doc.text(title,10,20);
  doc.setFontSize(8);
  doc.setTextColor(70,70,70);
  doc.text(s.all.length+" kisi  ·  "+s.pay.length+" odeme  ·  "+tl(s.toplam)+" TL",10,25);
  if(mode==="kisa"){
    doc.autoTable({
      startY:28,
      head:[["No","Ad Soyad","Odenecek"]],
      body:s.all.map((x,i)=>[String(i+1),x.p.name+(x.p.kurye?" (K)":""),dash(x.c.toplam)]),
      foot:[["","TOPLAM",tl(s.toplam)]],
      theme:"grid",
      styles:{font,fontSize:8,cellPadding:1.1,textColor:[31,41,51],lineColor:[232,223,210]},
      headStyles:{fillColor:[31,75,143],textColor:[255,255,255]},
      footStyles:{fillColor:[34,34,34],textColor:[255,255,255]},
      columnStyles:{0:{cellWidth:14,halign:"center"},1:{halign:"left"},2:{halign:"right",cellWidth:36,fillColor:[243,232,210]}},
      alternateRowStyles:{fillColor:[250,247,242]},
      margin:{left:10,right:10,top:16,bottom:10},
      didDrawPage:function(){pdfDrawChrome(doc,font,W,H,now,s.pay.length,s.all.length);}
    });
    await outPdf(doc,"cadde-kisa-ozet.pdf");
  }else{
    doc.autoTable({
      startY:28,
      head:[["No","Ad Soyad","Mesai","HS","Prim","Yol","Izin","Yillik","Odenecek"]],
      body:s.all.map((x,i)=>[String(i+1),x.p.name+(x.p.kurye?" (K)":""),dash(x.c.mesai),dash(x.c.hs),dash(x.c.prim),dash(x.c.yol),dash(x.c.izin),dash(x.c.yillik),dash(x.c.toplam)]),
      foot:[["","TOPLAM",tl(s.mesai),tl(s.hs),tl(s.prim),tl(s.yol),tl(s.izin),tl(s.yillik),tl(s.toplam)]],
      theme:"grid",
      styles:{font,fontSize:7,cellPadding:0.8,halign:"center",textColor:[31,41,51],lineColor:[232,223,210]},
      headStyles:{fillColor:[31,75,143],textColor:[255,255,255]},
      footStyles:{fillColor:[34,34,34],textColor:[255,255,255]},
      columnStyles:{0:{cellWidth:10},1:{halign:"left",cellWidth:58},8:{fillColor:[243,232,210]}},
      alternateRowStyles:{fillColor:[250,247,242]},
      margin:{left:10,right:10,top:16,bottom:10},
      didDrawPage:function(){pdfDrawChrome(doc,font,W,H,now,s.pay.length,s.all.length);}
    });
    await outPdf(doc,"cadde-ayrintili-ozet.pdf");
  }
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
    return `<div class="mrow ${c.toplam>0?"pay":""} ${on?"on":""}">\n      <button type="button" class="mhead" onclick="toggleMob(${p.id},event)">\n        <span class="mno">${no}</span>\n        <span class="mname">${p.name}${p.kurye?" <small>K</small>":""}</span>\n        <span class="mtot">${dash(c.toplam)}</span>\n      </button>\n      ${on?`<div class="mfields">\n        <label>Mesai<input type="number" step="0.5" value="${p.mesaiSaat||""}" onchange="setVal(${p.id},'mesaiSaat',this.value)"></label>\n        <label>HS<input type="number" step="0.5" value="${p.hsSaat||""}" onchange="setVal(${p.id},'hsSaat',this.value)"></label>\n        <label>Yol<input type="number" value="${p.yolTutar||""}" onchange="setVal(${p.id},'yolTutar',this.value)"></label>\n        <label>Izin g<input type="number" step="0.5" value="${p.izinGun||""}" onchange="setVal(${p.id},'izinGun',this.value)"></label>\n        <label>Izin TL<input type="number" value="${p.izinTutar||""}" onchange="setVal(${p.id},'izinTutar',this.value)"></label>\n        <label>Yillik<input type="number" value="${p.yillikTutar||""}" onchange="setVal(${p.id},'yillikTutar',this.value)"></label>\n      </div>`:""}\n    </div>`;
  }).join("")+`</div>`;
};
const _renderOzet=renderOzet;
renderOzet=function(){
  const s=sums();
  const kisa=document.getElementById("ozetKisa");
  const ayr=document.getElementById("ozetAyrinti");
  if(!kisa||!ayr){ _renderOzet(); return; }
  kisa.innerHTML=`<div class="row" style="justify-content:space-between;padding:0 0 10px"><h2 style="margin:0">Kisa ozet</h2><button class="btn primary" onclick="shareOzetPDF('kisa')">PDF paylas</button></div>\n    <p>${s.all.length} kisi · ${s.pay.length} odeme · <b>${tl(s.toplam)} TL</b></p>\n    <table class="sheet slim"><thead><tr><th>No</th><th>Ad Soyad</th><th>Toplam</th></tr></thead>\n    <tbody>${s.all.map((x,i)=>`<tr class="${x.c.toplam>0?"pay":"zero"}"><td>${i+1}</td><td class="name">${x.p.name}</td><td class="tot">${dash(x.c.toplam)}</td></tr>`).join("")}</tbody>\n    <tfoot><tr><td></td><td>TOPLAM</td><td>${tl(s.toplam)}</td></tr></tfoot></table>`;
  ayr.innerHTML=`<div class="row" style="justify-content:space-between;padding:0 0 10px"><h2 style="margin:0">Ayrintili ozet</h2><button class="btn primary" onclick="shareOzetPDF('ayrinti')">PDF paylas</button></div>\n    <p>${s.all.length} kisi · ${s.pay.length} odeme · ${tl(s.toplam)} TL</p>\n    <table class="sheet slim"><thead><tr><th>No</th><th>Ad</th><th>Mesai</th><th>HS</th><th>Prim</th><th>Yol</th><th>Izin</th><th>Yillik</th><th>Toplam</th></tr></thead>\n    <tbody>${s.all.map((x,i)=>`<tr class="${x.c.toplam>0?"pay":"zero"}">\n      <td>${i+1}</td><td class="name">${x.p.name}</td><td>${dash(x.c.mesai)}</td><td>${dash(x.c.hs)}</td>\n      <td>${dash(x.c.prim)}</td><td>${dash(x.c.yol)}</td><td>${dash(x.c.izin)}</td>\n      <td>${dash(x.c.yillik)}</td><td>${dash(x.c.toplam)}</td></tr>`).join("")}</tbody>\n    <tfoot><tr><td></td><td>TOPLAM</td><td>${tl(s.mesai)}</td><td>${tl(s.hs)}</td><td>${tl(s.prim)}</td><td>${tl(s.yol)}</td><td>${tl(s.izin)}</td><td>${tl(s.yillik)}</td><td>${tl(s.toplam)}</td></tr></tfoot></table>`;
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
  box.innerHTML=`\n    <div class="rapor-head">\n      <div>\n        <div class="muted">Aylik finansal rapor</div>\n        <h2>Cadde Personel Odemeleri</h2>\n        <p>${periodLabel()} · ${s.pay.length} kisiye odeme · ${s.all.length} kisi kayitli</p>\n      </div>\n      <button class="btn" onclick="window.print()">Yazdir</button>\n    </div>\n    <div class="stats rapor-stats">\n      <div class="stat"><span>Odenecek toplam</span><b>${tl(s.toplam)} TL</b></div>\n      <div class="stat"><span>Odemesi olan</span><b>${s.pay.length} / ${s.all.length}</b></div>\n      <div class="stat"><span>Hafta sonu</span><b>${tl(s.hs)} TL</b></div>\n      <div class="stat"><span>Mesai + izin</span><b>${tl(s.mesai+s.izin+s.yillik)} TL</b></div>\n    </div>\n    <div class="panel">\n      <h3>Kalem dagilimi</h3>\n      <table class="sheet slim"><thead><tr><th>Kalem</th><th>Tutar</th><th>Pay</th></tr></thead>\n      <tbody>${kalem.map(([k,v])=>`<tr><td class="name">${k}</td><td>${dash(v)}</td><td>${s.toplam?((v/s.toplam)*100).toFixed(1):"0"}%</td></tr>`).join("")}</tbody>\n      <tfoot><tr><td>GENEL TOPLAM</td><td>${tl(s.toplam)}</td><td>100%</td></tr></tfoot></table>\n    </div>\n    <div class="panel">\n      <h3>Kisi kisi odeme listesi</h3>\n      <table class="sheet slim"><thead><tr><th>No</th><th>Ad Soyad</th><th>Mesai</th><th>HS</th><th>Izin+Yillik</th><th>Diger</th><th>Odenecek</th></tr></thead>\n      <tbody>${s.all.map((x,i)=>`<tr class="${x.c.toplam>0?"pay":"zero"}">\n        <td>${i+1}</td><td class="name">${x.p.name}${x.p.kurye?" <small>KURYE</small>":""}</td>\n        <td>${dash(x.c.mesai)}</td><td>${dash(x.c.hs)}</td>\n        <td>${dash(x.c.izin+x.c.yillik)}</td>\n        <td>${dash(x.c.prim+x.c.yol+x.c.dis)}</td>\n        <td class="tot">${dash(x.c.toplam)}</td></tr>`).join("")}</tbody>\n      <tfoot><tr><td colspan="2">TOPLAM</td><td>${tl(s.mesai)}</td><td>${tl(s.hs)}</td><td>${tl(s.izin+s.yillik)}</td><td>${tl(s.prim+s.yol+s.dis)}</td><td>${tl(s.toplam)}</td></tr></tfoot></table>\n    </div>\n    <div class="panel">\n      <h3>Devamsizlik</h3>\n      ${devam.length?`<table class="sheet slim"><thead><tr><th>No</th><th>Ad Soyad</th><th>Gun</th><th>Not</th></tr></thead><tbody>${devam.map((d,i)=>`<tr><td>${i+1}</td><td class="name">${d.kisi}</td><td>${d.gun}</td><td class="name">${d.not||"-"}</td></tr>`).join("")}</tbody></table>`:"<p class='muted'>Kayit yok</p>"}\n    </div>`;
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
