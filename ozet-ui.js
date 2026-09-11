function renderOzet(){
  var all=state.people.map(function(p){return {p:p,c:calc(p)};}).filter(function(x){return ozetMode==="kisa"?x.c.toplam>0:true;});
  var sum=all.reduce(function(a,x){return a+x.c.toplam;},0);
  var devam=state.devamsizlik||[];
  var ceza=state.cezalar||[];
  var ts="width:100%;border-collapse:collapse;background:#fff;color:#111;font-size:13px";
  var ths="border:1px solid #222;padding:6px 8px;text-align:left;background:#fff;font-weight:700";
  var tds="border:1px solid #222;padding:6px 8px;background:#fff";
  var html="<b>Ozet</b><div class=\"tiny\">"+all.length+" kisi \u00b7 "+tl(sum)+"</div>";
  html+="<table style=\""+ts+"\"><thead><tr><th style=\""+ths+"\">Ad</th><th style=\""+ths+"\">Mesai</th><th style=\""+ths+"\">HS</th><th style=\""+ths+"\">Toplam</th></tr></thead><tbody>";
  all.forEach(function(x){html+="<tr><td style=\""+tds+"\">"+x.p.name+"</td><td style=\""+tds+"\">"+tl(x.c.mesai)+"</td><td style=\""+tds+"\">"+tl(x.c.hs)+"</td><td style=\""+tds+"\">"+tl(x.c.toplam)+"</td></tr>";});
  html+="</tbody></table>";
  html+="<div style=\"margin-top:16px\"><b>Devamsizlik</b><div class=\"tiny\">"+devam.length+" kayit</div>";
  if(!devam.length) html+="<div class=\"tiny\">Kayit yok</div>";
  else {
    html+="<table style=\""+ts+"\"><tr><th style=\""+ths+"\">Ad</th><th style=\""+ths+"\">Gun</th><th style=\""+ths+"\">Not</th></tr>";
    devam.forEach(function(d){html+="<tr><td style=\""+tds+"\">"+d.kisi+"</td><td style=\""+tds+"\">"+d.gun+"</td><td style=\""+tds+"\">"+(d.not||"")+"</td></tr>";});
    html+="</table>";
  }
  html+="</div>";
  var box=document.getElementById("ozetBox");
  if(box)box.innerHTML=html;
}
function trPdf(s){return String(s||"").replace(/\u00c7/g,"C").replace(/\u00e7/g,"c").replace(/\u011e/g,"G").replace(/\u011f/g,"g").replace(/\u0130/g,"I").replace(/\u0131/g,"i").replace(/\u00d6/g,"O").replace(/\u00f6/g,"o").replace(/\u015e/g,"S").replace(/\u015f/g,"s").replace(/\u00dc/g,"U").replace(/\u00fc/g,"u");}
async function sharePDF(){
  if(!window.jspdf||!window.jspdf.jsPDF){toast("PDF yok");return;}
  var doc=new window.jspdf.jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  doc.setFillColor(43,110,246);doc.rect(0,0,210,16,"F");
  doc.setTextColor(255,255,255);doc.setFontSize(13);doc.text("Cadde Mesai Listesi",10,10);
  var rows=state.people.map(function(p,i){return {i:i+1,p:p,c:calc(p)};});
  var sum=rows.reduce(function(a,x){return a+x.c.toplam;},0);
  doc.setTextColor(17,17,17);doc.setFontSize(9);doc.text(trPdf(rows.length+" kisi | "+Math.round(sum)+" TL"),10,22);
  var y=28,cols=[10,18,88,118,148];
  function head(){doc.setFillColor(43,110,246);doc.rect(10,y-4,190,7,"F");doc.setTextColor(255,255,255);doc.setFontSize(8);doc.text("No",cols[0],y);doc.text("Ad Soyad",cols[1],y);doc.text("Mesai",cols[2],y);doc.text("HS",cols[3],y);doc.text("Toplam",cols[4],y);y+=6;doc.setTextColor(17,17,17);}
  head();
  rows.forEach(function(x){
    if(y>280){doc.addPage();y=16;head();}
    doc.setDrawColor(200,200,200);doc.setLineWidth(0.2);doc.line(10,y+2,200,y+2);
    doc.setFontSize(8);
    doc.text(String(x.i),cols[0],y);
    doc.text(trPdf(x.p.name).slice(0,32),cols[1],y);
    doc.text(x.c.mesai?String(Math.round(x.c.mesai)):"-",cols[2],y);
    doc.text(x.c.hs?String(Math.round(x.c.hs)):"-",cols[3],y);
    doc.text(String(Math.round(x.c.toplam)),cols[4],y);
    y+=6;
  });
  y+=8;doc.setFillColor(43,110,246);doc.rect(10,y-4,190,7,"F");doc.setTextColor(255);doc.text("GENEL TOPLAM",cols[1],y);doc.text(String(Math.round(sum))+" TL",cols[4],y);
  var devam=state.devamsizlik||[];
  if(devam.length){
    y+=12;if(y>260){doc.addPage();y=16;}doc.setFillColor(43,110,246);doc.rect(10,y-4,190,7,"F");doc.setTextColor(255);doc.text("DEVAMSIZLIK",12,y);y+=8;doc.setTextColor(17);
    devam.forEach(function(d){if(y>280){doc.addPage();y=16;}doc.setFontSize(8);doc.text(trPdf((d.kisi||"")+" - "+(d.gun||"")+" gun - "+(d.not||"")),12,y);y+=6;});
  }
  doc.save("cadde-ozet.pdf");
}
