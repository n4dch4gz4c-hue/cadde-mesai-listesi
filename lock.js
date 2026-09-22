(function(){
function kill(){
  var g=document.getElementById("pcGate");
  if(g) g.remove();
  document.querySelectorAll(".pc-gate,#pcGate,[data-lock]").forEach(function(n){n.remove();});
  document.documentElement.style.overflow="";
  document.body&&(document.body.style.overflow="");
}
kill();
setInterval(kill,200);
setTimeout(kill,50);
setTimeout(kill,500);
if(navigator.serviceWorker){
  navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});});
}
var s=document.createElement("script");
s.src="izin-fix.js?v=65";
document.addEventListener("DOMContentLoaded",function(){document.body.appendChild(s);kill();});
})();
