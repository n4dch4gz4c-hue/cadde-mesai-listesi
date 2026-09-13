(function(){
var STOP=/^(ve|ile|icin|olan|kisi|kurye|adet|saat|gun|tl|lira|tutar|yaz|yap|et|ver|ko[yY]|ata|guncelle|degistir|ayarla)$/;
var ACT=/^(sil|ekle|kaydet|cek|yenile|toplam|ozet|rapor|liste|kurye|yardim|hs|hafta|mesai|yol|izin|yillik|prim|devam|ceza)$/;
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
function line(p){
  p=state.people.filter(function(x){return x.id===p.id;})[0]||p;
  var c=calc(p);
  return "<b>"+p.name+"</b><br>mesai "+dash(c.mesai)+" · HS "+dash(c.hs)+" · yol "+dash(c.yol)+" · izin "+dash(c.izin)+" · toplam <b>"+tl(c.toplam)+"</b>";
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
      if(pn===st||pn.indexOf(st)===0||st.indexOf(pn)===0) s+=pn.length;
    });
  });
  return s;
}
function pick(tokens, raw){
  var best=null,bestS=0;
  state.people.forEach(function(p){
    var s=scoreName(p,tokens);
    if(norm(raw).indexOf(norm(p.name))>=0) s+=20;
    if(s>bestS){bestS=s;best=p;}
  });
  return bestS>=3?best:null;
}
function nums(text){
  var out=[];
  String(text).replace(",",".").replace(/-?\d+(?:\.\d+)?/g,function(n){out.push(parseFloat(n));return n;});
  return out;
}
function delPerson(p){
  if(!p){reply("Kimi sileyim?");return;}
  state.people=state.people.filter(function(x){return x.id!==p.id;});
  persist();renderAll();
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
  if(state.people.length!==n0){persist();renderAll();return n0-state.people.length;}
  return 0;
}
function runAssist(raw){
  var t=norm(raw);
  var tokens=t.split(" ").filter(Boolean);
  var nlist=nums(t);
  var n=nlist.length?nlist[nlist.length-1]:null;

  if(/yardim|ne yap|komut/.test(t)){
    reply("Ornekler<br>• Semih yol 1200<br>• Aydin HS 2<br>• Hakan mesai 7<br>• Ali Veli ekle<br>• Semih E Adet Yol sil<br>• kaydet / cek / toplam");
    return;
  }
  if(/^(kaydet|sunucuya kaydet|yaz)$/.test(t)||(t.indexOf("kaydet")>=0&&t.indexOf("anahtar")<0)){
    if(typeof save==="function") save();
    reply("Sunucuya kaydediyorum."); return;
  }
  if(/cek|yenile|sunucudan/.test(t)){
    if(typeof yenileSunucu==="function") yenileSunucu();
    reply("Sunucudan cekiyorum."); return;
  }
  if(/^toplam|kasa|genel toplam/.test(t)){
    var s=(typeof sums==="function")?sums():{pay:state.people.filter(function(p){return calc(p).toplam>0;}),toplam:state.people.reduce(function(a,p){return a+calc(p).toplam;},0)};
    reply((s.pay.length||0)+" kisi · <b>"+(typeof tl==="function"?tl(s.toplam):s.toplam)+" TL</b>"); return;
  }
  if(/\bozet\b/.test(t)){goTab("ozet");reply("Ozet acildi.");return;}
  if(/rapor/.test(t)){goTab("rapor"); if(typeof renderRapor==="function") renderRapor(); reply("Rapor acildi.");return;}

  if(/temizle|cop sil|hatali/.test(t)){
    var k=cleanJunk();
    reply(k?k+" hatali kayit silindi.":"Hatali kayit yok."); return;
  }

  var wantDel=/\bsil\b|kaldir|cikar/.test(t);
  var wantAdd=/\bekle\b/.test(t);
  var p=pick(tokens,t);

  if(wantDel){
    if(!p && /adet|yol|semih e/.test(t)){
      var junk=state.people.filter(function(x){return /ADET|SEM[Iİ]H E /.test((x.name||"").toLocaleUpperCase("tr"));});
      if(junk.length){junk.forEach(delPerson);return;}
    }
    delPerson(p); return;
  }

  if(wantAdd){
    var name=tokens.filter(function(w){
      w=stem(w);
      return w.length>1 && !STOP.test(w) && !ACT.test(w) && !/^\d/.test(w);
    }).join(" ").toLocaleUpperCase("tr");
    if(name.length<3){reply("Isim eksik. Ornek: Can Yildiz ekle");return;}
    if(state.people.some(function(x){return norm(x.name)===norm(name);})){
      reply(name+" zaten var."); return;
    }
    state.people.push(hydratePerson({id:nid(),name:name,kurye:/kurye/.test(t),mesaiBirim:300}));
    persist();renderAll();
    reply(name+" eklendi."); return;
  }

  if(p && (/\bhs\b|hafta/.test(t))){
    setVal(p.id,"hsSaat",n==null?1:n); reply(line(p)); return;
  }
  if(p && /mesai/.test(t)){
    setVal(p.id,"mesaiSaat",n==null?1:n); reply(line(p)); return;
  }
  if(p && /yol/.test(t)){
    setVal(p.id,"yolTutar",n==null?0:n); reply(line(p)); return;
  }
  if(p && /yillik/.test(t)){
    setVal(p.id,"yillikTutar",n==null?0:n); reply(line(p)); return;
  }
  if(p && /izin/.test(t)){
    if(/gun/.test(t)) setVal(p.id,"izinGun",nlist[0]||0);
    if((nlist[1]||n||0)>=50) setVal(p.id,"izinTutar",nlist[1]||n);
    reply(line(p)); return;
  }
  if(p && /prim/.test(t)){
    setVal(p.id,"primAdet",n==null?0:n); reply(line(p)); return;
  }
  if(p){reply(line(p));return;}
  reply("Anlamadim. Isim + islem yaz.<br>Semih yol 0<br>Aydin HS 2<br>hatali kayit sil");
}
function sendAssist(){
  var inp=document.getElementById("asIn");
  var t=(inp&&inp.value||"").trim();
  if(!t)return;
  inp.value="";
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
function bindAssist(){
  var fab=document.getElementById("asFab");
  var form=document.getElementById("asForm");
  if(fab) fab.onclick=toggleAs;
  if(form) form.addEventListener("submit",function(e){e.preventDefault();sendAssist();});
  var k=cleanJunk();
  if(k) reply(k+" hatali isim kaydi temizlendi (Adet/Yol).");
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",bindAssist);
else bindAssist();
window.sendAssist=sendAssist;
window.runAssist=runAssist;
window.toggleAs=toggleAs;
})();
