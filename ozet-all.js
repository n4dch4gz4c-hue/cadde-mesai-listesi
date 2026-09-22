(function(){
function money(n){ n=Math.round(Number(n)||0); return n===0?"0":(typeof tl==="function"?tl(n):String(n)); }
function rowsOf(){
  var people=(window.state&&state.people)||[];
  return people.map(function(p){
    var c=(typeof calc==="function")?calc(p):{toplam:0,mesai:0,hs:0,prim:0,yol:0,izin:0,yillik:0};
    return {p:p,c:c};
  });
}
function paintKisa(){
  var kisa=document.getElementById("ozetKisa");
  if(!kisa) return;
  var rows=rowsOf();
  var pay=0, tot=0, i, x, html;
  for(i=0;i<rows.length;i++){ tot+=rows[i].c.toplam||0; if((rows[i].c.toplam||0)>0) pay++; }
  html="<div class='row' style='justify-content:space-between;align-items:center;flex-wrap:wrap'><h2 style='margin:0;font-size:18px'>Kisa ozet</h2></div>";
  html+="<p style='margin:6px 0'>"+rows.length+" kisi / "+pay+" odeme \u00b7 <b>"+money(tot)+" TL</b></p>";
  html+="<div style='overflow:auto;max-height:70vh'><table class='sheet slim' style='min-width:0;width:100%'>";
  html+="<thead><tr><th>No</th><th>Ad Soyad</th><th>Odenecek</th></tr></thead><tbody>";
  for(i=0;i<rows.length;i++){
    x=rows[i];
    html+="<tr class='"+(x.c.toplam>0?"pay":"")+"'><td>"+(i+1)+"</td><td class='name'>"+(x.p.name||"")+"</td><td class='tot'>"+money(x.c.toplam)+"</td></tr>";
  }
  html+="</tbody><tfoot><tr><td></td><td>TOPLAM</td><td>"+money(tot)+"</td></tr></tfoot></table></div>";
  kisa.innerHTML=html;
}
window.renderOzet=function(){ paintKisa(); };
var oldTab=window.tab;
window.tab=function(el){
  if(typeof oldTab==="function") oldTab(el);
  if(el&&el.dataset&&el.dataset.tab==="ozet") paintKisa();
};
var oldMod=window.ozetMod;
window.ozetMod=function(m){
  if(typeof oldMod==="function") oldMod(m);
  paintKisa();
};
setTimeout(paintKisa,600);
setTimeout(paintKisa,1800);
})();
