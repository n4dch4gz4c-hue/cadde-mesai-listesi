(function(){
var KEY="cadde_pc_ok";
function isPhone(){
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent||"");
}
function unlock(){
  var g=document.getElementById("pcGate");
  if(g) g.remove();
  sessionStorage.setItem(KEY,"1");
}
function tryPass(){
  var inp=document.getElementById("pcPass");
  var v=(inp&&inp.value||"").trim().toLocaleLowerCase("tr");
  if(v==="kizilkaya"||v==="kızılkaya"){ unlock(); return; }
  var e=document.getElementById("pcErr");
  if(e) e.textContent="Sifre yanlis";
  if(inp){ inp.value=""; inp.focus(); }
}
function gate(){
  if(isPhone()) return;
  if(sessionStorage.getItem(KEY)==="1") return;
  var d=document.createElement("div");
  d.id="pcGate";
  d.innerHTML="<div class='pcCard'><h2>Cadde Mesai</h2><p>Bilgisayar girisi</p><input id='pcPass' type='password' autocomplete='current-password' placeholder='Sifre'/><button type='button' id='pcGo' class='btn primary'>Gir</button><p id='pcErr'></p></div>";
  var st=document.createElement("style");
  st.textContent="#pcGate{position:fixed;inset:0;background:#1a1f2b;z-index:20000;display:flex;align-items:center;justify-content:center}"+ 
  ".pcCard{background:#fff;padding:24px;border-radius:16px;width:min(320px,90vw);display:flex;flex-direction:column;gap:10px;font-family:system-ui}"+ 
  ".pcCard input{padding:10px;border:1px solid #d7cfc3;border-radius:8px;font-size:16px}"+ 
  "#pcErr{color:#b42318;min-height:1em;margin:0}";
  document.head.appendChild(st);
  document.body.appendChild(d);
  document.getElementById("pcGo").onclick=tryPass;
  document.getElementById("pcPass").addEventListener("keydown",function(e){ if(e.key==="Enter") tryPass(); });
  setTimeout(function(){ var i=document.getElementById("pcPass"); if(i)i.focus(); },200);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",gate);
else gate();
function loadIzin(){
  var s=document.createElement("script");
  s.src="izin-fix.js?v=51";
  document.body.appendChild(s);
}
if(document.readyState==="complete") setTimeout(loadIzin,50);
else window.addEventListener("load",function(){ setTimeout(loadIzin,50); });
})();
