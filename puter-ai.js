(function(){
function brief(){
  var people=(state.people||[]).map(function(p){
    var c=calc(p);
    return {n:p.name,k:!!p.kurye,m:p.mesaiSaat||0,hs:p.hsSaat||0,yol:p.yolTutar||0,izG:p.izinGun||0,izT:p.izinTutar||0,yil:p.yillikTutar||0,prim:p.primAdet||0,top:Math.round(c.toplam)};
  });
  var s=typeof sums==="function"?sums():null;
  return {kisi:people.length,odeme:s?s.pay.length:people.filter(function(x){return x.top>0;}).length,genel:s?Math.round(s.toplam):people.reduce(function(a,x){return a+x.top;},0),people:people};
}
function findName(name){
  if(!name) return null;
  var n=String(name).toLocaleLowerCase("tr");
  var exact=(state.people||[]).find(function(p){return (p.name||"").toLocaleLowerCase("tr")===n;});
  if(exact) return exact;
  var hits=(state.people||[]).filter(function(p){
    var pn=(p.name||"").toLocaleLowerCase("tr");
    return pn.indexOf(n)>=0 || n.indexOf(pn)>=0 || pn.split(" ").some(function(w){return w.length>2&&n.indexOf(w)>=0;});
  });
  return hits[0]||null;
}
function persistAll(){ persist(); if(typeof renderAll==="function") renderAll(); else if(typeof renderListe==="function") renderListe(); }
function applyActions(actions){
  var notes=[];
  (actions||[]).forEach(function(a){
    if(!a||!a.op) return;
    if(a.op==="set"){
      var p=findName(a.name); if(!p){notes.push("kisi yok: "+a.name);return;}
      var f=a.field, v=Number(a.value);
      if(f==="primAdet"){p.primAdet=v||0; persistAll();}
      else if(typeof setVal==="function") setVal(p.id,f,v);
      notes.push(p.name+" "+f+"="+v);
    } else if(a.op==="add"){
      var nm=String(a.name||"").trim();
      if(nm.length<3) return;
      if((state.people||[]).some(function(x){return (x.name||"").toLocaleLowerCase("tr")===nm.toLocaleLowerCase("tr");})){notes.push(nm+" var");return;}
      var id=(state.people||[]).reduce(function(m,x){return Math.max(m,x.id||0);},0)+1;
      state.people.push(hydratePerson({id:id,name:nm.toLocaleUpperCase("tr"),kurye:!!a.kurye,mesaiBirim:300})); persistAll(); notes.push(nm+" eklendi");
    } else if(a.op==="save" && typeof save==="function"){ save(); notes.push("kaydet"); }
    else if(a.op==="pull" && typeof yenileSunucu==="function"){ yenileSunucu(); notes.push("cek"); }
    else if(a.op==="tab"){
      var el=document.querySelector('.tab[data-tab="'+(a.tab||"liste")+'"]');
      if(el&&typeof tab==="function") tab(el);
    }
  });
  return notes;
}
function sys(user){
  var b=brief();
  return "Sen Cadde Mesai Listesi asistanisin. Turkce, kisa cevap ver. "+
    "HS adet x 2500, mesai saat x 300, yol TL, izin gun/tutar, kurye prim adet x 7. "+
    "Ozet: "+b.kisi+" kisi, "+b.odeme+" odeme, "+b.genel+" TL. "+
    "Kadro (kisaltma): "+JSON.stringify(b.people)+". "+
    "Listeyi degistirmen gerekiyorsa cevabin EN SONUNA su formatta tek JSON ekle: "+
    "{\"actions\":[{\"op\":\"set\",\"name\":\"AYDIN\",\"field\":\"hsSaat\",\"value\":2}]} "+
    "field: mesaiSaat|hsSaat|yolTutar|izinGun|izinTutar|yillikTutar|primAdet|disiplinDk. "+
    "op add/save/pull/tab da olabilir. JSON yoksa sadece sohbet et. Kullanici: "+user;
}
function extractText(res){
  if(res==null) return "";
  if(typeof res==="string") return res;
  if(typeof res.message==="string") return res.message;
  if(res.message&&typeof res.message.content==="string") return res.message.content;
  if(Array.isArray(res.message&&res.message.content)){
    return res.message.content.map(function(p){return p.text||p;}).join("");
  }
  if(res.content) return String(res.content);
  try{return JSON.stringify(res);}catch(e){return String(res);}
}
function splitJson(text){
  var raw=String(text||"");
  var m=raw.match(/\{[\s\S]*\"actions\"[\s\S]*\}\s*$/);
  if(!m){
    var i=raw.lastIndexOf('{"actions"');
    if(i>=0) m=[raw.slice(i)];
  }
  var talk=raw, acts=[];
  if(m){
    talk=raw.slice(0, raw.lastIndexOf(m[0])).trim();
    try{
      var j=JSON.parse(m[0]);
      acts=j.actions||[];
    }catch(e){}
  }
  return {talk:talk, actions:acts};
}
async function callPuter(prompt){
  if(!(window.puter&&puter.ai&&typeof puter.ai.chat==="function")) throw new Error("puter yok");
  var res=await puter.ai.chat(prompt,{model:"gpt-4o-mini"});
  return extractText(res);
}
async function callPollinations(prompt){
  var r=await fetch("https://text.pollinations.ai/",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({messages:[{role:"user",content:prompt}],model:"openai"})
  });
  if(!r.ok) throw new Error("poll "+r.status);
  var t=await r.text();
  try{
    var j=JSON.parse(t);
    if(j.choices&&j.choices[0]&&j.choices[0].message) return j.choices[0].message.content||t;
  }catch(e){}
  return t;
}
async function freeAI(userText){
  var prompt=sys(userText);
  var text="";
  try{ text=await callPuter(prompt); }
  catch(e1){ text=await callPollinations(prompt); }
  var parts=splitJson(text);
  var notes=applyActions(parts.actions);
  var out=(parts.talk||"").trim();
  if(notes.length) out=(out?out+"\n":"")+notes.join(" \u00b7 ");
  return out||"Tamam.";
}
function looksCommand(t){
  t=(t||"").toLocaleLowerCase("tr");
  return /\b(hs|hafta|mesai|yol|izin|yillik|prim|kaydet|cek|pdf|csv|ekle|sil|toplam|ozet|rapor|devam|ceza|dagilim|yardim|sifirla)\b/.test(t);
}
window.freeAI=freeAI;
window.looksCommand=looksCommand;
})();
