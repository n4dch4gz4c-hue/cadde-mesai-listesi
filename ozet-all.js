(function(){
function money(n){ n=Math.round(Number(n)||0); return n===0?"0":(typeof tl==="function"?tl(n):String(n)); }
function draw(list){
  var kisa=document.getElementById("ozetKisa");
  if(!kisa) return;
  list=list||[];
  var html, i, p, c, tot=0, pay=0;
  html="<div class='row'><h2 style='margin:0;font-size:18px'>Kisa ozet</h2></div>";
  html+="<p style='margin:6px 0' id='ozetKisaMeta'></p>";
  html+="<div style='overflow:auto;max-height:70vh'><table class='sheet slim' style='min-width:0;width:100%'>";
  html+="<thead><tr><th>No</th><th>Ad Soyad</th><th>Odenecek</th></tr></thead><tbody>";
  for(i=0;i<list.length;i++){
    p=list[i];
    c=(typeof calc==="function")?calc(p):{toplam:Number(p.mesaiSaat||0)*Number(p.mesaiBirim||300)+Number(p.hsSaat||0)*2500+Number(p.yolTutar||0)+Number(p.izinTutar||0)+Number(p.yillikTutar||0)};
    tot+=c.toplam||0;
    if((c.toplam||0)>0) pay++;
    html+="<tr class='"+(c.toplam>0?"pay":"")+"'><td>"+(i+1)+"</td><td class='name'>"+(p.name||"")+"</td><td class='tot'>"+money(c.toplam)+"</td></tr>";
  }
  html+="</tbody><tfoot><tr><td></td><td>TOPLAM</td><td>"+money(tot)+"</td></tr></tfoot></table></div>";
  kisa.innerHTML=html;
  var meta=document.getElementById("ozetKisaMeta");
  if(meta) meta.innerHTML=list.length+" kisi / "+pay+" odeme \u00b7 <b>"+money(tot)+" TL</b>";
}
function fromMem(){
  if(typeof window.state==="object" && window.state && Array.isArray(window.state.people) && window.state.people.length) return window.state.people;
  try{
    var raw=localStorage.getItem("cadde_bordro_v4");
    if(raw){ var s=JSON.parse(raw); if(s&&s.people&&s.people.length) return s.people; }
  }catch(e){}
  return [];
}
function paintKisa(){
  var list=fromMem();
  if(list.length){ draw(list); return; }
  fetch("cadde-data.json?t="+Date.now(),{cache:"no-store"}).then(function(r){return r.json();}).then(function(s){
    if(s&&s.people) draw(s.people);
  }).catch(function(){});
}
window.renderOzet=function(){ paintKisa(); };
document.addEventListener("click",function(ev){
  var t=ev.target&&ev.target.closest&&ev.target.closest("[data-tab='ozet'],[data-ozet]");
  if(t) setTimeout(paintKisa,40);
});
setTimeout(paintKisa,900);
setTimeout(paintKisa,2500);
})();
