(function(){
  if(!state||!state.people)return;
  function N(s){return(s||"").toLocaleUpperCase("tr-TR").replace(/\s+/g," ").trim();}
  if(!localStorage.getItem("cadde_pdf_20260911")){
    var HS=["ABDULLAH AVCI","BURHAN BAYAKIR","ERDAL CAVDAR","ERDAL ÇAVDAR","HIKMET ERDOGDU","HİKMET ERDOĞDU","ERHAN SOFUOGLU","ERHAN SOFUOĞLU","BILAL SURUKLI","BİLAL SÜRÜKLİ","UGUR GOKER","UĞUR GÖKER","BEDRETTIN AVCI","BEDRETTİN AVCI","SELAHATTIN AVCI","SELAHATTİN AVCI","CANER AVCI","YILMAZ AVCI","RAMAZAN BAYAKIR","ONUR AVCI","CIHAN AVCI","CİHAN AVCI","MURAT DAGIDIR","MURAT DAĞIDIR","SEYFI CELIK","SEYFİ ÇELİK","FEVZI DOLAK","FEVZİ DOLAK","MUHAMMET SOFUOGLU","MUHAMMET SOFUOĞLU","AYDIN AVCI","CIHAN GENC","CİHAN GENÇ","ABDULLAH DENERI","ABDULLAH DENERİ","HAMIT AKPINAR","HAMİT AKPINAR","SAYIM GUMUS","SAYİM GÜMÜŞ","MUHITTIN OZCELIK","MUHİTTİN ÖZÇELİK","HASAN IPEK","HASAN İPEK","VAHDETTIN AVCI","VAHDETTİN AVCI","ERCAN ALTUN","OSMAN CEYLAN","ABDURRAHMAN OZKAN","ABDURRAHMAN ÖZKAN","MENDERES SOFUOGLU","MENDERES SOFUOĞLU"];
    var MESAI={"AYDIN AVCI":2,"MUHITTIN OZCELIK":4,"MUHİTTİN ÖZÇELİK":4,"ABDURRAHMAN GURKAN":2,"ABDURRAHMAN GÜRKAN":2,"MENDERES SOFUOGLU":2,"MENDERES SOFUOĞLU":2};
    var hsMap={};HS.forEach(function(n){hsMap[N(n)]=2;});
    state.people.forEach(function(p){
      var k=N(p.name);
      if(hsMap[k]){p.hsSaat=2;p.hsVar=true;}
      var mk=Object.keys(MESAI).find(function(x){return N(x)===k;});
      if(mk)p.mesaiSaat=MESAI[mk];
    });
    localStorage.setItem("cadde_pdf_20260911","1");
  }
  if(!localStorage.getItem("cadde_pdf_devam_20260911")){
    if(!state.devamsizlik)state.devamsizlik=[];
    var rows=[
      {kisi:"HAKAN ATMACA",gun:2,not:"Izin donusu ise gelmedi"},
      {kisi:"MUHAMMED HASAN KOÇALAN",gun:1,not:"2 gun raporlu, 1 gun yazilacak"},
      {kisi:"ERHAN SOFUOĞLU",gun:1,not:"Raporlu"}
    ];
    function has(k){return state.devamsizlik.some(function(d){return N(d.kisi)===N(k)||N(d.kisi).indexOf(N(k))>=0||N(k).indexOf(N(d.kisi))>=0;});}
    rows.forEach(function(r){
      var p=state.people.find(function(x){return N(x.name)===N(r.kisi)||N(x.name).indexOf("KOÇALAN")>=0&&N(r.kisi).indexOf("KOÇALAN")>=0;});
      if(p)r.kisi=p.name;
      if(!has(r.kisi))state.devamsizlik.push(r);
    });
    localStorage.setItem("cadde_pdf_devam_20260911","1");
  }
  persist();
  if(typeof renderListe==="function")renderListe();
  if(typeof toast==="function")toast("PDF devamsizlik eklendi");
})();
