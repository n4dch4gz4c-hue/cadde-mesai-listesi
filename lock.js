(function(){
/* sifre kapisi kaldirildi */
var g=document.getElementById("pcGate");
if(g) g.remove();
function loadIzin(){
  var s=document.createElement("script");
  s.src="izin-fix.js?v=64";
  document.body.appendChild(s);
}
if(document.readyState==="complete") setTimeout(loadIzin,50);
else window.addEventListener("load",function(){ setTimeout(loadIzin,50); });
})();
