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
function drawRaporMax2(doc,font,s,now){
  var W=doc.internal.pageSize.getWidth();
  var H=doc.internal.pageSize.getHeight();
  doc.setFillColor(11,18,32);
  doc.rect(0,0,W,10,"F");
  doc.setFont(font,"bold"); doc.setFontSize(11); doc.setTextColor(255,255,255);
  doc.text("CADDE  \u00b7  AYLIK RAPOR",8,6.8);
  doc.setFont(font,"normal"); doc.setFontSize(7.5);
  doc.text(now,W-8,6.8,{align:"right"});
  doc.setTextColor(31,75,143); doc.setFontSize(8);
  var y=16;
  var items=[["Genel toplam",tl(s.toplam)+" TL"],["Mesai",tl(s.mesai)+" TL"],["Hafta sonu",tl(s.hs)+" TL"],["Prim",tl(s.prim)+" TL"],["Yol",tl(s.yol)+" TL"],["Izin",tl(s.izin)+" TL"],["Yillik",tl(s.yillik)+" TL"],["Disiplin",tl(s.dis)+" TL"]];
  items.forEach(function(it,i){
    var x=8+(i%4)*48;
    var yy=y+Math.floor(i/4)*10;
    doc.setFont(font,"normal"); doc.setFontSize(6.5); doc.setTextColor(100,100,100);
    doc.text(it[0],x,yy);
    doc.setFont(font,"bold"); doc.setFontSize(7.5); doc.setTextColor(20,20,20);
    doc.text(it[1],x,yy+3.5);
  });
  return 38;
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
    doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    hasFont=await ensurePdfFont(doc);
    font=hasFont?"DejaVu":"helvetica";
    drawRaporMax2(doc,font,s,now);
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
})();
