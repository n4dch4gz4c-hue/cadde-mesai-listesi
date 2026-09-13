(function(){
function norm(s){return (s||"").toString().toLocaleLowerCase("tr").replace(/\s+/g," ").trim();}
function findPeople(q){
  q=norm(q);
  if(!q)return [];
  return state.people.filter(p=>norm(p.name).includes(q)||norm(p.name).split(" ").some(w=>q.includes(w)&&w.length>2));
}
function pickPerson(text){
  var hits=state.people.map(p=>({p,n:norm(p.name)})).filter(x=>text.includes(x.n)||x.n.split(" ").filter(w=>w.length>3).some(w=>text.includes(w)));
  hits.sort((a,b)=>b.n.length-a.n.length);
  if(hits.length)return hits[0].p;
  var parts=text.split(/\s+/).filter(w=>w.length>2);
  for(var i=0;i<parts.length;i++){
    var f=findPeople(parts[i]);
    if(f.length===1)return f[0];
  }
  return null;
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
  return "<b>"+p.name+"</b> · toplam "+tl(c.toplam)+" · mesai "+dash(c.mesai)+" · HS "+dash(c.hs)+" · izin "+dash(c.izin+c.yillik);
}
function runAssist(raw){
  var t=norm(raw);
  if(!t)return;
  if(/kaydet|yaz|gonder|yukle/.test(t) && /sunucu|github|kaydet/.test(t) || t==="kaydet" || t==="sunucuya kaydet"){
    save(); reply("Sunucuya kaydediyorum."); return;
  }
  if(/cek|yenile|guncelle|sunucudan/.test(t) && !/ekle/.test(t)){
    yenileSunucu(); reply("Sunucudan cekiyorum."); return;
  }
  if(/kisa ozet/.test(t)){ goTab("ozet"); ozetMod("kisa"); reply("Kisa ozet acildi."); return; }
  if(/ayrinti|detay/.test(t) && /ozet/.test(t)){ goTab("ozet"); ozetMod("ayrinti"); reply("Ayrintili ozet acildi."); return; }
  if(/ozet/.test(t)){ goTab("ozet"); reply("Ozet sekmesi."); return; }
  if(/rapor|finans/.test(t)){ goTab("rapor"); renderRapor(); reply("Aylik rapor acildi."); return; }
  if(/kurye/.test(t) && !/ekle/.test(t)){ goTab("kurye"); reply("Kurye listesi."); return; }
  if(/devamsiz/.test(t) && !/ekle/.test(t)){ goTab("devam"); reply("Devamsizlik."); return; }
  if(/ceza/.test(t) && !/ekle|yaz/.test(t)){ goTab("ceza"); reply("Cezalar."); return; }
  if(/liste/.test(t)){ goTab("liste"); reply("Liste."); return; }
  if(/yardim|ne yap|komut/.test(t)){
    reply("Ornekler:<br>Ahmet HS 2<br>Aydin mesai 2<br>Hasan Ipek izin 2 gun 5800<br>Ali kurye ekle<br>Semih ne kadar<br>toplam<br>kaydet<br>cek"); return;
  }
  if(/toplam|kasa|genel/.test(t) && !pickPerson(t)){
    var s=sums(); reply(s.pay.length+" kisi · <b>"+tl(s.toplam)+" TL</b>"); return;
  }
  var addM=t.match(/(.+?)(?:\s+kurye)?\s+ekle/);
  if(/ekle/.test(t)){
    var name=t.replace(/kurye/g,"").replace(/ekle/g,"").replace(/kisi/g,"").trim();
    name=name.replace(/\d+/g,"").trim();
    if(name.length<3){reply("Isim yaz: ornek Ali Veli ekle");return;}
    var kurye=/kurye/.test(t);
    var birim=numIn(t,300);
    if(birim===numIn(name,300) && /ekle/.test(raw)) birim=300;
    state.people.push(hydratePerson({id:nextId(),name:name.toLocaleUpperCase("tr"),kurye:kurye,mesaiBirim:birim>=100?birim:300}));
    persist();renderAll();
    reply((kurye?"Kurye ":"")+name.toLocaleUpperCase("tr")+" eklendi."); return;
  }
  if(/sil/.test(t)){
    var p=pickPerson(t);
    if(!p){reply("Kimi sileyim?");return;}
    silKisi(p.id); reply(p.name+" silindi (onay verdiysen)."); return;
  }
  var p=pickPerson(t);
  if(/devamsiz|gelmedi|raporlu|ucretsiz/.test(t)){
    if(!p){reply("Kimin devamsizligi?");return;}
    var gun=numIn(t,1);
    state.devamsizlik=state.devamsizlik||[];
    state.devamsizlik.push({kisi:p.name,gun:gun,not:raw});
    persist();renderAll();goTab("devam");
    reply(p.name+" icin "+gun+" gun devamsizlik yazildi."); return;
  }
  if(/ceza/.test(t)){
    if(!p){reply("Kime ceza?");return;}
    var tut=numIn(t,1000);
    state.cezalar=state.cezalar||[];
    state.cezalar.push({kisi:p.name,tutar:tut,neden:raw});
    persist();renderAll();goTab("ceza");
    reply(p.name+" ceza "+tl(tut)+" TL."); return;
  }
  if(p && (/hs|hafta\s*sonu/.test(t))){
    var v=numIn(t,1);
    setVal(p.id,"hsSaat",v);
    reply(personLine(state.people.find(x=>x.id===p.id))); return;
  }
  if(p && /mesai/.test(t)){
    var v=numIn(t,1);
    setVal(p.id,"mesaiSaat",v);
    reply(personLine(state.people.find(x=>x.id===p.id))); return;
  }
  if(p && /yillik/.test(t)){
    var v=numIn(t,0);
    setVal(p.id,"yillikTutar",v);
    reply(personLine(state.people.find(x=>x.id===p.id))); return;
  }
  if(p && /izin/.test(t)){
    var gun=0,tutar=0;
    var gm=t.match(/(\d+(?:\.\d+)?)\s*gun/);
    if(gm)gun=parseFloat(gm[1]);
    var tm=t.match(/(\d+)\s*(?:tl|tutar)?/g);
    tutar=numIn(t.replace(/gun/g,""),0);
    if(gun)setVal(p.id,"izinGun",gun);
    if(tutar>=100)setVal(p.id,"izinTutar",tutar);
    reply(personLine(state.people.find(x=>x.id===p.id))); return;
  }
  if(p && /yol/.test(t)){
    setVal(p.id,"yolTutar",numIn(t,0));
    reply(personLine(state.people.find(x=>x.id===p.id))); return;
  }
  if(p && /kurye yap|kurye et/.test(t)){
    var x=state.people.find(z=>z.id===p.id); x.kurye=true; persist();renderAll();
    reply(p.name+" kurye isaretlendi."); return;
  }
  if(p && (/ne kadar|kac|goster|kimdir|bak/.test(t) || t===norm(p.name))){
    reply(personLine(p)); return;
  }
  if(p){ reply(personLine(p)+"<br>Ornek: HS 2 / mesai 3 / kaydet"); return; }
  reply("Anlamadim. \"yardim\" yaz.");
}
function sendAssist(){
  var inp=document.getElementById("asIn");
  var t=(inp.value||"").trim();
  if(!t)return;
  inp.value="";
  sayUser(t);
  try{runAssist(t);}catch(e){reply("Hata: "+e.message);}
}
function mountAssist(){
  if(document.getElementById("asFab"))return;
  var st=document.createElement("style");
  st.textContent="#asFab{position:fixed;right:16px;bottom:16px;width:56px;height:56px;border-radius:50%;border:0;background:#1f4b8f;color:#fff;font-size:22px;box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:20;cursor:pointer}
#asPanel{position:fixed;right:16px;bottom:80px;width:min(360px,calc(100vw - 24px));height:min(460px,70vh);background:#fff;border:1px solid #d7cfc3;border-radius:16px;box-shadow:0 16px 40px rgba(0,0,0,.2);z-index:20;display:flex;flex-direction:column;overflow:hidden}
#asPanel.hide{display:none!important}
#asHead{background:#1f4b8f;color:#fff;padding:10px 12px;display:flex;justify-content:space-between;align-items:center}
#asMsgs{flex:1;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:8px;background:#f7f4ee}
.as-bot,.as-me{padding:8px 10px;border-radius:12px;max-width:90%;font-size:14px;line-height:1.35}
.as-bot{background:#fff;border:1px solid #eadfd2;align-self:flex-start}
.as-me{background:#1f4b8f;color:#fff;align-self:flex-end}
#asForm{display:flex;gap:6px;padding:8px;border-top:1px solid #eadfd2}
#asIn{flex:1;min-width:0}
@media print{#asFab,#asPanel{display:none!important}}";
  document.head.appendChild(st);
  var fab=document.createElement("button");
  fab.id="asFab"; fab.type="button"; fab.title="Asistan"; fab.textContent="✦";
  fab.onclick=function(){document.getElementById("asPanel").classList.toggle("hide");document.getElementById("asIn").focus();};
  var pan=document.createElement("div");
  pan.id="asPanel"; pan.className="hide";
  pan.innerHTML='<div id="asHead"><b>Cadde Asistan</b><button class="btn" onclick="document.getElementById(\'asPanel\').classList.add(\'hide\')">x</button></div><div id="asMsgs"></div><form id="asForm"><input id="asIn" placeholder="Ornek: Aydin HS 2" autocomplete="off"/><button class="btn primary" type="submit">Gonder</button></form>';
  document.body.appendChild(fab);
  document.body.appendChild(pan);
  document.getElementById("asForm").addEventListener("submit",function(e){e.preventDefault();sendAssist();});
  reply("Komut yaz, ben listede uygularim.<br>Aydin HS 2<br>Hakan mesai 7<br>kaydet / cek / toplam / yardim");
}
document.addEventListener("DOMContentLoaded",mountAssist);
window.sendAssist=sendAssist;
window.runAssist=runAssist;
})();
