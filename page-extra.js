(function(){
function css(){
  if(document.getElementById("pagePdfCss"))return;
  var st=document.createElement("style");
  st.id="pagePdfCss";
  st.textContent=".page-pdf{gap:6px;margin:6px 0}#duzenleList input.nm{width:100%;text-align:left;min-width:180px}#asFab,#asPanel{display:none!important}#ozetKisa table{width:100%!important;max-width:none!important;min-width:0!important}#kisiPanel table.kisi-table{max-width:420px!important;min-width:0!important}";
  document.head.appendChild(st);
}
function bar(kind){
  return '<div class="row page-pdf" data-pdfbar="'+kind+'"><button class="btn primary" type="button" onclick="pagePdf(\''+kind+'\',false)">PDF indir</button><button class="btn" type="button" onclick="pagePdf(\''+kind+'\',true)">Paylas</button></div>';
}
function attach(){
  css();
  var fab=document.getElementById("asFab"); if(fab) fab.remove();
  var pan=document.getElementById("asPanel"); if(pan) pan.remove();
  [["sec-liste",".panel","liste"],["sec-kurye",".panel","kurye"],["sec-devam",".panel","devam"],["sec-ceza",".panel","ceza"],["sec-rapor",".rapor-head","rapor"]].forEach(function(it){
    var root=document.getElementById(it[0]); if(!root)return;
    var host=root.querySelector(it[1])||root;
    if(host.querySelector("[data-pdfbar='"+it[2]+"']"))return;
    var d=document.createElement("div");
    d.innerHTML=bar(it[2]);
    host.appendChild(d.firstChild);
  });
}
function _sums(){return typeof sums==="function"?sums():{all:[],pay:[],mesai:0,hs:0,prim:0,yol:0,izin:0,yillik:0,dis:0,toplam:0};}
function trimPages(doc,max){
  var n=doc.getNumberOfPages();
  while(n>max){ doc.deletePage(n); n--; }
}
async function drawRaporPro(doc, font, s, now) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  let logoOk = false;
  try {
    const logoB64 = "iVBORw0KGgoAAAANSUhEUgAAAXkAAABWCAYAAAAqjuZqAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAgAElEQVR4nO2dW4hVRxaG";
    doc.addImage("data:image/png;base64," + logoB64, "PNG", 8, 3, 48, 11);
    logoOk = true;
  } catch(e) { console.warn("Logo eklenemedi", e); }
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 0, W, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont(font, "bold");
  doc.setFontSize(13);
  doc.text("KIZILKAYALAR CADDE", logoOk ? 60 : 10, 8);
  doc.setFontSize(8);
  doc.setFont(font, "normal");
  doc.text("AYLIK MESAİ VE ÖDEME RAPORU", logoOk ? 60 : 10, 14);
  doc.setFontSize(7.5);
  doc.text(now, W - 8, 10, { align: "right" });
  const boxes = [
    ["GENEL TOPLAM", tl(s.toplam) + " TL", 234, 88, 12],
    ["HAFTA SONU", tl(s.hs) + " TL", 15, 123, 76],
    ["MESAİ", tl(s.mesai) + " TL", 196, 92, 38],
    ["İZİN + YILLIK", tl(s.izin + s.yillik) + " TL", 90, 70, 140]
  ];
  boxes.forEach((b, i) => {
    const x = 8 + i * 72;
    doc.setFillColor(b[2], b[3], b[4]);
    doc.rect(x, 22, 68, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont(font, "normal");
    doc.setFontSize(6.5);
    doc.text(b[0], x + 34, 26.5, { align: "center" });
    doc.setFont(font, "bold");
    doc.setFontSize(8);
    doc.text(b[1], x + 34, 32, { align: "center" });
  });
  const body = s.all.map((x, i) => [
    String(i + 1),
    x.p.name + (x.p.kurye ? " (K)" : ""),
    dash(x.c.mesai),
    dash(x.c.hs),
    dash(x.c.prim),
    dash(x.c.yol),
    dash(x.c.izin),
    dash(x.c.yillik),
    dash(x.c.dis),
    dash(x.c.toplam)
  ]);
  doc.autoTable({
    startY: 40,
    head: [["No", "Ad Soyad", "Mesai", "HS", "Prim", "Yol", "İzin", "Yıllık", "Disiplin", "Toplam"]],
    body: body,
    foot: [["", "TOPLAM", tl(s.mesai), tl(s.hs), tl(s.prim), tl(s.yol), tl(s.izin), tl(s.yillik), tl(s.dis), tl(s.toplam)]],
    theme: "grid",
    styles: { font: font, fontSize: 6.2, cellPadding: 0.8, textColor: [30, 30, 30], lineColor: [220, 220, 220], overflow: "linebreak" },
    headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontStyle: "bold" },
    footStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 10, halign: "center" }, 1: { cellWidth: 55, halign: "left" }, 9: { fontStyle: "bold", halign: "right" } },
    margin: { left: 8, right: 8, top: 22, bottom: 12 },
    showHead: "everyPage",
    didDrawPage: function(data) {
      doc.setFillColor(234, 88, 12);
      doc.rect(0, H - 8, W, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont(font, "normal");
      doc.setFontSize(7);
      doc.text("Kızılkayalar Cadde  ·  Gizli Personel Belgesi", 8, H - 3.2);
      doc.text("Sayfa " + doc.internal.getNumberOfPages(), W - 8, H - 3.2, { align: "right" });
    }
  });
  let y = doc.lastAutoTable.finalY + 6;
  const devam = (typeof state !== "undefined" ? state.devamsizlik : []) || [];
  const cezalar = (typeof state !== "undefined" ? state.cezalar : []) || [];
  if (devam.length) {
    if (y > H - 40) { doc.addPage(); y = 22; }
    doc.setTextColor(234, 88, 12);
    doc.setFont(font, "bold");
    doc.setFontSize(9);
    doc.text("DEVAMSIZLIK", 8, y);
    doc.autoTable({
      startY: y + 2,
      head: [["No", "Ad Soyad", "Gün", "Not", "Tarih"]],
      body: devam.map((d, i) => [String(i + 1), d.kisi, String(d.gun), d.not || "-", (d.tarih||d.date||"").toString().slice(0,10)]),
      theme: "grid",
      styles: { font: font, fontSize: 6, cellPadding: 0.6 },
      headStyles: { fillColor: [234, 88, 12], textColor: 255 },
      margin: { left: 8, right: 8 }
    });
    y = doc.lastAutoTable.finalY + 6;
  }
  if (cezalar.length) {
    if (y > H - 40) { doc.addPage(); y = 22; }
    doc.setTextColor(234, 88, 12);
    doc.setFont(font, "bold");
    doc.setFontSize(9);
    doc.text("CEZALAR", 8, y);
    doc.autoTable({
      startY: y + 2,
      head: [["No", "Ad Soyad", "Tutar", "Neden", "Tarih"]],
      body: cezalar.map((c, i) => [String(i + 1), c.kisi, tl(c.tutar) + " TL", c.neden || "-", (c.tarih||c.date||"").toString().slice(0,10)]),
      theme: "grid",
      styles: { font: font, fontSize: 6, cellPadding: 0.6 },
      headStyles: { fillColor: [234, 88, 12], textColor: 255 },
      margin: { left: 8, right: 8 }
    });
  }
}
function drawKisaOne(doc,font,s,now,fs,pad){
  var W=doc.internal.pageSize.getWidth();
  doc.setFillColor(11,18,32);
  doc.rect(0,0,W,10,"F");
  doc.setFont(font,"bold"); doc.setFontSize(11); doc.setTextColor(255,255,255);
  doc.text("CADDE  \u00b7  KISA OZET",8,6.8);
  doc.setFont(font,"normal"); doc.setFontSize(7.5);
  doc.text(now,W-8,6.8,{align:"right"});
  var body=s.all.map(function(x,i){return [String(i+1),x.p.name+(x.p.kurye?" (K)":""),tl(x.c.toplam)];});
  doc.autoTable({
    startY:14,
    head:[["No","Ad Soyad","Odenecek"]],
    body:body,
    foot:[["","TOPLAM",tl(s.toplam)]],
    theme:"grid",
    styles:{font:font,fontSize:fs,cellPadding:pad,halign:"center",textColor:[20,20,20],lineColor:[210,210,210],overflow:"ellipsize",minCellHeight:fs*0.55},
    headStyles:{fillColor:[31,75,143],textColor:[255,255,255],fontSize:fs,cellPadding:pad},
    footStyles:{fillColor:[34,34,34],textColor:[255,255,255],fontSize:fs},
    columnStyles:{0:{cellWidth:12},1:{halign:"left",cellWidth:90},2:{halign:"right"}},
    margin:{left:8,right:8}
  });
}
async function pagePdf(kind,share){
  if(!window.jspdf||!window.jspdf.jsPDF){toast("PDF yok");return;}
  var jsPDF=window.jspdf.jsPDF;
  var s=_sums();
  var now=new Date().toLocaleString("tr-TR",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"});
  var hasFont=false, font="helvetica", doc;
  if(kind==="ozet-kisa"){
    doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    hasFont=await ensurePdfFont(doc);
    font=hasFont?"DejaVu":"helvetica";
    drawKisaOne(doc,font,s,now,8,1.2);
  }else if(kind==="ozet-ayrinti"||kind==="liste"){
    doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
    hasFont=await ensurePdfFont(doc);
    font=hasFont?"DejaVu":"helvetica";
    var fs=7, pad=0.6;
    var body=s.all.map(function(x,i){return [String(i+1),x.p.name+(x.p.kurye?" (K)":""),dash(x.c.mesai),dash(x.c.hs),dash(x.c.prim),dash(x.c.yol),dash(x.c.izin),dash(x.c.yillik),dash(x.c.dis),dash(x.c.toplam)];});
    doc.autoTable({
      startY:16,
      head:[["No","Ad Soyad","Mesai","HS","Prim","Yol","Izin","Yillik","Disiplin","Odenecek"]],
      body:body,
      foot:[["","TOPLAM",tl(s.mesai),tl(s.hs),tl(s.prim),tl(s.yol),tl(s.izin),tl(s.yillik),tl(s.dis),tl(s.toplam)]],
      theme:"grid",
      styles:{font:font,fontSize:fs,cellPadding:pad,halign:"center",overflow:"ellipsize",minCellHeight:fs*0.5,textColor:[20,20,20]},
      headStyles:{fillColor:[31,75,143],textColor:[255,255,255],fontSize:fs,cellPadding:pad},
      footStyles:{fillColor:[34,34,34],textColor:[255,255,255],fontSize:fs},
      columnStyles:{0:{cellWidth:8},1:{halign:"left",cellWidth:55}},
      margin:{left:8,right:8},
      showHead:"everyPage"
    });
  }else if(kind==="rapor"){
    doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
    hasFont=await ensurePdfFont(doc);
    font=hasFont?"DejaVu":"helvetica";
    await drawRaporPro(doc,font,s,now);
  }else{
    doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    hasFont=await ensurePdfFont(doc);
    font=hasFont?"DejaVu":"helvetica";
    var title=kind==="devam"?"DEVAMSIZLIK":kind==="ceza"?"CEZALAR":kind==="kurye"?"KURYE PRIM":kind.toUpperCase();
    var head,body,foot,col;
    if(kind==="devam"){
      head=[["No","Ad Soyad","Gun","Not"]];
      body=((typeof state!=="undefined"?state.devamsizlik:[])||[]).map(function(d,i){return [String(i+1),d.kisi,String(d.gun),d.not||"-"];});
      col={0:{cellWidth:12},1:{cellWidth:70,halign:"left"}};
    }else if(kind==="ceza"){
      head=[["No","Ad Soyad","Tutar","Neden"]];
      body=((typeof state!=="undefined"?state.cezalar:[])||[]).map(function(c,i){return [String(i+1),c.kisi,tl(c.tutar)+" TL",c.neden||"-"];});
      col={0:{cellWidth:12},1:{cellWidth:60,halign:"left"},2:{halign:"right"}};
    }else{
      head=[["No","Ad"]];
      body=s.all.map(function(x,i){return [String(i+1),x.p.name];});
    }
    doc.setFont(font,"normal"); doc.setFontSize(10); doc.setTextColor(31,75,143); doc.text(title,10,20);
    var opt={startY:24,head:head,body:body,theme:"grid",styles:{font:font,fontSize:6.2,cellPadding:0.55,halign:"center",textColor:[31,41,51],lineColor:[232,223,210],overflow:"linebreak"},headStyles:{fillColor:[31,75,143],textColor:[255,255,255]},footStyles:{fillColor:[34,34,34],textColor:[255,255,255]},columnStyles:col,margin:{left:10,right:10,top:16,bottom:10}};
    if(foot) opt.foot=foot;
    doc.autoTable(opt);
  }
  if(share && typeof outPdf==="function") await outPdf(doc,"cadde-"+kind+".pdf");
  else { doc.save("cadde-"+kind+".pdf"); toast("PDF indirildi"); }
}
function renderDuzenle(){
  var box=document.getElementById("duzenleList");
  if(!box)return;
  var rows=(typeof state!=="undefined"&&state.people)?state.people:[];
  var max=rows.length;
  box.innerHTML='<div class="table-wrap" style="max-height:70vh;padding:0"><table class="sheet slim"><thead><tr><th>Sira</th><th>Ad Soyad</th><th>Kurye</th><th>Birim</th><th></th></tr></thead><tbody>'+
    rows.map(function(p,i){
      return '<tr data-id="'+p.id+'"><td><input type="number" class="sira" value="'+(i+1)+'" min="1" max="'+max+'" style="width:56px;text-align:center"></td><td class="name"><input class="nm"></td><td><input type="checkbox" class="ky"'+(p.kurye?" checked":"")+'></td><td><input type="number" class="br" value="'+(p.mesaiBirim||300)+'"></td><td><button class="btn del" type="button">Sil</button></td></tr>';
    }).join("")+"</tbody></table></div>";
  rows.forEach(function(p){
    var tr=box.querySelector('tr[data-id="'+p.id+'"]');
    if(!tr)return;
    var nm=tr.querySelector(".nm");
    if(nm) nm.value=p.name||"";
  });
  box.onchange=function(ev){
    var tr=ev.target.closest("tr[data-id]"); if(!tr)return;
    var id=+tr.getAttribute("data-id");
    var p=state.people.find(function(x){return x.id===id;}); if(!p)return;
    if(ev.target.classList.contains("nm")){ p.name=ev.target.value.trim(); persist(); toast("Isim guncellendi"); }
    if(ev.target.classList.contains("ky")){ p.kurye=!!ev.target.checked; persist(); renderAll(); }
    if(ev.target.classList.contains("br")){ p.mesaiBirim=num(ev.target.value,300); persist(); renderAll(); }
    if(ev.target.classList.contains("sira")){
      var newPos=parseInt(ev.target.value,10)||1;
      if(newPos<1) newPos=1;
      if(newPos>state.people.length) newPos=state.people.length;
      window.setSira(id, newPos);
    }
  };
  box.onclick=function(ev){
    var tr=ev.target.closest("tr[data-id]"); if(!tr)return;
    var id=+tr.getAttribute("data-id");
    if(ev.target.classList.contains("del")){ if(typeof silKisi==="function") silKisi(id); renderDuzenle(); }
  };
}
window.renderDuzenle=renderDuzenle;
window.setSira=function(id, newPos){
  var i=state.people.findIndex(function(x){return x.id===id;});
  if(i<0) return;
  var person=state.people.splice(i,1)[0];
  var target=Math.max(0, Math.min(newPos-1, state.people.length));
  state.people.splice(target, 0, person);
  persist();
  renderDuzenle();
  renderAll();
  toast("Sira guncellendi");
};
window.tab=function(el){
  document.querySelectorAll(".tab[data-tab]").forEach(function(t){t.classList.toggle("on",t===el);});
  var id=el.dataset.tab;
  ["liste","kurye","devam","ceza","ozet","rapor","duzenle"].forEach(function(s){
    var e=document.getElementById("sec-"+s); if(e) e.classList.toggle("hide",s!==id);
  });
  if(id==="kurye") renderKurye();
  if(id==="devam") renderDevam();
  if(id==="ceza") renderCeza();
  if(id==="ozet"){ renderOzet(); if(typeof ozetMod==="function") ozetMod((document.querySelector("[data-ozet].on")||{}).dataset.ozet||"kisa"); }
  if(id==="rapor") renderRapor();
  if(id==="duzenle") renderDuzenle();
};
var _ra=renderAll;
renderAll=function(){
  _ra();
  attach();
  var d=document.getElementById("sec-duzenle");
  if(d && !d.classList.contains("hide")) renderDuzenle();
};
setTimeout(attach,400);
setTimeout(attach,1200);
window.pagePdf = pagePdf;
})();
