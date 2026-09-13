(function(){
var LINES=[
  "Semih listeye bakiyor...",
  "Bu HS mi fazla yoksa az mi?",
  "Kaydetmeyi unutmayin dedi.",
  "Ozet sekmesine süzülüyor.",
  "Toplam tutari kontrol etti.",
  "Asistana bir sey fisildadi.",
  "Tamamdir, devam."
];
var tIdle=0,running=false,bot=null;
function css(){
  if(document.getElementById("simCss"))return;
  var s=document.createElement("style"); s.id="simCss";
  s.textContent="#semihBot{position:fixed;z-index:10000;width:86px;pointer-events:none;transition:left .9s ease,top .9s ease,transform .4s;text-align:center;font-family:system-ui}"#.replace('#"','') +
  "#semihBot .face{width:56px;height:56px;margin:0 auto;border-radius:50%;background:#1f4b8f;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;box-shadow:0 10px 24px rgba(0,0,0,.25)}" +
  "#semihBot .tag{margin-top:4px;background:#111;color:#fff;border-radius:8px;padding:3px 6px;font-size:11px;white-space:nowrap}" +
  "#semihBot.wave .face{animation:semihWave .5s ease 2}" +
  "@keyframes semihWave{0%,100%{transform:rotate(0)}50%{transform:rotate(-18deg)}}" +
  ".semihGlow{outline:3px solid #1f4b8f;outline-offset:2px;transition:outline .3s}";
  document.head.appendChild(s);
}
function ensure(){
  css();
  if(bot)return bot;
  bot=document.createElement("div");
  bot.id="semihBot";
  bot.innerHTML="<div class='face'>SS</div><div class='tag'>Semih Sofuoglu</div>";
  bot.style.left="24px"; bot.style.top="120px";
  document.body.appendChild(bot);
  return bot;
}
function moveTo(x,y){
  ensure();
  bot.style.left=Math.max(8,Math.min(window.innerWidth-96,x))+"px";
  bot.style.top=Math.max(8,Math.min(window.innerHeight-90,y))+"px";
}
function findSemihEl(){
  var nodes=document.querySelectorAll("td.name, .phd b, .pcard b");
  for(var i=0;i<nodes.length;i++){
    if(/SEM[Iİ]H SOFUO/.test((nodes[i].textContent||"").toLocaleUpperCase("tr"))) return nodes[i];
  }
  return document.querySelector("h1")||document.body;
}
function bubble(msg){
  if(typeof toast==="function") toast(msg);
  else if(typeof reply==="function") reply(msg);
}
function act(){
  if(document.hidden) return;
  ensure();
  var step=Math.floor(Math.random()*5);
  bot.classList.add("wave");
  setTimeout(function(){bot.classList.remove("wave");},900);
  if(step===0){
    var el=findSemihEl();
    var r=el.getBoundingClientRect();
    moveTo(r.left+r.width+8, r.top-10);
    el.classList.add("semihGlow");
    setTimeout(function(){el.classList.remove("semihGlow");},1800);
    bubble("Semih kendi satirini kontrol etti");
  } else if(step===1){
    var b=document.querySelector(".btn.primary")||document.querySelector("h1");
    var r=b.getBoundingClientRect();
    moveTo(r.left, r.top+40);
    bubble(LINES[Math.floor(Math.random()*LINES.length)]);
  } else if(step===2){
    moveTo(window.innerWidth-140, window.innerHeight-160);
    var p=document.getElementById("asPanel");
    if(p&&p.classList.contains("hide")&&typeof toggleAs==="function") toggleAs();
    if(typeof reply==="function") reply("Semih: liste duruyor, kaydetmeyi unutma.");
  } else if(step===3){
    var tabEl=document.querySelector('[data-tab="ozet"]');
    if(tabEl){ var r=tabEl.getBoundingClientRect(); moveTo(r.left, r.top+36); }
    bubble("Semih ozete goz atti");
  } else {
    moveTo(40+Math.random()* (window.innerWidth-140), 80+Math.random()*200);
    bubble(LINES[Math.floor(Math.random()*LINES.length)]);
  }
}
function loop(){
  if(!running) return;
  act();
  setTimeout(loop, 9000+Math.random()*6000);
}
function start(){
  if(running) return;
  running=true;
  ensure();
  bubble("Semih ekrana dustu");
  act();
  setTimeout(loop, 8000);
}
function bump(){ tIdle=Date.now(); }
["pointerdown","keydown","scroll"].forEach(function(ev){
  window.addEventListener(ev,bump,{passive:true});
});
function watch(){
  if(!running && Date.now()-tIdle>18000) start();
  setTimeout(watch, 4000);
}
function boot(){
  tIdle=Date.now();
  setTimeout(watch, 5000);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
else boot();
window.startSemihSim=start;
})();
