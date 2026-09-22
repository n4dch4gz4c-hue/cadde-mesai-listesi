(function(){
function money(n){ n=Math.round(Number(n)||0); return n===0?"0":(typeof tl==="function"?tl(n):String(n)); }
function people(){
  if(typeof state!=="undefined" && state && Array.isArray(state.people)) return state.people;
  try{
    var raw=localStorage.getItem("cadde_bordro_v4");
    if(raw){ var s=JSON.parse(raw); if(s&&Array.isArray(s.people)) return s.people; }
  }catch(e){}
  return [];
}
function paintKisa(){
  var kisa=document.getElementById("ozetKisa");
  if(!kisa) return;
  var list=people();
  var html, i, p, c, tot=0, pay=0;
  html="<div class='row' style='justify-content:space-between;align-items:center'><h2 style='margin:0;font-size:18px'>Kisa ozet</h2></div>";
  html+="<p style='margin:6px 0' id='ozetKisaMeta'></p>";
  html+="<div style='overflow:auto;max-height:70vh'><table class='sheet slim' style='min-width:0;width:100%'>";
  html+="<thead><tr><th>No</th><th>Ad Soyad</th><th>Odenecek</th></tr></thead><tbody>";
  for(i=0;i<list.length;i++){
    p=list[i];
    c=(typeof calc==="function")?calc(p):{toplam:0};
    tot+=c.toplam||0;
    if((c.toplam||0)>0) pay++;
    html+="<tr class='"+(c.toplam>0?"pay":"")+"'><td>"+(i+1)+"</td><td class='name'>"+(p.name||"")+"</td><td class='tot'>"+money(c.toplam)+"</td></tr>";
  }
  html+="</tbody><tfoot><tr><td></td><td>TOPLAM</td><td>"+money(tot)+"</td></tr></tfoot></table></div>";
  kisa.innerHTML=html;
  var meta=document.getElementById("ozetKisaMeta");
  if(meta) meta.innerHTML=list.length+" kisi / "+pay+" odeme \u00b7 <b>"+money(tot)+" TL</b>";
}
window.renderOzet=function(){ paintKisa(); };
var oldTab=window.tab;
window.tab=function(el){
  if(typeof oldTab==="function") oldTab(el);
  paintKisa();
};
document.addEventListener("click",function(ev){
  var t=ev.target.closest("[data-tab='ozet'],[data-ozet]");
  if(t) setTimeout(paintKisa,30);
});
setTimeout(paintKisa,800);
setTimeout(paintKisa,2000);
})();
