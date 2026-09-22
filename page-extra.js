(function(){
function css(){
  if(document.getElementById("pagePdfCss"))return;
  var st=document.createElement("style");
  st.id="pagePdfCss";
  st.textContent=".page-pdf{gap:6px;margin:6px 0}.ozet-kisa{min-width:0!important;width:min(440px,100%)}.ozet-kisa td,.ozet-kisa th{padding:5px 8px;font-size:13px}#duzenleList input.nm{width:100%;text-align:left;min-width:180px}#asFab,#asPanel{display:none!important}";
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
function _sums(){return typeof sums==="function"?sums():{all:[],pay:[],mesai:0,hs:0,prim:0,yol:0,izin:0,yillik:0,toplam:0};}
renderOzet=function(){
  var s=_sums();
  var kisa=document.getElementById("ozetKisa");
  var ayr=document.getElementById("ozetAyrinti");
  if(!kisa||!ayr)return;
  kisa.innerHTML='<div class="row" style="justify-content:space-between;align-items:center"><h2 style="margin:0;font-size:18px">Kisa ozet</h2>'+bar("ozet-kisa")+'</div><p style="margin:4px 0 8px;font-size:13px">'+s.pay.length+" odeme / "+s.all.length+" kisi \u00b7 <b>"+tl(s.toplam)+" TL</b></p><table class=\"sheet slim ozet-kisa\"><thead><tr><th>No</th><th>Ad Soyad</th><th>Odenecek</th></tr></thead><tbody>"+s.all.map(function(x,i){return '<tr class="'+(x.c.toplam>0?"pay":"zero")+'"><td>'+(i+1)+'</td><td class="name">'+x.p.name+'</td><td class="tot">'+dash(x.c.toplam)+"</td></tr>";}).join("")+"</tbody><tfoot><tr><td></td><td>TOPLAM</td><td>"+tl(s.toplam)+"</td></tr></tfoot></table>";
  ayr.innerHTML='<div class="row" style="justify-content:space-between;align-items:center"><h2 style="margin:0">Ayrintili ozet</h2>'+bar("ozet-ayrinti")+'</div><p>'+s.all.length+" kisi \u00b7 "+s.pay.length+" odeme \u00b7 "+tl(s.toplam)+' TL</p><div class="table-wrap" style="max-height:62vh;padding:0"><table class="sheet slim"><thead><tr><th>No</th><th>Ad Soyad</th><th>Mesai saat</th><th>Mesai</th><th>HS adet</th><th>HS</th><th>Prim</th><th>Yol</th><th>Izin g</th><th>Izin</th><th>Yillik</th><th>Toplam</th></tr></thead><tbody>'+s.all.map(function(x,i){var p=x.p,c=x.c;return '<tr class="'+(c.toplam>0?"pay":"zero")+'"><td>'+(i+1)+'</td><td class="name">'+p.name+(p.kurye?" <small>K</small>":"")+"</td><td>"+(p.mesaiSaat||"-")+"</td><td>"+dash(c.mesai)+"</td><td>"+(p.hsSaat||"-")+"</td><td>"+dash(c.hs)+"</td><td>"+dash(c.prim)+"</td><td>"+dash(c.yol)+"</td><td>"+(p.izinGun||"-")+"</td><td>"+dash(c.izin)+"</td><td>"+dash(c.yillik)+'</td><td class="tot">'+dash(c.c.toplam)+"</td></tr>";}).join("")+"</tbody><tfoot><tr><td></td><td>TOPLAM</td><td></td><td>"+tl(s.mesai)+"</td><td></td><td>"+tl(s.hs)+"</td><td>"+tl(s.prim)+"</td><td>"+tl(s.yol)+"</td><td></td><td>"+tl(s.izin)+"</td><td>"+tl(s.yillik)+"</td><td>"+tl(s.toplam)+"</td></tr></tfoot></table></div>";
};
function drawKisaOnePage(doc,font,s,now){
  var W=doc.internal.pageSize.getWidth();
  var H=doc.internal.pageSize.getHeight();
  doc.setFillColor(11,18,32);
  doc.rect(0,0,W,12,"F");
  doc.setFont(font,"bold"); doc.setFontSize(11); doc.setTextColor(255,255,255);
  doc.text("CADDE  ·  KISA OZET",10,8);
  doc.setFont(font,"normal"); doc.setFontSize(8);
  doc.text(now,W-10,8,{align:"right"});
  doc.setTextColor(31,75,143); doc.setFontSize(9);
  doc.text(s.pay.length+" odeme / "+s.all.length+" kisi   TOPLAM  "+tl(s.toplam)+" TL",10,17);
  var mid=Math.ceil(s.all.length/2);
  var left=s.all.slice(0,mid);
  var right=s.all.slice(mid);
  var mk=function(arr,off){
    return arr.map(function(x,i){return [String(i+1+off),x.p.name,dash(x.c.toplam)];});
  };
  var base={
    theme:"grid",
    styles:{font:font,fontSize:7,cellPadding:0.55,halign:"center",textColor:[31,41,51],lineColor:[210,210,210],overflow:"ellipsize",minCellHeight:4.1},
    headStyles:{fillColor:[31,75,143],textColor:[255,255,255],fontSize:7,cellPadding:0.7},
    footStyles:{fillColor:[34,34,34],textColor:[255,255,255],fontSize:7},
    columnStyles:{0:{cellWidth:8},1:{halign:"left",cellWidth:52},2:{cellWidth:22,fillColor:[243,232,210]}},
    margin:{top:20,bottom:8},
    pageBreak:"avoid",
    rowPageBreak:"avoid"
  };
  doc.autoTable(Object.assign({},base,{
    startY:20,
    margin:{left:8,right:W/2+2,top:20,bottom:8},
    tableWidth:W/2-12,
    head:[["No","Ad Soyad","Odenecek"]],
    body:mk(left,0),
    foot:[["","TOPLAM",tl(s.toplam)]]
  }));
  doc.autoTable(Object.assign({},base,{
    startY:20,
    margin:{left:W/2+2,right:8,top:20,bottom:8},
    tableWidth:W/2-12,
    head:[["No","Ad Soyad","Odenecek"]],
    body:mk(right,mid),
    showFoot:"never"
  }));
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
    drawKisaOnePage(doc,font,s,now);
    if(share && typeof outPdf==="function") await outPdf(doc,"cadde-ozet-kisa.pdf");
    else { doc.save("cadde-ozet-kisa.pdf"); toast("PDF indirildi (1 sayfa)"); }
    return;
  }
  if(typeof pdfDrawChrome==="function") pdfDrawChrome(doc,font,W,H,now,s.pay.length,s.all.length);
  var title="CADDE", head, body, foot=null, col={1:{halign:"left"}};
  if(kind==="liste"||kind==="rapor"||kind==="ozet-ayrinti"){
    title=kind==="liste"?"MESAI LISTESI":(kind==="rapor"?"AYLIK RAPOR":"AYRINTILI OZET");
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
  var opt={startY:24,head:head,body:body,theme:"grid",styles:{font:font,fontSize:6.2,cellPadding:0.55,halign:"center",textColor:[31,41,51],lineColor:[232,223,210],overflow:"linebreak"},headStyles:{fillColor:[31,75,143],textColor:[255,255,255]},footStyles:{fillColor:[34,34,34],textColor:[255,255,255]},columnStyles:col,margin:{left:10,right:10,top:16,bottom:10},didDrawPage:function(){ if(typeof pdfDrawChrome==="function") pdfDrawChrome(doc,font,W,H,now,s.pay.length,s.all.length);}};
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
