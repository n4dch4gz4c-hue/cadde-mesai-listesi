(function(){
  function mapIzin(mesaiBirim,name){
    var n=String(name||"").toLocaleUpperCase("tr-TR");
    if(n.indexOf("KAAN ATASOY")>=0 || n.indexOf("MÜMİN")>=0 || n.indexOf("MUMIN")>=0) return 1900;
    var m=num(mesaiBirim,300);
    if(m>=320) return 2900;
    if(m>=300) return 2700;
    if(m>=250) return 2400;
    return 1900;
  }
  function patchPerson(p){
    if(!p) return p;
    var n=String(p.name||"").toLocaleUpperCase("tr-TR");
    if(n.indexOf("KAAN ATASOY")>=0 || n.indexOf("MÜMİN")>=0 || n.indexOf("MUMIN")>=0){
      p.mesaiBirim=220;
      p.izinBirim=1900;
    }else if(!p.izinBirim){
      p.izinBirim=mapIzin(p.mesaiBirim,p.name);
    }
    p.izinGun=num(p.izinGun,0);
    p.izinTutar=p.izinGun*num(p.izinBirim,0);
    return p;
  }
  var oldHyd=typeof hydratePerson==="function"?hydratePerson:null;
  window.hydratePerson=function(p){
    p=oldHyd?oldHyd(p):(p||{});
    return patchPerson(p);
  };
  var oldCalc=typeof calc==="function"?calc:null;
  window.calc=function(p){
    p=hydratePerson(p);
    var c=oldCalc?oldCalc(p):{};
    c.izin=p.izinGun*p.izinBirim;
    c.mesai=p.mesaiSaat*p.mesaiBirim;
    c.hs=p.hsSaat*HS_BIRIM;
    c.prim=p.kurye?p.primAdet*PRIM_BIRIM:0;
    c.yol=p.yolTutar||(p.yolGun*p.yolBirim);
    c.yillik=p.yillikTutar;
    c.dis=p.disiplinDk*DIS_BIRIM;
    c.toplam=c.mesai+c.hs+c.prim+c.yol+c.izin+c.yillik+c.dis;
    return c;
  };
  var oldSet=typeof setVal==="function"?setVal:null;
  window.setVal=function(id,field,val){
    if(oldSet) oldSet(id,field,val);
    var p=state.people.find(function(x){return x.id===id;});
    if(!p) return;
    patchPerson(p);
    if(field==="izinGun"){
      p.izinGun=num(val,0);
      p.izinTutar=p.izinGun*p.izinBirim;
    }
    persist();
    if(typeof renderListe==="function") renderListe();
  };
  if(Array.isArray(state&&state.people)){
    state.people.forEach(patchPerson);
    persist();
  }
})();
