(function(){
function money(n){ n=Math.round(n||0); return n===0?"0":(typeof tl==="function"?tl(n):String(n)); }
function paintOzet(){
  if(typeof sums!=="function") return;
  var s=sums();
  var kisa=document.getElementById("ozetKisa");
  var ayr=document.getElementById("ozetAyrinti");
  if(!kisa||!ayr) return;
  var rows=s.all||[];
  var body=rows.map(function(x,i){
    return '<tr class="'+(x.c.toplam>0?"pay":"")+'"><td>'+(i+1)+'</td><td class="name">'+(x.p.name||"")+'</td><td class="tot">'+money(x.c.toplam)+"</td></tr>";
  }).join("");
  kisa.innerHTML='<div class="row" style="justify-content:space-between;align-items:center;flex-wrap:wrap"><h2 style="margin:0;font-size:18px">Kisa ozet</h2><div class="row page-pdf"><button class="btn primary" type="button" onclick="pagePdf(\'ozet-kisa\',false)">PDF indir</button><button class="btn" type="button" onclick="pagePdf(\'ozet-kisa\',true)">Paylas</button></div></div>'+
    '<p style="margin:6px 0">'+rows.length+" kisi / "+s.pay.length+" odeme \u00b7 <b>"+money(s.toplam)+" TL</b></p>"+
    '<div style="overflow:auto;max-height:70vh">'+
    '<table class="sheet slim" style="min-width:0;width:100%"><thead><tr><th>No</th><th>Ad Soyad</th><th>Odenecek</th></tr></thead><tbody>'+body+
    "</tbody><tfoot><tr><td></td><td>TOPLAM</td><td>"+money(s.toplam)+"</td></tr></tfoot></table></div>";
}
var prev=window.renderOzet;
window.renderOzet=function(){
  if(typeof prev==="function"){ try{ prev(); }catch(e){} }
  paintOzet();
};
var prevTab=window.tab;
window.tab=function(el){
  if(typeof prevTab==="function") prevTab(el);
  if(el && el.dataset && el.dataset.tab==="ozet") paintOzet();
};
var prevMod=window.ozetMod;
window.ozetMod=function(m){
  if(typeof prevMod==="function") prevMod(m);
  paintOzet();
};
setTimeout(paintOzet,300);
setTimeout(paintOzet,1200);
})();
