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
  var dis=Number(p.disiplinDk||0);
  return {mesai:mesai,hs:hs,prim:prim,yol:yol,izin:izin,yillik:yillik,dis:dis,toplam:mesai+hs+prim+yol+izin+yillik+dis};
}
function bag(){
  try{ if(typeof state!=="undefined" && state && state.people && state.people.length) return state; }catch(e){}
  try{ if(window.state && window.state.people && window.state.people.length) return window.state; }catch(e){}
  try{
    var raw=localStorage.getItem("cadde_bordro_v4");
    if(raw){ var s=JSON.parse(raw); if(s&&s.people&&s.people.length) return s; }
  }catch(e){}
  return {people:[],cezalar:[],devamsizlik:[]};
}
function people(){ return bag().people||[]; }
function pdfBar(kind){
  return "<div class='row' style='gap:6px;margin:0'><button class='btn primary' type='button' onclick=\"pagePdf('"+kind+"',false)\">PDF indir</button><button class='btn' type='button' onclick=\"pagePdf('"+kind+"',true)\">Paylas</button></div>";
}
var MODE="kisa";
function htmlKisa(list){
  var i,p,c,tot=0,pay=0,h="";
  h="<div class='row' style='justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px'><h2 style='margin:0;font-size:18px'>Kisa ozet</h2>"+pdfBar("ozet-kisa")+"</div>";
  for(i=0;i<list.length;i++){ c=rowCalc(list[i]); tot+=c.toplam||0; if(c.toplam>0) pay++; }
  h+="<p style='margin:8px 0'>"+list.length+" kisi / "+pay+" odeme \u00b7 <b>"+money(tot)+" TL</b></p>";
  h+="<div style='overflow:auto;max-width:420px'><table class='sheet slim' style='min-width:0;width:100%;max-width:420px'>";
  h+="<thead><tr><th style='width:44px'>No</th><th>Ad Soyad</th><th style='width:90px'>Odenecek</th></tr></thead><tbody>";
  for(i=0;i<list.length;i++){
    p=list[i]; c=rowCalc(p);
    h+="<tr class='"+(c.toplam>0?"pay":"")+"'><td>"+(i+1)+"</td><td class='name'>"+(p.name||"")+"</td><td class='tot'>"+money(c.toplam)+"</td></tr>";
  }
  h+="</tbody><tfoot><tr><td></td><td>TOPLAM</td><td>"+money(tot)+"</td></tr></tfoot></table></div>";
  return h;
}
function htmlAyr(list){
  var i,p,c,tot=0,mesai=0,hs=0,prim=0,yol=0,izin=0,yillik=0,pay=0,h="";
  h="<div class='row' style='justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px'><h2 style='margin:0'>Ayrintili ozet</h2>"+pdfBar("ozet-ayrinti")+"</div>";
  for(i=0;i<list.length;i++){
    c=rowCalc(list[i]); tot+=c.toplam||0; mesai+=c.mesai||0; hs+=c.hs||0; prim+=c.prim||0; yol+=c.yol||0; izin+=c.izin||0; yillik+=c.yillik||0; if(c.toplam>0) pay++;
  }
  h+="<p style='margin:8px 0'>"+list.length+" kisi / "+pay+" odeme \u00b7 <b>"+money(tot)+" TL</b></p>";
  h+="<div style='overflow:auto;max-height:72vh;width:100%'><table class='sheet slim' style='min-width:960px;width:100%'>";
  h+="<thead><tr><th>No</th><th>Ad Soyad</th><th>Mesai saat</th><th>Mesai</th><th>HS adet</th><th>HS</th><th>Prim</th><th>Yol</th><th>Izin g</th><th>Izin</th><th>Yillik</th><th>Toplam</th></tr></thead><tbody>";
  for(i=0;i<list.length;i++){
    p=list[i]; c=rowCalc(p);
    h+="<tr class='"+(c.toplam>0?"pay":"")+"'><td>"+(i+1)+"</td><td class='name'>"+(p.name||"")+(p.kurye?" K":"")+"</td>";
    h+="<td>"+(p.mesaiSaat||"-")+"</td><td>"+dsh(c.mesai)+"</td>";
    h+="<td>"+(p.hsSaat||"-")+"</td><td>"+dsh(c.hs)+"</td>";
    h+="<td>"+dsh(c.prim)+"</td><td>"+dsh(c.yol)+"</td>";
    h+="<td>"+(p.izinGun||"-")+"</td><td>"+dsh(c.izin)+"</td>";
    h+="<td>"+dsh(c.yillik)+"</td><td class='tot'>"+dsh(c.toplam)+"</td></tr>";
  }
  h+="</tbody><tfoot><tr><td></td><td>TOPLAM</td><td></td><td>"+money(mesai)+"</td><td></td><td>"+money(hs)+"</td><td>"+money(prim)+"</td><td>"+money(yol)+"</td><td></td><td>"+money(izin)+"</td><td>"+money(yillik)+"</td><td>"+money(tot)+"</td></tr></tfoot></table></div>";
  return h;
}
function show(list){
  var box=document.getElementById("ozetKisa");
  var dead=document.getElementById("ozetAyrinti");
  if(dead){ dead.classList.add("hide"); dead.style.display="none"; dead.innerHTML=""; }
  if(!box) return;
  box.classList.remove("hide");
  box.style.display="block";
  box.innerHTML = MODE==="ayrinti" ? htmlAyr(list) : htmlKisa(list);
}
function paint(){
  var list=people();
  if(list&&list.length){ show(list); return; }
  fetch("cadde-data.json?t="+Date.now(),{cache:"no-store"}).then(function(r){return r.json();}).then(function(s){
    if(s&&s.people) show(s.people);
  }).catch(function(){});
}
window.renderOzet=function(){ paint(); };
window.ozetMod=function(m){
  MODE = (m==="ayrinti") ? "ayrinti" : "kisa";
  document.querySelectorAll("[data-ozet]").forEach(function(b){ b.classList.toggle("on", b.dataset.ozet===MODE); });
  paint();
};
document.addEventListener("click",function(ev){
  var t=ev.target&&ev.target.closest&&ev.target.closest("[data-ozet],[data-tab='ozet']");
  if(!t) return;
  if(t.dataset&&t.dataset.ozet) MODE=t.dataset.ozet==="ayrinti"?"ayrinti":"kisa";
  setTimeout(paint,20);
});
var prevRapor=window.renderRapor;
window.renderRapor=function(){
  if(typeof prevRapor==="function") prevRapor();
  var box=document.getElementById("raporBox");
  if(!box || box.querySelector("[data-ceza-rapor]")) return;
  var cezalar=bag().cezalar||[];
  var tot=0, i, html;
  html="<div class='panel' data-ceza-rapor='1'><h3>Cezalar</h3>";
  if(!cezalar.length) html+="<p class='muted'>Kayit yok</p></div>";
  else{
    html+="<table class='sheet slim'><thead><tr><th>No</th><th>Ad Soyad</th><th>Tutar</th><th>Neden</th></tr></thead><tbody>";
    for(i=0;i<cezalar.length;i++){
      tot+=Number(cezalar[i].tutar)||0;
      html+="<tr><td>"+(i+1)+"</td><td class='name'>"+(cezalar[i].kisi||"")+"</td><td>"+money(cezalar[i].tutar)+" TL</td><td class='name'>"+(cezalar[i].neden||"-")+"</td></tr>";
    }
    html+="</tbody><tfoot><tr><td></td><td>TOPLAM</td><td>"+money(tot)+" TL</td><td></td></tr></tfoot></table></div>";
  }
  box.insertAdjacentHTML("beforeend", html);
};
setTimeout(paint,800);
setTimeout(paint,2000);
})();
