(function(){
function css(){
  if(document.getElementById("pagePdfCss"))return;
  var st=document.createElement("style");
  st.id="pagePdfCss";
  st.textContent=".page-pdf{gap:6px;margin:6px 0}#duzenleList input.nm{width:100%;text-align:left;min-width:140px}#duzenleList input.sira{width:36px!important;padding:2px;text-align:center;font-size:12px}#asFab,#asPanel{display:none!important}#ozetKisa table{width:100%!important;max-width:none!important;min-width:0!important}#kisiPanel table.kisi-table{max-width:420px!important;min-width:0!important}";
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
function isCadde(){ return typeof currentBranch==="undefined" || currentBranch==="Cadde"; }
function branchName(){ return typeof currentBranch!=="undefined" ? currentBranch : "Cadde"; }

async function pagePdf(kind, share){
  if(!window.jspdf||!window.jspdf.jsPDF){toast("PDF yok");return;}
  var jsPDF=window.jspdf.jsPDF;
  var s=_sums();
  var now=new Date().toLocaleString("tr-TR",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"});
  var br=branchName();
  var hasFont=false, font="helvetica", doc;
  
  if(kind==="ozet-kisa"){
    doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    hasFont=typeof ensurePdfFont==="function"?await ensurePdfFont(doc):false;
    font=hasFont?"DejaVu":"helvetica";
    doc.setFillColor(11,18,32);
    doc.rect(0,0,210,12,"F");
    doc.setFont(font,"bold"); doc.setFontSize(12); doc.setTextColor(255,255,255);
    doc.text(br+" \u00b7 KISA OZET",10,8);
    doc.setFont(font,"normal"); doc.setFontSize(8);
    doc.text(now,200,8,{align:"right"});
    var body=s.all.map(function(x,i){return [String(i+1),x.p.name,tl(x.c.toplam)];});
    doc.autoTable({
      startY:16,
      head:[["No","Ad Soyad","Odenecek"]],
      body:body,
      foot:[["","TOPLAM",tl(s.toplam)]],
      theme:"grid",
      styles:{font:font,fontSize:8,cellPadding:1,halign:"center",textColor:[20,20,20]},
      headStyles:{fillColor:[31,75,143],textColor:[255,255,255]},
      footStyles:{fillColor:[34,34,34],textColor:[255,255,255]},
      columnStyles:{0:{cellWidth:15},1:{halign:"left",cellWidth:100},2:{halign:"right"}},
      margin:{left:10,right:10}
    });
  }else if(kind==="ozet-ayrinti"||kind==="liste"){
    doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
    hasFont=typeof ensurePdfFont==="function"?await ensurePdfFont(doc):false;
    font=hasFont?"DejaVu":"helvetica";
    doc.setFillColor(11,18,32);
    doc.rect(0,0,297,12,"F");
    doc.setFont(font,"bold"); doc.setFontSize(12); doc.setTextColor(255,255,255);
    doc.text(br+" \u00b7 LISTE",10,8);
    doc.setFont(font,"normal"); doc.setFontSize(8);
    doc.text(now,287,8,{align:"right"});
    var body=s.all.map(function(x,i){return [String(i+1),x.p.name,dash(x.c.mesai),dash(x.c.hs),dash(x.c.prim),dash(x.c.yol),dash(x.c.izin),dash(x.c.yillik),dash(x.c.toplam)];});
    doc.autoTable({
      startY:16,
      head:[["No","Ad Soyad","Mesai","HS","Prim","Yol","Izin","Yillik","Toplam"]],
      body:body,
      foot:[["","TOPLAM",tl(s.mesai),tl(s.hs),tl(s.prim),tl(s.yol),tl(s.izin),tl(s.yillik),tl(s.toplam)]],
      theme:"grid",
      styles:{font:font,fontSize:7,cellPadding:0.8,halign:"center",textColor:[20,20,20]},
      headStyles:{fillColor:[31,75,143],textColor:[255,255,255]},
      footStyles:{fillColor:[34,34,34],textColor:[255,255,255]},
      columnStyles:{0:{cellWidth:12},1:{halign:"left",cellWidth:50}},
      margin:{left:8,right:8}
    });
  }else if(kind==="rapor"){
    doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
    hasFont=typeof ensurePdfFont==="function"?await ensurePdfFont(doc):false;
    font=hasFont?"DejaVu":"helvetica";
    doc.setFillColor(234,88,12);
    doc.rect(0,0,297,14,"F");
    doc.setFont(font,"bold"); doc.setFontSize(14); doc.setTextColor(255,255,255);
    doc.text(br+" AYLIK RAPOR",10,9);
    doc.setFont(font,"normal"); doc.setFontSize(8);
    doc.text(now,287,9,{align:"right"});
    var body=s.all.map(function(x,i){return [String(i+1),x.p.name,dash(x.c.mesai),dash(x.c.hs),dash(x.c.yol),dash(x.c.izin),dash(x.c.yillik),dash(x.c.toplam)];});
    doc.autoTable({
      startY:20,
      head:[["No","Ad Soyad","Mesai","HS","Yol","Izin","Yillik","Toplam"]],
      body:body,
      foot:[["","TOPLAM",tl(s.mesai),tl(s.hs),tl(s.yol),tl(s.izin),tl(s.yillik),tl(s.toplam)]],
      theme:"grid",
      styles:{font:font,fontSize:7,cellPadding:0.8,halign:"center"},
      headStyles:{fillColor:[234,88,12],textColor:[255,255,255]},
      footStyles:{fillColor:[30,30,30],textColor:[255,255,255]},
      columnStyles:{0:{cellWidth:12},1:{halign:"left",cellWidth:55}},
      margin:{left:8,right:8}
    });
    // Devamsızlık ve Cezalar
    var devam=(typeof state!=="undefined"?state.devamsizlik:[])||[];
    var cezalar=(typeof state!=="undefined"?state.cezalar:[])||[];
    var y=doc.lastAutoTable.finalY+8;
    if(devam.length){
      if(y>180){doc.addPage();y=15;}
      doc.setFont(font,"bold"); doc.setFontSize(11); doc.setTextColor(234,88,12);
      doc.text("DEVAMSIZLIK",8,y);
      doc.autoTable({
        startY:y+3,
        head:[["No","Ad Soyad","Gun","Not"]],
        body:devam.map(function(d,i){return [String(i+1),d.kisi,String(d.gun),d.not||"-"];}),
        theme:"grid",
        styles:{font:font,fontSize:7,cellPadding:0.6},
        headStyles:{fillColor:[234,88,12],textColor:[255,255,255]},
        margin:{left:8,right:8}
      });
      y=doc.lastAutoTable.finalY+8;
    }
    if(cezalar.length){
      if(y>180){doc.addPage();y=15;}
      doc.setFont(font,"bold"); doc.setFontSize(11); doc.setTextColor(234,88,12);
      doc.text("CEZALAR",8,y);
      doc.autoTable({
        startY:y+3,
        head:[["No","Ad Soyad","Tutar","Neden"]],
        body:cezalar.map(function(c,i){return [String(i+1),c.kisi,tl(c.tutar)+" TL",c.neden||"-"];}),
        theme:"grid",
        styles:{font:font,fontSize:7,cellPadding:0.6},
        headStyles:{fillColor:[234,88,12],textColor:[255,255,255]},
        margin:{left:8,right:8}
      });
    }
  }else if(kind==="devam"){
    doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    hasFont=typeof ensurePdfFont==="function"?await ensurePdfFont(doc):false;
    font=hasFont?"DejaVu":"helvetica";
    doc.setFont(font,"bold"); doc.setFontSize(14); doc.setTextColor(31,75,143);
    doc.text(br+" \u00b7 DEVAMSIZLIK",10,15);
    var devam=(typeof state!=="undefined"?state.devamsizlik:[])||[];
    var body=devam.map(function(d,i){return [String(i+1),d.kisi,String(d.gun),d.not||"-"];});
    doc.autoTable({
      startY:22,
      head:[["No","Ad Soyad","Gun","Not"]],
      body:body.length?body:[["","Kayit yok","",""]],
      theme:"grid",
      styles:{font:font,fontSize:8,cellPadding:1},
      headStyles:{fillColor:[31,75,143],textColor:[255,255,255]},
      columnStyles:{0:{cellWidth:15},1:{halign:"left",cellWidth:70}},
      margin:{left:10,right:10}
    });
  }else if(kind==="ceza"){
    doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    hasFont=typeof ensurePdfFont==="function"?await ensurePdfFont(doc):false;
    font=hasFont?"DejaVu":"helvetica";
    doc.setFont(font,"bold"); doc.setFontSize(14); doc.setTextColor(31,75,143);
    doc.text(br+" \u00b7 CEZALAR",10,15);
    var cezalar=(typeof state!=="undefined"?state.cezalar:[])||[];
    var body=cezalar.map(function(c,i){return [String(i+1),c.kisi,tl(c.tutar)+" TL",c.neden||"-"];});
    doc.autoTable({
      startY:22,
      head:[["No","Ad Soyad","Tutar","Neden"]],
      body:body.length?body:[["","Kayit yok","",""]],
      theme:"grid",
      styles:{font:font,fontSize:8,cellPadding:1},
      headStyles:{fillColor:[31,75,143],textColor:[255,255,255]},
      columnStyles:{0:{cellWidth:15},1:{halign:"left",cellWidth:60}},
      margin:{left:10,right:10}
    });
  }else{
    doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    doc.setFont("helvetica","bold"); doc.setFontSize(14);
    doc.text(br+" \u00b7 "+kind.toUpperCase(),10,15);
  }
  
  var filename=br.toLowerCase()+"-"+kind+".pdf";
  if(share && typeof outPdf==="function"){
    await outPdf(doc,filename);
  }else{
    doc.save(filename);
    toast("PDF indirildi");
  }
}
window.pagePdf=pagePdf;

function renderDuzenle(){
  var box=document.getElementById("duzenleList");
  if(!box)return;
  var rows=(typeof state!=="undefined"&&state.people)?state.people:[];
  var max=rows.length;
  var showKurye=isCadde();
  var head='<tr><th style="width:42px">Sıra</th><th>Ad Soyad</th>'+(showKurye?'<th>Kurye</th>':'')+'<th>Birim</th><th>İzin TL</th><th></th></tr>';
  box.innerHTML='<div class="table-wrap" style="max-height:70vh;padding:0"><table class="sheet slim"><thead>'+head+'</thead><tbody>'+
    rows.map(function(p,i){
      var kuryeCell=showKurye?'<td><input type="checkbox" class="ky"'+(p.kurye?" checked":"")+'></td>':'';
      var izinVal = (typeof calc==="function") ? calc(p).izin : (p.izinTutar||0);
      var izinCell = '<td style="text-align:right;font-weight:600">'+(typeof dash==="function"?dash(izinVal):izinVal)+'</td>';
      return '<tr data-id="'+p.id+'"><td><input type="number" class="sira" value="'+(i+1)+'" min="1" max="'+max+'" style="width:36px;text-align:center"></td><td class="name"><input class="nm"></td>'+kuryeCell+'<td><input type="number" class="br" value="'+(p.mesaiBirim||300)+'"></td>'+izinCell+'<td><button class="btn del" type="button">Sil</button></td></tr>';
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
