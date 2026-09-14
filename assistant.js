(function(){
var STOP=/^(ve|ile|icin|olan|kisi|kurye|adet|saat|gun|tl|lira|tutar|yaz|yap|et|ver|ko[yY]|ata|guncelle|degistir|ayarla|ne|kadar|kac|kim|bana|onu|bunu|su)$/;
var ACT=/^(sil|ekle|kaydet|cek|yenile|toplam|ozet|rapor|liste|kurye|yardim|hs|hafta|mesai|yol|izin|yillik|prim|devam|ceza|pdf|csv|temizle)$/;
var lastPerson=null;
var pendingDel=null;
function norm(s){
  return (s||"").toString().toLocaleLowerCase("tr")
    .replace(/['’]/g,"")
    .replace(/\s+/g," ").trim();
}
function stem(w){
  w=norm(w);
  w=w.replace(/(?:ndan|nden|dan|den|nun|n[uü]n|nin|n[iı]n|lar|ler)$/,"");
  w=w.replace(/(?:ya|ye|na|ne|[eEaA])$/,"");
  return w;
}
function nid(){
  return state.people.reduce(function(m,p){return Math.max(m,p.id||0);},0)+1;
}
function findP(id){
  return state.people.filter(function(x){return x.id===id;})[0];
}
function line(p){
  p=findP(p.id)||p;
  var c=calc(p);
  return "<b>"+p.name+"</b><br>mesai "+dash(c.mesai)+" · HS "+dash(c.hs)+" · yol "+dash(c.yol)+" · izin "+dash(c.izin)+
    (c.yillik?" · yillik "+dash(c.yillik):"")+
    (c.prim?" · prim "+dash(c.prim):"")+
    " · toplam <b>"+tl(c.toplam)+"</b>";
}
function reply(html){
  var box=document.getElementById("asMsgs"); if(!box)return;
  var d=document.createElement("div"); d.className="as-bot"; d.innerHTML=html;
  box.appendChild(d); box.scrollTop=box.scrollHeight;
}
function sayUser(t){
  var box=document.getElementById("asMsgs");
  var d=document.createElement("div"); d.className="as-me"; d.textContent=t;
  box.appendChild(d);
}
function goTab(id){
  var el=document.querySelector('.tab[data-tab="'+id+'"]');
  if(el&&typeof tab==="function") tab(el);
}
function scoreName(person, tokens){
  var parts=norm(person.name).split(" ");
  var s=0;
  tokens.forEach(function(t){
    var st=stem(t);
    if(st.length<2||STOP.test(st)||ACT.test(st)||/^\d/.test(st)) return;
    parts.forEach(function(pn){
      if(pn===st) s+=pn.length*3;
      else if(pn.indexOf(st)===0||st.indexOf(pn)===0) s+=pn.length;
    });
  });
  return s;
}
function pick(tokens, raw){
  var best=null,bestS=0,second=0;
  state.people.forEach(function(p){
    var s=scoreName(p,tokens);
    if(norm(raw).indexOf(norm(p.name))>=0) s+=30;
    if(s>bestS){second=bestS;bestS=s;best=p;}
    else if(s>second) second=s;
  });
  if(bestS>=3 && bestS-second>=2) return best;
  if(bestS>=8) return best;
  return null;
}
function nums(text){
  var out=[];
  String(text).replace(/,/g,".").replace(/-?\d+(?:\.\d+)?/g,function(n){out.push(parseFloat(n));return n;});
  return out;
}
function persistAll(){
  persist();
  if(typeof renderAll==="function") renderAll();
  else if(typeof renderListe==="function") renderListe();
}
function delPerson(p){
  if(!p){reply("Kimi sileyim? Isim yaz.");return;}
  pendingDel=p;
  reply(p.name+" silinsin mi? <b>evet</b> veya <b>hayir</b> yaz.");
}
function doDel(p){
  state.people=state.people.filter(function(x){return x.id!==p.id;});
  persistAll();
  if(lastPerson&&lastPerson.id===p.id) lastPerson=null;
  reply(p.name+" silindi.");
}
function cleanJunk(){
  var n0=state.people.length;
  state.people=state.people.filter(function(p){
    var n=(p.name||"").toLocaleUpperCase("tr");
    if(/ADET/.test(n)) return false;
    if(/^SEM[Iİ]H E /.test(n)) return false;
    if(/\bYOL\b/.test(n) && n.split(" ").length>3) return false;
    return true;
  });
  if(state.people.length!==n0){persistAll();return n0-state.people.length;}
  return 0;
}
function topPay(n){
  n=n||5;
  return state.people.map(function(p){return {p:p,c:calc(p)};})
    .filter(function(x){return x.c.toplam>0;})
    .sort(function(a,b){return b.c.toplam-a.c.toplam;})
    .slice(0,n);
}
function help(){
  reply(
    "<b>Cadde Asistan v2</b><br>"+
    "Örnekler<br>"+
    "• Semih yol 1200<br>"+
    "• Aydin HS 2 mesai 3<br>"+
    "• Hasan izin 2 gun 5800<br>"+
    "• Ali Veli ekle / kurye ekle<br>"+
    "• Ahmet devam 1 gecikti<br>"+
    "• Mehmet ceza 1000 gecikti<br>"+
    "• toplam / odeme / kim alacak<br>"+
    "• kaydet / cek / pdf / csv<br>"+
    "• hatali kayit sil"
  );
}
function applyField(p, field, n){
  if(n==null) n=field==="yolTutar"||field==="izinTutar"||field==="yillikTutar"?0:1;
  setVal(p.id, field, n);
  lastPerson=p;
}
function splitCmds(raw){
  return String(raw).split(/\s*(?:;| ve sonra | sonra )\s+/i).map(function(s){return s.trim();}).filter(Boolean);
}
function runOne(raw){
  var t=norm(raw);
  var tokens=t.split(" ").filter(Boolean);
  var nlist=nums(t);
  var n=nlist.length?nlist[nlist.length-1]:null;

  if(pendingDel){
    if(/^(evet|sil|ok|tamam|onay)$/.test(t)){ var p=pendingDel; pendingDel=null; doDel(p); return; }
    if(/^(hayir|iptal|vazgec)$/.test(t)){ pendingDel=null; reply("Silinmedi."); return; }
    pendingDel=null;
  }

  if(/yardim|ne yap|komut|nasil/.test(t)){ help(); return; }
  if(/^(kaydet|sunucuya kaydet|yaz)$/.test(t)||(t.indexOf("kaydet")>=0&&t.indexOf("anahtar")<0&&t.indexOf("sil")<0)){
    if(typeof save==="function") save();
    reply("Sunucuya kaydediyorum."); return;
  }
  if(/\bcek\b|yenile|sunucudan/.test(t)){
    if(typeof yenileSunucu==="function") yenileSunucu();
    reply("Sunucudan cekiyorum."); return;
  }
  if(/\bpdf\b/.test(t)){
    if(typeof sharePDF==="function") sharePDF();
    reply("PDF hazirlaniyor."); return;
  }
  if(/\bcsv\b/.test(t)){
    if(typeof exportCSV==="function") exportCSV();
    reply("CSV indirildi."); return;
  }
  if(/^toplam|kasa|genel toplam|ne kadar odenecek/.test(t)){
    var s=(typeof sums==="function")?sums():{pay:state.people.filter(function(p){return calc(p).toplam>0;}),toplam:state.people.reduce(function(a,p){return a+calc(p).toplam;},0)};
    reply((s.pay.length||0)+" kisi odeme alacak · <b>"+(typeof tl==="function"?tl(s.toplam):s.toplam)+" TL</b>"); return;
  }
  if(/kim alacak|odeme list|odemesi olan/.test(t)){
    var top=topPay(12);
    if(!top.length){reply("Odemesi olan yok.");return;}
    reply(top.map(function(x){return x.p.name+" · <b>"+tl(x.c.toplam)+"</b>";}).join("<br>")); return;
  }
  if(/en cok|sirala|ilk 5|top /.test(t)){
    var top=topPay(5);
    reply("En yuksek 5<br>"+top.map(function(x,i){return (i+1)+". "+x.p.name+" · "+tl(x.c.toplam);}).join("<br>")); return;
  }
  if(/\bozet\b/.test(t)){goTab("ozet");reply("Ozet acildi.");return;}
  if(/rapor/.test(t)){goTab("rapor"); if(typeof renderRapor==="function") renderRapor(); reply("Rapor acildi.");return;}
  if(/\bliste\b/.test(t) && !/odeme/.test(t)){goTab("liste");reply("Liste.");return;}
  if(/\bkurye\b/.test(t) && !/ekle/.test(t) && !pick(tokens,t)){goTab("kurye");reply("Kurye sekmesi.");return;}

  if(/temizle|cop sil|hatali/.test(t)){
    var k=cleanJunk();
    reply(k?k+" hatali kayit silindi.":"Hatali kayit yok."); return;
  }

  var wantDel=/\bsil\b|kaldir|cikar/.test(t);
  var wantAdd=/\bekle\b/.test(t);
  var p=pick(tokens,t) || (/\bonu\b|\bbunu\b|aynisi|ayni kisi/.test(t)?lastPerson:null);

  if(wantDel){
    if(!p && /adet|yol|semih e/.test(t)){
      var junk=state.people.filter(function(x){return /ADET|SEM[Iİ]H E /.test((x.name||"").toLocaleUpperCase("tr"));});
      if(junk.length){junk.forEach(function(j){doDel(j);});return;}
    }
    delPerson(p); return;
  }

  if(wantAdd && !/devam|ceza/.test(t)){
    var name=tokens.filter(function(w){
      w=stem(w);
      return w.length>1 && !STOP.test(w) && !ACT.test(w) && !/^\d/.test(w);
    }).join(" ").toLocaleUpperCase("tr");
    if(name.length<3){reply("Isim eksik. Ornek: Can Yildiz ekle");return;}
    if(state.people.some(function(x){return norm(x.name)===norm(name);})){
      reply(name+" zaten var."); return;
    }
    var np=hydratePerson({id:nid(),name:name,kurye:/kurye/.test(t),mesaiBirim:300});
    state.people.push(np);
    persistAll();
    lastPerson=np;
    reply(name+" eklendi."+(/kurye/.test(t)?" Kurye isaretli.":"")); return;
  }

  if(/devam/.test(t)){
    if(!p){reply("Kimin devamsizligi? Isim yaz.");return;}
    var gun=nlist[0]||1;
    var note=tokens.filter(function(w){
      return !STOP.test(stem(w)) && !ACT.test(stem(w)) && !/^\d/.test(w) && norm(p.name).indexOf(stem(w))<0;
    }).join(" ");
    if(!state.devamsizlik) state.devamsizlik=[];
    if(typeof compactDevam==="function") compactDevam();
    var ex=(state.devamsizlik||[]).find(function(d){return norm(d.kisi)===norm(p.name);});
    if(ex){ex.gun=(ex.gun||0)+gun; if(note) ex.not=ex.not?(ex.not+" · "+note):note;}
    else state.devamsizlik.push({kisi:p.name,gun:gun,not:note||""});
    persistAll();
    lastPerson=p;
    goTab("devam");
    reply(p.name+" · devam +"+gun+(note?" · "+note:"")); return;
  }

  if(/ceza/.test(t)){
    if(!p){reply("Kime ceza? Isim yaz.");return;}
    var tutar=nlist.filter(function(x){return x>=50;})[0]||n||1000;
    var neden=tokens.filter(function(w){
      return !STOP.test(stem(w)) && !ACT.test(stem(w)) && !/^\d/.test(w) && norm(p.name).indexOf(stem(w))<0;
    }).join(" ");
    if(!state.cezalar) state.cezalar=[];
    state.cezalar.push({kisi:p.name,tutar:tutar,neden:neden||""});
    persistAll();
    lastPerson=p;
    goTab("ceza");
    reply(p.name+" · ceza "+tl(tutar)+" TL"+(neden?" · "+neden:"")); return;
  }

  if(p && (/\bhs\b|hafta/.test(t))){
    applyField(p,"hsSaat", n==null?1:n); reply(line(p)); return;
  }
  if(p && /mesai/.test(t)){
    applyField(p,"mesaiSaat", n==null?1:n); reply(line(p)); return;
  }
  if(p && /yol/.test(t)){
    applyField(p,"yolTutar", n==null?0:n); reply(line(p)); return;
  }
  if(p && /yillik/.test(t)){
    applyField(p,"yillikTutar", n==null?0:n); reply(line(p)); return;
  }
  if(p && /izin/.test(t)){
    if(/gun/.test(t) || (nlist[0]!=null && nlist[0]<50)) setVal(p.id,"izinGun",nlist[0]||0);
    var money=nlist.filter(function(x){return x>=50;})[0];
    if(money!=null) setVal(p.id,"izinTutar",money);
    persistAll();
    lastPerson=p;
    reply(line(p)); return;
  }
  if(p && /prim/.test(t)){
    var pp=findP(p.id);
    if(pp){pp.primAdet=n==null?0:n; persistAll();}
    lastPerson=p;
    reply(line(p)); return;
  }
  if(p && /disiplin/.test(t)){
    applyField(p,"disiplinDk", n==null?0:n); reply(line(p)); return;
  }
  if(p){ lastPerson=p; reply(line(p)); return; }

  if(lastPerson && (n!=null) && /hs|mesai|yol|izin|prim/.test(t)===false){
    reply("Kimi kastediyorsun? Isim yaz.<br>Son kisi: <b>"+lastPerson.name+"</b>");
    return;
  }
  reply("Anlamadim. Isim + islem yaz.<br>Örnek: Semih yol 0 · Aydin HS 2 · yardim");
}
function runAssist(raw){
  var parts=splitCmds(raw);
  if(parts.length>1){
    parts.forEach(function(part,i){
      if(i) sayUser(part);
      runOne(part);
    });
    return;
  }
  runOne(raw);
}
function sendAssist(preset){
  var inp=document.getElementById("asIn");
  var t=(preset!=null?preset:(inp&&inp.value||"")).trim();
  if(!t)return;
  if(inp && preset==null) inp.value="";
  else if(inp && preset!=null) inp.value="";
  sayUser(t);
  try{runAssist(t);}catch(e){reply("Hata: "+e.message);}
}
function toggleAs(){
  var p=document.getElementById("asPanel");
  if(!p)return;
  p.classList.toggle("hide");
  if(!p.classList.contains("hide")){
    var i=document.getElementById("asIn"); if(i)i.focus();
  }
}
function bindChips(){
  var box=document.getElementById("asChips");
  if(!box)return;
  box.onclick=function(e){
    var b=e.target.closest("[data-cmd]");
    if(!b)return;
    sendAssist(b.getAttribute("data-cmd"));
  };
}
function bindAssist(){
  var fab=document.getElementById("asFab");
  var form=document.getElementById("asForm");
  if(fab) fab.onclick=toggleAs;
  if(form) form.addEventListener("submit",function(e){e.preventDefault();sendAssist();});
  bindChips();
  var k=cleanJunk();
  if(k) reply(k+" hatali isim kaydi temizlendi.");
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",bindAssist);
else bindAssist();
window.sendAssist=sendAssist;
window.runAssist=runAssist;
window.toggleAs=toggleAs;
})();
