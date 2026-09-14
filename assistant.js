(function(){
var STOP=/^(ve|ile|icin|olan|kisi|kurye|adet|saat|gun|tl|lira|tutar|yaz|yap|et|ver|ko[yY]|ata|guncelle|degistir|ayarla|ne|kadar|kac|kim|bana|onu|bunu|su|da|de|bu|adam|kadin)$/;
var ACT=/^(sil|ekle|kaydet|cek|yenile|toplam|ozet|rapor|liste|kurye|yardim|hs|hafta|mesai|yol|izin|yillik|prim|devam|ceza|pdf|csv|temizle|sifirla)$/;
var lastPerson=null;
var pendingDel=null;
function norm(s){
  return (s||"").toString().toLocaleLowerCase("tr").replace(/['\u2019]/g,"").replace(/\s+/g," ").trim();
}
function stem(w){
  w=norm(w);
  w=w.replace(/(?:ndan|nden|dan|den|nun|n[u\u00fc]n|nin|n[i\u0131]n|lar|ler)$/,"");
  w=w.replace(/(?:ya|ye|na|ne|[eEaA])$/,"");
  return w;
}
function nid(){ return state.people.reduce(function(m,p){return Math.max(m,p.id||0);},0)+1; }
function findP(id){ return state.people.filter(function(x){return x.id===id;})[0]; }
function line(p){
  p=findP(p.id)||p; var c=calc(p);
  return "<b>"+p.name+"</b>"+(p.kurye?" <small>KURYE</small>":"")+
    "<br>mesai "+(p.mesaiSaat||0)+"s / "+dash(c.mesai)+
    " \u00b7 HS "+(p.hsSaat||0)+" / "+dash(c.hs)+
    " \u00b7 yol "+dash(c.yol)+
    " \u00b7 izin "+(p.izinGun||0)+"g / "+dash(c.izin)+
    (c.yillik?" \u00b7 yillik "+dash(c.yillik):"")+
    (c.prim?" \u00b7 prim "+dash(c.prim):"")+
    "<br>toplam <b>"+tl(c.toplam)+" TL</b>";
}
function reply(html){
  var box=document.getElementById("asMsgs"); if(!box)return;
  var d=document.createElement("div"); d.className="as-bot"; d.innerHTML=html;
  box.appendChild(d); box.scrollTop=box.scrollHeight;
}
function sayUser(t){
  var box=document.getElementById("asMsgs"); if(!box)return;
  var d=document.createElement("div"); d.className="as-me"; d.textContent=t;
  box.appendChild(d);
}
function goTab(id){
  var el=document.querySelector('.tab[data-tab="'+id+'"]');
  if(el&&typeof tab==="function") tab(el);
}
function scoreName(person, tokens){
  var parts=norm(person.name).split(" "); var s=0;
  tokens.forEach(function(t){
    var st=stem(t);
    if(st.length<2||STOP.test(st)||ACT.test(st)||/^\d/.test(st)) return;
    parts.forEach(function(pn){
      if(pn===st) s+=pn.length*4;
      else if(pn.indexOf(st)===0||st.indexOf(pn)===0) s+=pn.length;
    });
  });
  return s;
}
function pick(tokens, raw){
  var best=null,bestS=0,second=0;
  state.people.forEach(function(p){
    var s=scoreName(p,tokens);
    if(norm(raw).indexOf(norm(p.name))>=0) s+=40;
    if(s>bestS){second=bestS;bestS=s;best=p;} else if(s>second) second=s;
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
function persistAll(){ persist(); if(typeof renderAll==="function") renderAll(); else if(typeof renderListe==="function") renderListe(); }
function getSums(){
  if(typeof sums==="function") return sums();
  var all=state.people.map(function(p){return {p:p,c:calc(p)};});
  var pay=all.filter(function(x){return x.c.toplam>0;});
  var add=function(k){return all.reduce(function(a,x){return a+x.c[k];},0);};
  return {all:all,pay:pay,toplam:add("toplam"),mesai:add("mesai"),hs:add("hs"),prim:add("prim"),yol:add("yol"),izin:add("izin"),yillik:add("yillik"),dis:add("dis")};
}
function delPerson(p){
  if(!p){reply("Kimi sileyim? Isim yaz.");return;}
  pendingDel=p;
  reply(p.name+" silinsin mi? <b>evet</b> / <b>hayir</b>");
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
    if(/^SEM[I\u0130]H E /.test(n)) return false;
    if(/\bYOL\b/.test(n) && n.split(" ").length>3) return false;
    return true;
  });
  if(state.people.length!==n0){persistAll();return n0-state.people.length;}
  return 0;
}
function topPay(n){
  return getSums().all.filter(function(x){return x.c.toplam>0;}).sort(function(a,b){return b.c.toplam-a.c.toplam;}).slice(0,n||8);
}
function zeroPay(){
  return getSums().all.filter(function(x){return !x.c.toplam;}).map(function(x){return x.p;});
}
function resetPerson(p){
  ["mesaiSaat","hsSaat","yolTutar","izinGun","izinTutar","yillikTutar","primAdet","disiplinDk"].forEach(function(f){
    if(f==="primAdet"){p.primAdet=0;} else setVal(p.id,f,0);
  });
  persistAll();
}
function parseFields(t,nlist){
  var out=[];
  function takeNear(re, defSmall){
    var m=t.match(re); if(!m) return null;
    var chunk=m[0];
    var local=nums(chunk);
    if(local.length) return local[local.length-1];
    return defSmall;
  }
  if(/\bhs\b|hafta\s*son/.test(t)) out.push(["hsSaat", takeNear(/(?:hs|hafta\s*sonu?)\D{0,8}-?\d+(?:\.\d+)?|-?\d+(?:\.\d+)?\D{0,8}(?:hs|hafta)/, nlist[0]!=null?nlist[0]:1)]);
  if(/mesai/.test(t)) out.push(["mesaiSaat", takeNear(/mesai\D{0,8}-?\d+(?:\.\d+)?|-?\d+(?:\.\d+)?\D{0,6}mesai/, nlist[0]!=null?nlist[0]:1)]);
  if(/\byol\b/.test(t)) out.push(["yolTutar", takeNear(/yol\D{0,8}-?\d+(?:\.\d+)?|-?\d+(?:\.\d+)?\D{0,6}yol/, nlist.filter(function(x){return x>=50;})[0]||nlist[0]||0)]);
  if(/yillik/.test(t)) out.push(["yillikTutar", takeNear(/yillik\D{0,8}-?\d+(?:\.\d+)?/, nlist.filter(function(x){return x>=50;})[0]||0)]);
  if(/prim/.test(t)) out.push(["primAdet", takeNear(/prim\D{0,8}-?\d+(?:\.\d+)?/, nlist[0]!=null?nlist[0]:0)]);
  if(/disiplin/.test(t)) out.push(["disiplinDk", takeNear(/disiplin\D{0,8}-?\d+(?:\.\d+)?/, nlist[0]!=null?nlist[0]:0)]);
  if(/izin/.test(t)){
    var g=takeNear(/izin[^0-9]{0,10}\d+(?:\.\d+)?\s*gun|\d+(?:\.\d+)?\s*gun/, null);
    var money=nlist.filter(function(x){return x>=50;})[0];
    if(g!=null) out.push(["izinGun", g]);
    else if(nlist[0]!=null && nlist[0]<50) out.push(["izinGun", nlist[0]]);
    if(money!=null) out.push(["izinTutar", money]);
  }
  return out;
}
function help(){
  reply(
    "<b>Cadde Asistan</b> \u00b7 ucretsiz, cevrimdisi<br>"+
    "\u2022 Aydin HS 2 mesai 3<br>"+
    "\u2022 Semih yol 0<br>"+
    "\u2022 Hasan izin 2 gun 5800<br>"+
    "\u2022 Ali Veli kurye ekle<br>"+
    "\u2022 Ahmet sifirla<br>"+
    "\u2022 Mehmet devam 1 gecikti<br>"+
    "\u2022 toplam / dagilim / kim alacak / odeme yok<br>"+
    "\u2022 kaydet / cek / pdf"
  );
}
function applyField(p, field, n){
  if(n==null) n=(field.indexOf("Tutar")>=0||field==="primAdet"||field==="disiplinDk")?0:1;
  if(field==="primAdet"){ p.primAdet=n; persistAll(); }
  else setVal(p.id, field, n);
  lastPerson=p;
}
function splitCmds(raw){
  return String(raw).split(/\s*(?:;| ve sonra | sonra ,)\s+/i).map(function(s){return s.trim();}).filter(Boolean);
}
function runOne(raw){
  var t=norm(raw);
  var tokens=t.split(" ").filter(Boolean);
  var nlist=nums(t);
  var n=nlist.length?nlist[nlist.length-1]:null;

  if(pendingDel){
    if(/^(evet|sil|ok|tamam|onay)$/.test(t)){ var pd=pendingDel; pendingDel=null; doDel(pd); return; }
    if(/^(hayir|iptal|vazgec)$/.test(t)){ pendingDel=null; reply("Silinmedi."); return; }
    pendingDel=null;
  }
  if(/yardim|ne yap|komut|nasil/.test(t)){ help(); return; }
  if(/^(kaydet|sunucuya kaydet|yaz)$/.test(t)||(/kaydet/.test(t)&&!/anahtar|sil/.test(t))){
    if(typeof save==="function") save(); reply("Kaydediyorum."); return;
  }
  if(/\bcek\b|yenile|sunucudan/.test(t)){
    if(typeof yenileSunucu==="function") yenileSunucu(); reply("Sunucudan cekiyorum."); return;
  }
  if(/\bpdf\b/.test(t)){ if(typeof sharePDF==="function") sharePDF(); reply("PDF hazirlaniyor."); return; }
  if(/\bcsv\b/.test(t)){ if(typeof exportCSV==="function") exportCSV(); reply("CSV indirildi."); return; }

  if(/dagilim|kalem/.test(t) || (/toplam/.test(t)&&/ayrinti|detay/.test(t))){
    var s=getSums();
    reply(
      s.pay.length+" kisi odeme \u00b7 <b>"+tl(s.toplam)+" TL</b><br>"+
      "HS "+tl(s.hs)+" \u00b7 mesai "+tl(s.mesai)+" \u00b7 yol "+tl(s.yol)+"<br>"+
      "izin "+tl(s.izin)+" \u00b7 yillik "+tl(s.yillik)+" \u00b7 prim "+tl(s.prim)
    ); return;
  }
  if(/^toplam|kasa|genel toplam|ne kadar odenecek|kac para/.test(t)){
    var s=getSums();
    reply(s.pay.length+" kisi odeme alacak \u00b7 <b>"+tl(s.toplam)+" TL</b>"); return;
  }
  if(/kac kisi|kadrosu|personel say/.test(t)){
    reply(state.people.length+" kisi kayitli \u00b7 "+getSums().pay.length+" odeme var."); return;
  }
  if(/kim alacak|odeme list|odemesi olan/.test(t)){
    var top=topPay(20);
    if(!top.length){reply("Odemesi olan yok.");return;}
    reply(top.map(function(x){return x.p.name+" \u00b7 <b>"+tl(x.c.toplam)+"</b>";}).join("<br>")); return;
  }
  if(/odeme yok|sifir olan|bos kayit/.test(t)){
    var z=zeroPay();
    reply(z.length? (z.length+" kiside odeme yok:<br>"+z.slice(0,25).map(function(p){return p.name;}).join(", ")) : "Hepsinin odemesi var."); return;
  }
  if(/en cok|sirala|ilk 5/.test(t)){
    var top=topPay(5);
    reply("En yuksek 5<br>"+top.map(function(x,i){return (i+1)+". "+x.p.name+" \u00b7 "+tl(x.c.toplam);}).join("<br>")); return;
  }
  if(/\bozet\b/.test(t)){goTab("ozet");reply("Ozet acildi.");return;}
  if(/rapor/.test(t)){goTab("rapor"); if(typeof renderRapor==="function") renderRapor(); reply("Rapor acildi.");return;}
  if(/\bliste\b/.test(t)&&!/odeme/.test(t)){goTab("liste");reply("Liste.");return;}
  if(/\bkurye\b/.test(t)&&!/ekle/.test(t)&&!pick(tokens,t)){goTab("kurye");reply("Kurye sekmesi.");return;}
  if(/temizle|cop sil|hatali/.test(t)&&!pick(tokens,t)){
    var k=cleanJunk(); reply(k?k+" hatali kayit silindi.":"Hatali kayit yok."); return;
  }

  var wantDel=/\bsil\b|kaldir|cikar/.test(t);
  var wantAdd=/\bekle\b/.test(t);
  var p=pick(tokens,t) || (/\bonu\b|\bbunu\b|aynisi|ayni kisi|bu adam/.test(t)?lastPerson:null);

  if(wantDel){
    if(!p && /adet|yol|semih e/.test(t)){
      var junk=state.people.filter(function(x){return /ADET|SEM[I\u0130]H E /.test((x.name||"").toLocaleUpperCase("tr"));});
      if(junk.length){junk.forEach(doDel);return;}
    }
    delPerson(p); return;
  }
  if(wantAdd && !/devam|ceza|hs|mesai|yol|izin|prim/.test(t)){
    var name=tokens.filter(function(w){
      w=stem(w); return w.length>1 && !STOP.test(w) && !ACT.test(w) && !/^\d/.test(w);
    }).join(" ").toLocaleUpperCase("tr");
    if(name.length<3){reply("Isim eksik. Ornek: Can Yildiz ekle");return;}
    if(state.people.some(function(x){return norm(x.name)===norm(name);})){ reply(name+" zaten var."); return; }
    var np=hydratePerson({id:nid(),name:name,kurye:/kurye/.test(t),mesaiBirim:300});
    state.people.push(np); persistAll(); lastPerson=np;
    reply(name+" eklendi."+(/kurye/.test(t)?" Kurye.":"")); return;
  }
  if(/devam/.test(t)){
    if(!p){reply("Kimin devamsizligi?");return;}
    var gun=nlist[0]||1;
    var note=tokens.filter(function(w){ return !STOP.test(stem(w)) && !ACT.test(stem(w)) && !/^\d/.test(w) && norm(p.name).indexOf(stem(w))<0; }).join(" ");
    if(!state.devamsizlik) state.devamsizlik=[];
    if(typeof compactDevam==="function") compactDevam();
    var ex=(state.devamsizlik||[]).find(function(d){return norm(d.kisi)===norm(p.name);});
    if(ex){ex.gun=(ex.gun||0)+gun; if(note) ex.not=ex.not?(ex.not+" \u00b7 "+note):note;}
    else state.devamsizlik.push({kisi:p.name,gun:gun,not:note||""});
    persistAll(); lastPerson=p; goTab("devam");
    reply(p.name+" \u00b7 devam +"+gun+(note?" \u00b7 "+note:"")); return;
  }
  if(/ceza/.test(t)){
    if(!p){reply("Kime ceza?");return;}
    var tutar=nlist.filter(function(x){return x>=50;})[0]||n||1000;
    var neden=tokens.filter(function(w){ return !STOP.test(stem(w)) && !ACT.test(stem(w)) && !/^\d/.test(w) && norm(p.name).indexOf(stem(w))<0; }).join(" ");
    if(!state.cezalar) state.cezalar=[];
    state.cezalar.push({kisi:p.name,tutar:tutar,neden:neden||""}); persistAll(); lastPerson=p; goTab("ceza");
    reply(p.name+" \u00b7 ceza "+tl(tutar)+" TL"+(neden?" \u00b7 "+neden:"")); return;
  }
  if(p && /sifirla|sifir et|hepsini sil/.test(t)){
    resetPerson(p); reply(p.name+" kalemleri sifirlandi.<br>"+line(p)); return;
  }
  if(p){
    var fields=parseFields(t,nlist);
    if(fields.length){
      fields.forEach(function(f){ applyField(p,f[0],f[1]); });
      reply(line(p)); return;
    }
    lastPerson=p; reply(line(p)); return;
  }
  if(lastPerson && n!=null){
    reply("Kimi? Son kisi: <b>"+lastPerson.name+"</b><br>Ornek: "+lastPerson.name.split(" ")[0]+" HS "+n);
    return;
  }
  reply("Anlamadim. Isim + islem yaz.<br>Aydin HS 2 mesai 3 \u00b7 toplam \u00b7 yardim");
}
function runAssist(raw){
  var parts=splitCmds(raw);
  if(parts.length>1){ parts.forEach(function(part,i){ if(i) sayUser(part); runOne(part); }); return; }
  runOne(raw);
}
function sendAssist(preset){
  var inp=document.getElementById("asIn");
  var t=(preset!=null?preset:(inp&&inp.value||"")).trim();
  if(!t)return;
  if(inp) inp.value="";
  sayUser(t);
  try{runAssist(t);}catch(e){reply("Hata: "+e.message);}
}
function toggleAs(){
  var p=document.getElementById("asPanel"); if(!p)return;
  p.classList.toggle("hide");
  if(!p.classList.contains("hide")){ var i=document.getElementById("asIn"); if(i)i.focus(); }
}
function bindAssist(){
  var fab=document.getElementById("asFab");
  var form=document.getElementById("asForm");
  if(fab) fab.onclick=toggleAs;
  if(form) form.addEventListener("submit",function(e){e.preventDefault();sendAssist();});
  var chips=document.getElementById("asChips");
  if(chips) chips.onclick=function(e){ var b=e.target.closest("[data-cmd]"); if(b) sendAssist(b.getAttribute("data-cmd")); };
  var k=cleanJunk(); if(k) reply(k+" hatali isim temizlendi.");
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",bindAssist);
else bindAssist();
window.sendAssist=sendAssist; window.runAssist=runAssist; window.toggleAs=toggleAs;
})();
