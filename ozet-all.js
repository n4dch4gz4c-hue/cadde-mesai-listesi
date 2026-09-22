(function(){
function money(n){ n=Math.round(Number(n)||0); return n===0?"0":(typeof tl==="function"?tl(n):String(n)); }
function dsh(n){ n=Math.round(Number(n)||0); return n===0?"-":money(n); }
function rowCalc(p){
  if(typeof calc==="function") return calc(p);
  var mesai=Number(p.mesaiSaat||0)*Number(p.mesaiBirim||300);
  var hs=Number(p.hsSaat||0)*2500;
  var prim=p.kurye?Number(p.primAdet||0)*7:0;
  var yol=Number(p.yolTutar||0)||Number(p.yolGun||0)*Number(p.yolBirim||1200);
  var izin=Number(p.izinTutar||0);
  var yillik=Number(p.yillikTutar||0);
  return {mesai:mesai,hs:hs,prim:prim,yol:yol,izin:izin,yillik:yillik,toplam:mesai+hs+prim+yol+izin+yillik};
}
function fromMem(){
  if(typeof window.state==="object" && window.state && Array.isArray(window.state.people) && window.state.people.length) return window.state.people;
  try{
    var raw=localStorage.getItem("cadde_bordro_v4");
    if(raw){ var s=JSON.parse(raw); if(s&&s.people&&s.people.length) return s.people; }
  }catch(e){}
  return [];
}
function drawKisa(list){
  var kisa=document.getElementById("ozetKisa");
  if(!kisa) return;
  var html="", i, p, c, tot=0, pay=0;
  html="<div class='row'><h2 style='margin:0;font-size:18px'>Kisa ozet</h2></div>";
  html+="<p style='margin:6px 0' id='ozetKisaMeta'></p>";
  html+="<div style='overflow:auto;max-width:420px'><table class='sheet slim' style='min-width:0;width:100%;max-width:420px'>";
  html+="<thead><tr><th style='width:44px'>No</th><th>Ad Soyad</th><th style='width:90px'>Odenecek</th></tr></thead><tbody>";
  for(i=0;i<list.length;i++){
    p=list[i]; c=rowCalc(p); tot+=c.toplam||0; if((c.toplam||0)>0) pay++;
    html+="<tr class='"+(c.toplam>0?"pay":"")+"'><td>"+(i+1)+"</td><td class='name'>"+(p.name||"")+"</td><td class='tot'>"+money(c.toplam)+"</td></tr>";
  }
  html+="</tbody><tfoot><tr><td></td><td>TOPLAM</td><td>"+money(tot)+"</td></tr></tfoot></table></div>";
  kisa.innerHTML=html;
  var meta=document.getElementById("ozetKisaMeta");
  if(meta) meta.innerHTML=list.length+" kisi / "+pay+" odeme \u00b7 <b>"+money(tot)+" TL</b>";
}
function drawAyr(list){
  var ayr=document.getElementById("ozetAyrinti");
  if(!ayr) return;
  var i,p,c, tot=0, mesai=0, hs=0, prim=0, yol=0, izin=0, yillik=0, pay=0, html="";
  html="<div class='row' style='justify-content:space-between;align-items:center'><h2 style='margin:0'>Ayrintili ozet</h2></div>";
  html+="<p id='ozetAyrMeta'></p>";
  html+="<div style='overflow:auto;max-height:70vh'><table class='sheet slim'><thead><tr>";
  html+="<th>No</th><th>Ad Soyad</th><th>Mesai saat</th><th>Mesai</th><th>HS adet</th><th>HS</th><th>Prim</th><th>Yol</th><th>Izin g</th><th>Izin</th><th>Yillik</th><th>Toplam</th>";
  html+="</tr></thead><tbody>";
  for(i=0;i<list.length;i++){
    p=list[i]; c=rowCalc(p);
    tot+=c.toplam||0; mesai+=c.mesai||0; hs+=c.hs||0; prim+=c.prim||0; yol+=c.yol||0; izin+=c.izin||0; yillik+=c.yillik||0;
    if((c.toplam||0)>0) pay++;
    html+="<tr class='"+(c.toplam>0?"pay":"")+"'><td>"+(i+1)+"</td><td class='name'>"+(p.name||"")+(p.kurye?" <small>K</small>":"")+"</td>";
    html+="<td>"+(p.mesaiSaat||"-")+"</td><td>"+dsh(c.mesai)+"</td>";
    html+="<td>"+(p.hsSaat||"-")+"</td><td>"+dsh(c.hs)+"</td>";
    html+="<td>"+dsh(c.prim)+"</td><td>"+dsh(c.yol)+"</td>";
    html+="<td>"+(p.izinGun||"-")+"</td><td>"+dsh(c.izin)+"</td>";
    html+="<td>"+dsh(c.yillik)+"</td><td class='tot'>"+dsh(c.toplam)+"</td></tr>";
  }
  html+="</tbody><tfoot><tr><td></td><td>TOPLAM</td><td></td><td>"+money(mesai)+"</td><td></td><td>"+money(hs)+"</td><td>"+money(prim)+"</td><td>"+money(yol)+"</td><td></td><td>"+money(izin)+"</td><td>"+money(yillik)+"</td><td>"+money(tot)+"</td></tr></tfoot></table></div>";
  ayr.innerHTML=html;
  var meta=document.getElementById("ozetAyrMeta");
  if(meta) meta.innerHTML=list.length+" kisi / "+pay+" odeme \u00b7 <b>"+money(tot)+" TL</b>";
}
function paint(list){
  list=list||[];
  drawKisa(list);
  drawAyr(list);
}
function loadAndPaint(){
  var list=fromMem();
  if(list.length){ paint(list); return; }
  fetch("cadde-data.json?t="+Date.now(),{cache:"no-store"}).then(function(r){return r.json();}).then(function(s){
    if(s&&s.people) paint(s.people);
  }).catch(function(){});
}
window.renderOzet=function(){ loadAndPaint(); };
var prevMod=window.ozetMod;
window.ozetMod=function(m){
  if(typeof prevMod==="function") prevMod(m);
  var k=document.getElementById("ozetKisa");
  var a=document.getElementById("ozetAyrinti");
  if(k) k.classList.toggle("hide", m!=="kisa");
  if(a) a.classList.toggle("hide", m!=="ayrinti");
  document.querySelectorAll("[data-ozet]").forEach(function(b){ b.classList.toggle("on", b.dataset.ozet===m); });
  loadAndPaint();
};
document.addEventListener("click",function(ev){
  var t=ev.target&&ev.target.closest&&ev.target.closest("[data-tab='ozet'],[data-ozet]");
  if(t) setTimeout(loadAndPaint,40);
});
setTimeout(loadAndPaint,900);
setTimeout(loadAndPaint,2500);
})();
