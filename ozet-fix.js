function renderOzet(){
  const all=state.people.map(p=>({p,c:calc(p)})).filter(x=>ozetMode==="kisa"?x.c.toplam>0:true);
  const sum=all.reduce((a,x)=>a+x.c.toplam,0);
  const devam=state.devamsizlik||[];
  const ceza=state.cezalar||[];
  const gunToplam=devam.reduce((a,d)=>a+(parseFloat(d.gun)||0),0);
  const cezaToplam=ceza.reduce((a,c)=>a+(parseFloat(c.tutar)||0),0);
  const ts="width:100%;border-collapse:collapse;background:#fff;color:#111";
  const ths="border:1px solid #222;padding:6px 8px;text-align:left;font-weight:700;background:#fff";
  const tds="border:1px solid #222;padding:6px 8px;background:#fff";
  let html=`<b>Ozet</b><div class="tiny">${all.length} kisi · ${tl(sum)}</div>`;
  html+=`<table style="${ts}"><tr><th style="${ths}">Ad</th><th style="${ths}">Mesai</th><th style="${ths}">HS</th><th style="${ths}">Toplam</th></tr>`;
  html+=all.map(x=>`<tr><td style="${tds}">${x.p.name}</td><td style="${tds}">${tl(x.c.mesai)}</td><td style="${tds}">${tl(x.c.hs)}</td><td style="${tds}">${tl(x.c.toplam)}</td></tr>`).join("");
  html+=`</table>`;
  html+=`<div style="margin-top:16px"><b>Devamsizlik</b><div class="tiny">${devam.length} kayit · ${gunToplam} gun</div>`;
  if(!devam.length) html+=`<div class="tiny">Kayit yok</div>`;
  else {
    html+=`<table style="${ts}"><tr><th style="${ths}">Ad</th><th style="${ths}">Gun</th><th style="${ths}">Not</th></tr>`;
    html+=devam.map(d=>`<tr><td style="${tds}">${d.kisi}</td><td style="${tds}">${d.gun}</td><td style="${tds}">${d.not||""}</td></tr>`).join("");
    html+=`</table>`;
  }
  html+=`</div><div style="margin-top:16px"><b>Cezalar</b><div class="tiny">${ceza.length} kayit · ${tl(cezaToplam)}</div>`;
  if(!ceza.length) html+=`<div class="tiny">Kayit yok</div>`;
  else {
    html+=`<table style="${ts}"><tr><th style="${ths}">Ad</th><th style="${ths}">Tutar</th><th style="${ths}">Neden</th></tr>`;
    html+=ceza.map(c=>`<tr><td style="${tds}">${c.kisi}</td><td style="${tds}">${tl(c.tutar)}</td><td style="${tds}">${c.neden||""}</td></tr>`).join("");
    html+=`</table>`;
  }
  html+=`</div>`;
  document.getElementById("ozetBox").innerHTML=html;
}
function trPdf(s){return String(s||"").replace(/Ç/g,"C").replace(/ç/g,"c").replace(/Ğ/g,"G").replace(/ğ/g,"g").replace(/İ/g,"I").replace(/ı/g,"i").replace(/Ö/g,"O").replace(/ö/g,"o").replace(/Ş/g,"S").replace(/ş/g,"s").replace(/Ü/g,"U").replace(/ü/g,"u").replace(/–/g,"-");}
async function sharePDF(){
  if(!window.jspdf||!window.jspdf.jsPDF){toast("PDF yok");return;}
  const doc=new window.jspdf.jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  const W=210;
  doc.setFillColor(43,110,246);
  doc.rect(0,0,W,16,"F");
  doc.setTextColor(255,255,255);
  doc.setFontSize(13);
  doc.text("Cadde Mesai Listesi",10,10);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString("tr-TR"),W-12,10,{align:"right"});
  const rows=state.people.map(function(p,i){return {i:i+1,p:p,c:calc(p)};}).filter(function(x){return ozetMode!=="kisa"||x.c.toplam>0;});
  const sum=rows.reduce(function(a,x){return a+x.c.toplam;},0);
  doc.setTextColor(17,17,17);
  doc.setFontSize(9);
  doc.text(trPdf(rows.length+" kisi  |  Genel toplam "+Math.round(sum)+" TL"),10,22);
  const cols=[10,18,88,118,148];
  let y=28;
  function head(){
    doc.setFillColor(43,110,246);
    doc.rect(10,y-4,190,7,"F");
    doc.setTextColor(255,255,255);
    doc.setFontSize(8);
    doc.text("No",cols[0],y);
    doc.text("Ad Soyad",cols[1],y);
    doc.text("Mesai",cols[2],y);
    doc.text("HS",cols[3],y);
    doc.text("Toplam",cols[4],y);
    y+=6;
    doc.setTextColor(17,17,17);
  }
  head();
  rows.forEach(function(x){
    if(y>280){doc.addPage();y=16;head();}
    doc.setDrawColor(180,180,180);
    doc.setLineWidth(0.2);
    doc.line(10,y+2,200,y+2);
    doc.setFontSize(8);
    doc.text(String(x.i),cols[0],y);
    doc.text(trPdf(x.p.name).slice(0,32),cols[1],y);
    doc.text(x.c.mesai?String(Math.round(x.c.mesai)):"-",cols[2],y);
    doc.text(x.c.hs?String(Math.round(x.c.hs)):"-",cols[3],y);
    doc.text(String(Math.round(x.c.toplam)),cols[4],y);
    y+=6;
  });
  y+=6;
  doc.setFillColor(43,110,246);
  doc.rect(10,y-4,190,7,"F");
  doc.setTextColor(255,255,255);
  doc.setFontSize(8);
  doc.text("GENEL TOPLAM",cols[1],y);
  doc.text(String(Math.round(sum))+" TL",cols[4],y);
  y+=12;
  const devam=state.devamsizlik||[];
  if(devam.length){
    if(y>260){doc.addPage();y=16;}
    doc.setFillColor(43,110,246);
    doc.rect(10,y-4,190,7,"F");
    doc.setTextColor(255,255,255);
    doc.text("DEVAMSIZLIK",12,y);
    y+=8;
    doc.setTextColor(17,17,17);
    devam.forEach(function(d){
      if(y>280){doc.addPage();y=16;}
      doc.setFontSize(8);
      doc.text(trPdf((d.kisi||"")+"  -  "+(d.gun||"")+" gun  -  "+(d.not||"")),12,y);
      y+=6;
    });
  }
  doc.save("cadde-ozet.pdf");
}
