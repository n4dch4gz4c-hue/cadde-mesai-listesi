(function(){
function killAs(){
  ["asFab","asPanel"].forEach(function(id){ var el=document.getElementById(id); if(el) el.remove(); });
}
killAs();
setInterval(killAs,800);
var st=document.createElement("style");
st.id="mobileFixCss";
st.textContent=[
"#asFab,#asPanel{display:none!important}",
"#sec-ozet td.name,#kalemPanel td.name,.mname,.rrow .rn{color:#111!important;opacity:1!important;font-weight:800!important}",
"#sec-ozet td,#kalemPanel td{color:#111!important}",
"@media(max-width:900px){",
"#kisiPanel table,.kisi-table{display:none!important}",
"#kalemPanel table.kalem-table{display:table!important;min-width:0!important;width:100%!important;background:#fff!important}",
"#raporMob{display:block;padding:0 12px 28px}",
"}",
"@media(min-width:901px){#raporMob{display:none}}"
].join("");
document.head.appendChild(st);
window.openMob=window.openMob||null;
window.toggleMob=function(id,ev){
  if(ev&&ev.target&&ev.target.tagName==="INPUT")return;
  window.openMob=window.openMob===id?null:id;
  if(typeof paintMob==="function") paintMob();
};
function paintRaporMob(){
  var root=document.getElementById("raporBox");
  if(!root) return;
  var old=document.getElementById("raporMob");
  if(old) old.remove();
  if(window.innerWidth>900) return;
  if(document.getElementById("kalemPanel")) return;
}
window.paintRaporMob=paintRaporMob;
(function wrap(){
  if(typeof renderRapor==="function" && !renderRapor._mob3){
    var oldR=renderRapor;
    renderRapor=function(){ oldR(); killAs(); };
    renderRapor._mob3=1;
  }
})();
setTimeout(killAs,400);
})();
