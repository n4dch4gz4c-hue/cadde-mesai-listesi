(function(){
function css(){
  if(document.getElementById("pagePdfCss"))return;
  var st=document.createElement("style");
  st.id="pagePdfCss";
  st.textContent=".page-pdf{gap:6px;margin:6px 0}#duzenleList input.nm{width:100%;text-align:left;min-width:180px}#asFab,#asPanel{display:none!important}#ozetKisa table{width:100%!important;max-width:none!important;min-width:0!important}";
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
  doc.rect(0,0,W,11,"F");
  doc.setFont(font,"bold"); doc.setFontSize(11); doc.setTextColor(255,255,255);
  doc.text("CADDE  \u00b7  AYLIK RAPOR",10,7.5);
  doc.setFont(font,"normal"); doc.setFontSize(8);
  doc.text(now,W-10,7.5,{align:"right"});
  doc.setTextColor(31,75,143); doc.setFontSize(8);
  doc.text(s.pay.length+" odeme / "+s.all.length+" kisi    TOPLAM  "+tl(s.toplam)+" TL",10,16);
  var kalem=[
    ["Mesai",tl(s.mesai)],["HS",tl(s.hs)],["Prim",tl(s.prim)],
    ["Yol",tl(s.yol)],["Izin",tl(s.izin)],["Yillik",tl(s.yillik)]
  ];
  doc.autoTable({
    startY:18,
    head:[["Kalem","Tutar","Kalem","Tutar","Kalem","Tutar"]],
    body:[[kalem[0][0],kalem[0][1],kalem[1][0],kalem[1][1],kalem[2][0],kalem[2][1]],[kalem[3][0],kalem[3][1],kalem[4][0],kalem[4][1],kalem[5][0],kalem[5][1]]],
    theme:"grid",
    styles:{font:font,fontSize:7,cellPadding:0.6,halign:"center"},
    headStyles:{fillColor:[31,75,143],textColor:[255,255,255],fontSize:7},
    margin:{left:10,right:10},
    pageBreak:"avoid"
  });
  var y=(doc.lastAutoTable&&doc.lastAutoTable.finalY||24)+3;
  doc.autoTable({
    startY:y,
    head:[["No","Ad Soyad","Mesai","HS","Prim","Yol","Izin","Yillik","Diger","Odenecek"]],
    body:s.all.map(function(x,i){
      return [String(i+1),x.p.name+(x.p.kurye?" K":""),dash(x.c.mesai),dash(x.c.hs),dash(x.c.prim),dash(x.c.yol),dash(x.c.izin),dash(x.c.yillik),dash((x.c.dis||0)),dash(x.c.toplam)];
    }),
    foot:[["","TOPLAM",tl(s.mesai),tl(s.hs),tl(s.prim),tl(s.yol),tl(s.izin),tl(s.yillik),tl(s.dis||0),tl(s.toplam)]],
    theme:"grid",
    styles:{font:font,fontSize:6.2,cellPadding:0.42,halign:"center",overflow:"ellipsize",minCellHeight:3.8},
    headStyles:{fillColor:[31,75,143],textColor:[255,255,255],fontSize:6.4,cellPadding:0.5},
    footStyles:{fillColor:[34,34,34],textColor:[255,255,255],fontSize:6.2},
    columnStyles:{0:{cellWidth:8},1:{halign:"left",cellWidth:48},9:{fillColor:[243,232,210]}},
    margin:{left:10,right:10,top:8,bottom:8},
    pageBreak:"auto",
    rowPageBreak:"avoid"
  });
  var cezalar=[];
  try{ cezalar=(typeof state!=="undefined"&&state.cezalar)?state.cezalar:[]; }catch(e){}
  if(cezalar.length){
    var y2=(doc.lastAutoTable&&doc.lastAutoTable.finalY||40)+3;
    if(y2>H-28){ doc.addPage(); y2=12; }
    var ctot=0;
    doc.autoTable({
      startY:y2,
      head:[["No","Ceza - Ad Soyad","Tutar","Neden"]],
      body:cezalar.map(function(c,i){ ctot+=Number(c.tutar)||0; return [String(i+1),c.kisi||"",tl(c.tutar)+" TL",c.neden||"-"]; }),
      foot:[["","TOPLAM",tl(ctot)+" TL",""]],
      theme:"grid",
      styles:{font:font,fontSize:6.2,cellPadding:0.45,overflow:"ellipsize"},
      headStyles:{fillColor:[153,27,27],textColor:[255,255,255],fontSize:6.4},
      footStyles:{fillColor:[34,34,34],textColor:[255,255,255]},
      columnStyles:{1:{halign:"left"},3:{halign:"left"}},
      margin:{left:10,right:10,bottom:8},
      pageBreak:"auto"
    });
  }
  trimPages(doc,2);
}
function drawKisaFull(doc,font,s,now){
  var W=doc.internal.pageSize.getWidth();
  doc.setFillColor(11,18,32);
  doc.rect(0,0,W,12,"F");
  doc.setFont(font,"bold"); doc.setFontSize(12); doc.setTextColor(255,255,255);
  doc.text("CADDE  \u00b7  KISA OZET",10,8);
  doc.setFont(font,"normal"); doc.setFontSize(8);
  doc.text(now,W-10,8,{align:"right"});
  doc.setTextColor(31,75,143); doc.setFontSize(9);
  doc.text(s.pay.length+" odeme / "+s.all.length+" kisi   TOPLAM  "+tl(s.toplam)+" TL",10,18);
  doc.autoTable({
    startY:21,
    head:[["No","Ad Soyad","Odenecek"]],
    body:s.all.map(function(x,i){ return [String(i+1),x.p.name+(x.p.kurye?" K":""),dash(x.c.toplam)]; }),
    foot:[["","TOPLAM",tl(s.toplam)]],
    theme:"grid",
    styles:{font:font,fontSize:9,cellPadding:1.1,halign:"center",textColor:[20,20,20],lineColor:[210,210,210]},
    headStyles:{fillColor:[31,75,143],textColor:[255,255,255],fontSize:9},
    footStyles:{fillColor:[34,34,34],textColor:[255,255,255]},
    columnStyles:{0:{cellWidth:16},1:{halign:"left"},2:{cellWidth:36,fillColor:[243,232,210]}},
    margin:{left:10,right:10,top:16,bottom:12},
    pageBreak:"auto",
    rowPageBreak:"avoid",
    showHead:"everyPage"
  });
}
window.pagePdf=async function(kind,share){
  toast("PDF hazirlaniyor...");
  if(!window.jspdf||!window.jspdf.jsPDF){toast("PDF yok");return;}
  var jsPDF=window.jspdf.jsPDF;
  var s=_sums();
  var now=new Date().toLocaleString("tr-TR",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"});
  var land=kind==="liste"||kind==="ozet-ayrinti"||kind==="rapor";
  var doc=new jsPDF({orientation:land?"landscape":"portrait",unit:"mm",format:"a4"});
  var hasFont=await ensurePdfFont(doc);
  var font=hasFont?"DejaVu":"helvetica";
  var W=doc.internal.pageSize.getWidth(), H=doc.internal.pageSize.getHeight();
  if(kind==="ozet-kisa"){
    drawKisaFull(doc,font,s,now);
    if(share && typeof outPdf==="function") await outPdf(doc,"cadde-ozet-kisa.pdf");
    else { doc.save("cadde-ozet-kisa.pdf"); toast("PDF indirildi"); }
    return;
  }
  if(kind==="rapor"){
    drawRaporMax2(doc,font,s,now);
    if(share && typeof outPdf==="function") await outPdf(doc,"cadde-aylik-rapor.pdf");
    else { doc.save("cadde-aylik-rapor.pdf"); toast("PDF indirildi (en fazla 2 sayfa)"); }
    return;
  }
  if(typeof pdfDrawChrome==="function") pdfDrawChrome(doc,font,W,H,now,s.pay.length,s.all.length);
  var title="CADDE", head, body, foot=null, col={1:{halign:"left"}};
  if(kind==="liste"||kind==="ozet-ayrinti"){
    title=kind==="liste"?"MESAI LISTESI":"AYRINTILI OZET";
    head=[["No","Ad Soyad","Mesai saat","Mesai","HS adet","HS","Prim","Yol","Izin g","Izin","Yillik","Odenecek"]];
    body=s.all.map(function(x,i){return [String(i+1),x.p.name+(x.p.kurye?" (K)":""),String(x.p.mesaiSaat||"-"),dash(x.c.mesai),String(x.p.hsSaat||"-"),dash(x.c.hs),dash(x.c.prim),dash(x.c.yol),String(x.p.izinGun||"-"),dash(x.c.izin),dash(x.c.yillik),dash(x.c.toplam)];});
    foot=[["","TOPLAM","",tl(s.mesai),"",tl(s.hs),tl(s.prim),tl(s.yol),"",tl(s.izin),tl(s.yillik),tl(s.toplam)]];
    col={0:{cellWidth:8},1:{halign:"left",cellWidth:50},11:{fillColor:[243,232,210]}};
  }else if(kind==="kurye"){
    title="KURYE PRIMLERI";
    var list=(typeof state!=="undefined"?state.people:[]).filter(function(p){return p.kurye;});
    head=[["No","Ad Soyad","Adet","Tutar"]];
    body=list.map(function(p,i){return [String(i+1),p.name,String(p.primAdet||0),tl((p.primAdet||0)*(typeof PRIM_BIRIM!=="undefined"?PRIM_BIRIM:7))];});
    var sm=list.reduce(function(a,p){return a+(p.primAdet||0);},0);
    foot=[["","TOPLAM",String(sm),tl(sm*(typeof PRIM_BIRIM!=="undefined"?PRIM_BIRIM:7))]];
  }else if(kind==="devam"){
    title="DEVAMSIZLIK";
    head=[["No","Ad Soyad","Gun","Not"]];
    body=((typeof state!=="undefined"?state.devamsizlik:[])||[]).map(function(d,i){return [String(i+1),d.kisi,String(d.gun),d.not||"-"];});
    col={1:{halign:"left"},3:{halign:"left"}};
  }else if(kind==="ceza"){
    title="CEZALAR";
    head=[["No","Ad Soyad","Tutar","Neden"]];
    body=((typeof state!=="undefined"?state.cezalar:[])||[]).map(function(c,i){return [String(i+1),c.kisi,tl(c.tutar)+" TL",c.neden||"-"];});
  }
  doc.setFont(font,"normal"); doc.setFontSize(10); doc.setTextColor(31,75,143); doc.text(title,10,20);
  var opt={startY:24,head:head,body:body,theme:"grid",styles:{font:font,fontSize:6.2,cellPadding:0.55,halign:"center",textColor:[31,41,51],lineColor:[232,223,210],overflow:"linebreak"},headStyles:{fillColor:[31,75,143],textColor:[255,255,255]},footStyles:{fillColor:[34,34,34],textColor:[255,255,255]},columnStyles:col,margin:{left:10,right:10,top:16,bottom:10}};
  if(foot) opt.foot=foot;
  doc.autoTable(opt);
  if(share && typeof outPdf==="function") await outPdf(doc,"cadde-"+kind+".pdf");
  else { doc.save("cadde-"+kind+".pdf"); toast("PDF indirildi"); }
};
function renderDuzenle(){
  var box=document.getElementById("duzenleList");
  if(!box)return;
  var rows=(typeof state!=="undefined"&&state.people)?state.people:[];
  box.innerHTML='<div class="table-wrap" style="max-height:70vh;padding:0"><table class="sheet slim"><thead><tr><th>No</th><th>Ad Soyad</th><th>Kurye</th><th>Birim</th><th>Tasi</th><th></th></tr></thead><tbody>'+
    rows.map(function(p,i){
      return '<tr data-id="'+p.id+'"><td>'+(i+1)+'</td><td class="name"><input class="nm"></td><td><input type="checkbox" class="ky"'+(p.kurye?" checked":"")+'></td><td><input type="number" class="br" value="'+(p.mesaiBirim||300)+'"></td><td><button class="btn up" type="button">Yukari</button> <button class="btn down" type="button">Asagi</button></td><td><button class="btn del" type="button">Sil</button></td></tr>';
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
  };
  box.onclick=function(ev){
    var tr=ev.target.closest("tr[data-id]"); if(!tr)return;
    var id=+tr.getAttribute("data-id");
    if(ev.target.classList.contains("up")) window.moveKisi(id,-1);
    if(ev.target.classList.contains("down")) window.moveKisi(id,1);
    if(ev.target.classList.contains("del")){ if(typeof silKisi==="function") silKisi(id); renderDuzenle(); }
  };
}
window.renderDuzenle=renderDuzenle;
window.moveKisi=function(id,dir){
  var i=state.people.findIndex(function(x){return x.id===id;});
  var j=i+dir;
  if(i<0||j<0||j>=state.people.length)return;
  var t=state.people[i]; state.people[i]=state.people[j]; state.people[j]=t;
  persist(); renderDuzenle(); renderAll();
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
