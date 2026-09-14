(function(){
  function isSemih(n){
    n=String(n||"").toLocaleUpperCase("tr-TR");
    return n.indexOf("SEMİH SOFUOĞLU")>=0 || n.indexOf("SEMIH SOFUOGLU")>=0;
  }
  function isD(n){
    n=String(n||"").toLocaleUpperCase("tr-TR");
    return n.indexOf("KAAN ATASOY")>=0 || n.indexOf("MÜMİN")>=0 || n.indexOf("MUMIN")>=0;
  }
  function mapIzin(mesaiBirim,name){
    if(isSemih(name)) return 2900;
    if(isD(name)) return 1900;
    var m=num(mesaiBirim,300);
    if(m>=320) return 2900;
    if(m>=300) return 2700;
    if(m>=250) return 2400;
    return 1900;
  }
  function patchPerson(p){
    if(!p) return p;
    if(isSemih(p.name)){
      p.mesaiBirim=320;
      p.izinBirim=2900;
    }else if(isD(p.name)){
      p.mesaiBirim=220;
      p.izinBirim=1900;
    }else if(!num(p.izinBirim,0)){
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
  window.calc=function(p){
    p=hydratePerson(p);
    var mesai=p.mesaiSaat*p.mesaiBirim;
    var hs=p.hsSaat*HS_BIRIM;
    var prim=p.kurye?p.primAdet*PRIM_BIRIM:0;
    var yol=p.yolTutar||(p.yolGun*p.yolBirim);
    var dis=p.disiplinDk*DIS_BIRIM;
    var izin=p.izinGun*p.izinBirim;
    return {mesai:mesai,hs:hs,prim:prim,yol:yol,izin:izin,yillik:p.yillikTutar,dis:dis,toplam:mesai+hs+prim+yol+izin+p.yillikTutar+dis};
  };
  var oldSet=typeof setVal==="function"?setVal:null;
  window.setVal=function(id,field,val){
    var p=state.people.find(function(x){return x.id===id;});
    if(!p) return;
    patchPerson(p);
    if(oldSet && field!=="izinTutar") oldSet(id,field,val);
    p=state.people.find(function(x){return x.id===id;});
    patchPerson(p);
    if(field==="izinGun"){
      p.izinGun=num(val,0);
      p.izinTutar=p.izinGun*p.izinBirim;
    }
    persist();
    if(typeof renderListe==="function") renderListe();
  };
  function lockIzinInputs(){
    var rows=document.querySelectorAll("#tbody tr");
    rows.forEach(function(tr){
      var tds=tr.querySelectorAll("td");
      if(tds.length<10) return;
      var inp=tds[9].querySelector("input");
      if(inp){
        var idInp=tds[8].querySelector("input");
        var gun=idInp?num(idInp.value,0):0;
        var name=(tds[1].textContent||"");
        var person=state.people.find(function(x){return name.indexOf(x.name)===0;});
        var birim=person?person.izinBirim:0;
        tds[9].textContent=dash(gun*birim);
      }
    });
  }
  var tries=0;
  function hook(){
    if(typeof renderListe!=="function"){
      if(tries++<40) setTimeout(hook,100);
      return;
    }
    if(!renderListe._izinHook){
      var old=renderListe;
      window.renderListe=function(){
        old();
        if(Array.isArray(state&&state.people)) state.people.forEach(patchPerson);
        lockIzinInputs();
      };
      renderListe._izinHook=true;
    }
    if(Array.isArray(state&&state.people)){
      state.people.forEach(patchPerson);
      persist();
    }
    renderListe();
  }
  hook();
})();
