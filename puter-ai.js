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
  });
  return notes;
}
function sys(user){
  var b=brief();
  return "Sen Cadde Mesai Listesi asistanisin. Turkce kisa cevap ver. Giris isteme. "+
    "HS x 2500, mesai saat x 300, yol TL, kurye prim x 7. "+
    "Ozet: "+b.kisi+" kisi, "+b.odeme+" odeme, "+b.genel+" TL. "+
    "Kadro: "+JSON.stringify(b.people)+". "+
    "Degisiklik varsa EN SONA JSON yaz: {\"actions\":[{\"op\":\"set\",\"name\":\"AYDIN\",\"field\":\"hsSaat\",\"value\":2}]} "+
    "field=mesaiSaat|hsSaat|yolTutar|izinGun|izinTutar|yillikTutar|primAdet|disiplinDk. "+
    "Kullanici: "+user;
}
function extract(t){
  if(!t) return "";
  try{
    var j=JSON.parse(t);
    if(j.choices&&j.choices[0]&&j.choices[0].message) return j.choices[0].message.content||"";
    if(typeof j.content==="string") return j.content;
  }catch(e){}
  return String(t);
}
function splitJson(text){
  var raw=String(text||"");
  var i=raw.lastIndexOf('{\"actions\"');
  var talk=raw, acts=[];
  if(i>=0){
    talk=raw.slice(0,i).trim();
    var chunk=raw.slice(i);
    var end=chunk.lastIndexOf("}");
    if(end>=0) chunk=chunk.slice(0,end+1);
    try{ acts=(JSON.parse(chunk).actions)||[]; }catch(e){}
  }
  return {talk:talk, actions:acts};
}
async function postJSON(url, body){
  var r=await fetch(url,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
  if(!r.ok) throw new Error("http "+r.status);
  return extract(await r.text());
}
async function freeAI(userText){
  var prompt=sys(userText);
  var msgs=[{role:"user",content:prompt}];
  var text="";
  var errs=[];
  var tries=[
    function(){return postJSON("https://text.pollinations.ai/openai",{model:"openai-fast",messages:msgs});},
    function(){return postJSON("https://text.pollinations.ai/",{model:"openai",messages:msgs});},
    function(){return postJSON("https://keylessai.thryx.workers.dev/v1/chat/completions",{model:"openai-fast",messages:msgs});}
  ];
  for(var i=0;i<tries.length;i++){
    try{ text=await tries[i](); if(text&&text.trim()) break; }catch(e){ errs.push(String(e.message||e)); }
  }
  if(!text) throw new Error(errs.join(" / ")||"AI yok");
  var parts=splitJson(text);
  var notes=applyActions(parts.actions);
  var out=(parts.talk||"").trim();
  if(notes.length) out=(out?out+"\n":"")+notes.join(" · ");
  return out||"Tamam.";
}
function looksCommand(t){
  t=(t||"").toLocaleLowerCase("tr");
  var ask=/\?|kim|kimler|hangi|ne kadar|en cok|alacak|aliyor|listele|goster/.test(t);
  var write=/\b(kaydet|cek|pdf|csv|ekle|sil|sifirla)\b/.test(t);
  var personField=/\b(hs|hafta|mesai|yol|izin|yillik|prim)\b/.test(t) && /\d/.test(t) && !ask;
  var simple=/^(toplam|ozet|rapor|dagilim|yardim)$/.test(t.trim());
  return write || personField || simple;
}
window.freeAI=freeAI;
window.looksCommand=looksCommand;
})();
