function renderOzet(){
  var kisa=ozetMode==="kisa";
  var all=state.people.map(function(p){return {p:p,c:calc(p)};}).filter(function(x){return kisa?x.c.toplam>0:true;});
  var sum=all.reduce(function(a,x){return a+x.c.toplam;},0);
  var ts="width:100%;border-collapse:collapse;color:#111;font-size:13px";
  var ths="border:1px solid #9ab0d0;padding:7px 8px;text-align:left;background:#2b6ef6;color:#fff;font-weight:700";
  function td(i){return "border:1px solid #c9d7ee;padding:7px 8px;background:"+(i%2?"#e8f0ff":"#fff");}
  var html="<b>"+(kisa?"Kisa ozet":"Ayrintili ozet")+"</b><div class=\"tiny\">"+all.length+" kisi \u00b7 "+tl(sum)+"</div>";
  html+="<table style=\""+ts+"\"><thead><tr>";
  if(kisa) html+="<th style=\""+ths+"\">Ad</th><th style=\""+ths+"\">Toplam</th>";
  else html+="<th style=\""+ths+"\">Ad</th><th style=\""+ths+"\">Mesai</th><th style=\""+ths+"\">HS</th><th style=\""+ths+"\">Toplam</th>";
  html+="</tr></thead><tbody>";
  all.forEach(function(x,i){
    html+="<tr><td style=\""+td(i)+"\">"+x.p.name+"</td>";
    if(!kisa) html+="<td style=\""+td(i)+"\">"+tl(x.c.mesai)+"</td><td style=\""+td(i)+"\">"+tl(x.c.hs)+"</td>";
    html+="<td style=\""+td(i)+"\">"+tl(x.c.toplam)+"</td></tr>";
  });
  html+="</tbody></table>";
  if(!kisa){
    var devam=state.devamsizlik||[];
    var ceza=state.cezalar||[];
    html+="<div style=\"margin-top:16px\"><b>Devamsizlik</b></div>";
    if(!devam.length) html+="<div class=\"tiny\">Kayit yok</div>";
    else {
      html+="<table style=\""+ts+"\"><tr><th style=\""+ths+"\">Ad</th><th style=\""+ths+"\">Gun</th><th style=\""+ths+"\">Not</th></tr>";
      devam.forEach(function(d,i){html+="<tr><td style=\""+td(i)+"\">"+d.kisi+"</td><td style=\""+td(i)+"\">"+d.gun+"</td><td style=\""+td(i)+"\">"+(d.not||"")+"</td></tr>";});
      html+="</table>";
    }
    html+="<div style=\"margin-top:16px\"><b>Cezalar</b></div>";
    if(!ceza.length) html+="<div class=\"tiny\">Kayit yok</div>";
    else {
      html+="<table style=\""+ts+"\"><tr><th style=\""+ths+"\">Ad</th><th style=\""+ths+"\">Tutar</th><th style=\""+ths+"\">Neden</th></tr>";
      ceza.forEach(function(c,i){html+="<tr><td style=\""+td(i)+"\">"+c.kisi+"</td><td style=\""+td(i)+"\">"+tl(c.tutar)+"</td><td style=\""+td(i)+"\">"+(c.neden||"")+"</td></tr>";});
      html+="</table>";
    }
  }
  var box=document.getElementById("ozetBox");
  if(box)box.innerHTML=html;
}
function trPdf(s){return String(s||"").replace(/\u00c7/g,"C").replace(/\u00e7/g,"c").replace(/\u011e/g,"G").replace(/\u011f/g,"g").replace(/\u0130/g,"I").replace(/\u0131/g,"i").replace(/\u00d6/g,"O").replace(/\u00f6/g,"o").replace(/\u015e/g,"S").replace(/\u015f/g,"s").replace(/\u00dc/g,"U").replace(/\u00fc/g,"u");}
async function sharePDF(){
  if(!window.jspdf||!window.jspdf.jsPDF){toast("PDF yok");return;}
  var kisa=ozetMode==="kisa";
  var doc=new window.jspdf.jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  doc.setFillColor(43,110,246);doc.rect(0,0,210,16,"F");
  doc.setTextColor(255,255,255);doc.setFontSize(13);doc.text(kisa?"Cadde Mesai - Kisa Ozet":"Cadde Mesai Listesi",10,10);
  var rows=state.people.map(function(p,i){return {i:i+1,p:p,c:calc(p)};}).filter(function(x){return kisa?x.c.toplam>0:true;});
  var sum=rows.reduce(function(a,x){return a+x.c.toplam;},0);
  doc.setTextColor(17,17,17);doc.setFontSize(9);doc.text(trPdf(rows.length+" kisi | "+Math.round(sum)+" TL"),10,22);
  var y=28;
  function head(){
    doc.setFillColor(43,110,246);doc.rect(10,y-4,190,7,"F");doc.setTextColor(255,255,255);doc.setFontSize(8);
    if(kisa){doc.text("Ad Soyad",12,y);doc.text("Toplam",160,y);}
    else {doc.text("Ad Soyad",12,y);doc.text("Mesai",120,y);doc.text("HS",150,y);doc.text("Toplam",175,y);}
    y+=6;doc.setTextColor(17,17,17);
  }
  head();
  rows.forEach(function(x,i){
    if(y>280){doc.addPage();y=16;head();}
    if(i%2){doc.setFillColor(232,240,255);doc.rect(10,y-3.5,190,6,"F");}
    else {doc.setFillColor(255,255,255);doc.rect(10,y-3.5,190,6,"F");}
    doc.setFontSize(8);
    doc.text(trPdf(x.p.name).slice(0,34),12,y);
    if(kisa) doc.text(String(Math.round(x.c.toplam))+" TL",160,y);
    else {doc.text(x.c.mesai?String(Math.round(x.c.mesai)):"-",120,y);doc.text(x.c.hs?String(Math.round(x.c.hs)):"-",150,y);doc.text(String(Math.round(x.c.toplam)),175,y);}
    y+=6;
  });
  y+=8;doc.setFillColor(43,110,246);doc.rect(10,y-4,190,7,"F");doc.setTextColor(255,255,255);doc.setFontSize(8);doc.text("GENEL TOPLAM",12,y);doc.text(String(Math.round(sum))+" TL",kisa?160:175,y);
  if(!kisa){
    var devam=state.devamsizlik||[];
    if(devam.length){
      y+=12;if(y>260){doc.addPage();y=16;}doc.setFillColor(43,110,246);doc.rect(10,y-4,190,7,"F");doc.setTextColor(255);doc.text("DEVAMSIZLIK",12,y);y+=8;doc.setTextColor(17,17,17);
      devam.forEach(function(d){if(y>280){doc.addPage();y=16;}doc.setFontSize(8);doc.text(trPdf((d.kisi||"")+" - "+(d.gun||"")+" gun - "+(d.not||"")),12,y);y+=6;});
    }
  }
  doc.save(kisa?"cadde-kisa-ozet.pdf":"cadde-ozet.pdf");
}
