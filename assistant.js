(function(){
function norm(s){return (s||"").toString().toLocaleLowerCase("tr").replace(/\s+/g," ").trim();}
function pickPerson(text){
  var hits=state.people.map(function(p){return {p:p,n:norm(p.name)};}).filter(function(x){
    return text.indexOf(x.n)>=0 || x.n.split(" ").filter(function(w){return w.length>3;}).some(function(w){return text.indexOf(w)>=0;});
  });
  hits.sort(function(a,b){return b.n.length-a.n.length;});
  return hits.length?hits[0].p:null;
}
function numIn(text,def){
  var m=String(text).replace(",",".").match(/(-?\d+(?:\.\d+)?)/);
  return m?parseFloat(m[1]):def;
}
function goTab(id){
  var el=document.querySelector('.tab[data-tab="'+id+'"]');
  if(el)tab(el);
}
function reply(html){
  var box=document.getElementById("asMsgs");
  if(!box)return;
  var d=document.createElement("div");
  d.className="as-bot";
  d.innerHTML=html;
  box.appendChild(d);
  box.scrollTop=box.scrollHeight;
}
function sayUser(t){
  var box=document.getElementById("asMsgs");
  var d=document.createElement("div");
  d.className="as-me";
  d.textContent=t;
  box.appendChild(d);
}
function personLine(p){
  var c=calc(p);
  return "<b>"+p.name+"</b> · toplam "+tl(c.toplam)+" · mesai "+dash(c.mesai)+" · HS "+dash(c.hs);
}
function runAssist(raw){
  var t=norm(raw);
  if(!t)return;
  if(t==="kaydet"||t.indexOf("sunucuya")>=0){save();reply("Sunucuya kaydediyorum.");return;}
  if(t==="cek"||t.indexOf("yenile")>=0||t.indexOf("sunucudan")>=0){yenileSunucu();reply("Sunucudan cekiyorum.");return;}
  if(t.indexOf("kisa ozet")>=0){goTab("ozet");ozetMod("kisa");reply("Kisa ozet.");return;}
  if(t.indexOf("ozet")>=0){goTab("ozet");reply("Ozet.");return;}
  if(t.indexOf("rapor")>=0){goTab("rapor");renderRapor();reply("Rapor.");return;}
  if(t.indexOf("kurye")>=0 && t.indexOf("ekle")<0 && t.indexOf("yap")<0){goTab("kurye");reply("Kurye.");return;}
  if(t.indexOf("liste")>=0){goTab("liste");reply("Liste.");return;}
  if(t.indexOf("yardim")>=0){reply("Ornek: Aydin HS 2<br>Hakan mesai 7<br>Ali ekle<br>toplam<br>kaydet / cek");return;}
  if((t==="toplam"||t.indexOf("kasa")>=0) && !pickPerson(t)){var s=sums();reply(s.pay.length+" kisi · <b>"+tl(s.toplam)+" TL</b>");return;}
  if(t.indexOf("ekle")>=0){
    var name=t.replace(/kurye/g,"").replace(/ekle/g,"").replace(/kisi/g,"").replace(/\d+/g,"").trim();
    if(name.length<3){reply("Isim yaz");return;}
    state.people.push(hydratePerson({id:nextId(),name:name.toLocaleUpperCase("tr"),kurye:/kurye/.test(t),mesaiBirim:300}));
    persist();renderAll();
    reply(name.toLocaleUpperCase("tr")+" eklendi.");return;
  }
  var p=pickPerson(t);
  if(p && /hs|hafta/.test(t)){setVal(p.id,"hsSaat",numIn(t,1));reply(personLine(state.people.filter(function(x){return x.id===p.id;})[0]));return;}
  if(p && /mesai/.test(t)){setVal(p.id,"mesaiSaat",numIn(t,1));reply(personLine(state.people.filter(function(x){return x.id===p.id;})[0]));return;}
  if(p && /yillik/.test(t)){setVal(p.id,"yillikTutar",numIn(t,0));reply(personLine(state.people.filter(function(x){return x.id===p.id;})[0]));return;}
  if(p && /izin/.test(t)){
    var gun=numIn(t,0), tutar=numIn(t.replace(/gun/g,""),0);
    if(/gun/.test(t)) setVal(p.id,"izinGun",gun);
    if(tutar>=100) setVal(p.id,"izinTutar",tutar);
    reply(personLine(state.people.filter(function(x){return x.id===p.id;})[0]));return;
  }
  if(p && /yol/.test(t)){setVal(p.id,"yolTutar",numIn(t,0));reply(personLine(state.people.filter(function(x){return x.id===p.id;})[0]));return;}
  if(p){reply(personLine(p));return;}
  reply("Anlamadim. yardim yaz.");
}
function sendAssist(){
  var inp=document.getElementById("asIn");
  var t=(inp.value||"").trim();
  if(!t)return;
  inp.value="";
  sayUser(t);
  try{runAssist(t);}catch(e){reply("Hata: "+e.message);}
}
function toggleAs(){
  var p=document.getElementById("asPanel");
  if(!p)return;
  p.classList.toggle("hide");
  if(!p.classList.contains("hide")) document.getElementById("asIn").focus();
}
function bindAssist(){
  var fab=document.getElementById("asFab");
  var form=document.getElementById("asForm");
  if(fab) fab.onclick=toggleAs;
  if(form) form.addEventListener("submit",function(e){e.preventDefault();sendAssist();});
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",bindAssist);
else bindAssist();
window.sendAssist=sendAssist;
window.runAssist=runAssist;
window.toggleAs=toggleAs;
})();
