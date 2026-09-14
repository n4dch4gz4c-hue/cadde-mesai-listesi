(function(){
var XAI_KEY="cadde_xai_key";
var MODEL="grok-4.6";
var hist=[];
function xaiGet(){
  var inp=document.getElementById("xaiKey");
  if(inp&&inp.value) return inp.value.trim();
  try{return (localStorage.getItem(XAI_KEY)||"").trim();}catch(e){return "";}
}
function xaiSave(k){
  k=(k||xaiGet()||"").trim();
  try{localStorage.setItem(XAI_KEY,k);}catch(e){}
  var inp=document.getElementById("xaiKey");
  if(inp) inp.value=k;
  return !!k;
}
function xaiHas(){return !!xaiGet();}
function rosterBrief(){
  var rows=(state.people||[]).map(function(p){
    var c=calc(p);
    return {id:p.id,name:p.name,kurye:!!p.kurye,mesaiSaat:p.mesaiSaat||0,hsSaat:p.hsSaat||0,yolTutar:p.yolTutar||0,izinGun:p.izinGun||0,izinTutar:p.izinTutar||0,yillikTutar:p.yillikTutar||0,primAdet:p.primAdet||0,disiplinDk:p.disiplinDk||0,toplam:Math.round(c.toplam)};
  });
  var s=typeof sums==="function"?sums():null;
  return {kisi:rows.length,odemeAlan:s?s.pay.length:rows.filter(function(r){return r.toplam>0;}).length,genelToplam:s?Math.round(s.toplam):rows.reduce(function(a,r){return a+r.toplam;},0),people:rows,devam:(state.devamsizlik||[]).slice(0,40),ceza:(state.cezalar||[]).slice(0,40)};
}
function findByName(name){
  if(!name) return null;
  var n=(name||"").toLocaleLowerCase("tr");
  var exact=state.people.find(function(p){return (p.name||"").toLocaleLowerCase("tr")===n;});
  if(exact) return exact;
  var hits=state.people.filter(function(p){
    var pn=(p.name||"").toLocaleLowerCase("tr");
    return pn.indexOf(n)>=0 || n.indexOf(pn)>=0 || pn.split(" ").some(function(w){return w.length>2&&n.indexOf(w)>=0;});
  });
  return hits.length===1?hits[0]:(hits[0]||null);
}
function persistAll(){persist(); if(typeof renderAll==="function") renderAll(); else if(typeof renderListe==="function") renderListe();}
var TOOLS=[
  {type:"function",function:{name:"set_field",description:"Kisi alani guncelle",parameters:{type:"object",properties:{name:{type:"string"},field:{type:"string",enum:["mesaiSaat","hsSaat","yolTutar","izinGun","izinTutar","yillikTutar","primAdet","disiplinDk"]},value:{type:"number"}},required:["name","field","value"]}}},
  {type:"function",function:{name:"add_person",description:"Kisi ekle",parameters:{type:"object",properties:{name:{type:"string"},kurye:{type:"boolean"}},required:["name"]}}},
  {type:"function",function:{name:"delete_person",description:"Kisi sil",parameters:{type:"object",properties:{name:{type:"string"}},required:["name"]}}},
  {type:"function",function:{name:"add_devam",description:"Devamsizlik",parameters:{type:"object",properties:{name:{type:"string"},gun:{type:"number"},not:{type:"string"}},required:["name"]}}},
  {type:"function",function:{name:"add_ceza",description:"Ceza",parameters:{type:"object",properties:{name:{type:"string"},tutar:{type:"number"},neden:{type:"string"}},required:["name","tutar"]}}},
  {type:"function",function:{name:"save_server",description:"Kaydet",parameters:{type:"object",properties:{}}}},
  {type:"function",function:{name:"pull_server",description:"Cek",parameters:{type:"object",properties:{}}}},
  {type:"function",function:{name:"open_tab",description:"Sekme",parameters:{type:"object",properties:{tab:{type:"string",enum:["liste","kurye","devam","ceza","ozet","rapor"]}},required:["tab"]}}},
  {type:"function",function:{name:"make_pdf",description:"PDF",parameters:{type:"object",properties:{}}}},
  {type:"function",function:{name:"get_summary",description:"Ozet",parameters:{type:"object",properties:{}}}}
];
function runTool(name,args){
  args=args||{};
  if(name==="set_field"){
    var p=findByName(args.name); if(!p) return {ok:false,error:"kisi yok: "+args.name};
    if(args.field==="primAdet"){p.primAdet=Number(args.value)||0;persistAll();} else setVal(p.id,args.field,args.value);
    return {ok:true,name:p.name,field:args.field,value:args.value,toplam:Math.round(calc(p).toplam)};
  }
  if(name==="add_person"){
    var nm=String(args.name||"").trim(); if(nm.length<3) return {ok:false,error:"isim kisa"};
    if(state.people.some(function(x){return (x.name||"").toLocaleLowerCase("tr")===nm.toLocaleLowerCase("tr");})) return {ok:false,error:"zaten var"};
    var id=state.people.reduce(function(m,x){return Math.max(m,x.id||0);},0)+1;
    state.people.push(hydratePerson({id:id,name:nm.toLocaleUpperCase("tr"),kurye:!!args.kurye,mesaiBirim:300})); persistAll();
    return {ok:true,name:nm,kurye:!!args.kurye};
  }
  if(name==="delete_person"){
    var p=findByName(args.name); if(!p) return {ok:false,error:"kisi yok"};
    state.people=state.people.filter(function(x){return x.id!==p.id;}); persistAll(); return {ok:true,silinen:p.name};
  }
  if(name==="add_devam"){
    var p=findByName(args.name); if(!p) return {ok:false,error:"kisi yok"};
    if(!state.devamsizlik) state.devamsizlik=[]; if(typeof compactDevam==="function") compactDevam();
    var gun=Number(args.gun)||1, note=args.not||"";
    var ex=state.devamsizlik.find(function(d){return (d.kisi||"").toLocaleLowerCase("tr")===(p.name||"").toLocaleLowerCase("tr");});
    if(ex){ex.gun=(ex.gun||0)+gun; if(note) ex.not=ex.not?(ex.not+" · "+note):note;} else state.devamsizlik.push({kisi:p.name,gun:gun,not:note});
    persistAll(); return {ok:true,name:p.name,gun:gun};
  }
  if(name==="add_ceza"){
    var p=findByName(args.name); if(!p) return {ok:false,error:"kisi yok"};
    if(!state.cezalar) state.cezalar=[]; state.cezalar.push({kisi:p.name,tutar:Number(args.tutar)||0,neden:args.neden||""}); persistAll();
    return {ok:true,name:p.name,tutar:args.tutar};
  }
  if(name==="save_server"){ if(typeof save==="function") save(); return {ok:true}; }
  if(name==="pull_server"){ if(typeof yenileSunucu==="function") yenileSunucu(); return {ok:true}; }
  if(name==="open_tab"){ var el=document.querySelector('.tab[data-tab="'+(args.tab||"liste")+'"]'); if(el&&typeof tab==="function") tab(el); return {ok:true,tab:args.tab}; }
  if(name==="make_pdf"){ if(typeof sharePDF==="function") sharePDF(); return {ok:true}; }
  if(name==="get_summary"){ var s=typeof sums==="function"?sums():null; return s?{ok:true,kisi:s.all.length,odeme:s.pay.length,toplam:Math.round(s.toplam),hs:Math.round(s.hs),mesai:Math.round(s.mesai)}:rosterBrief(); }
  return {ok:false,error:"bilinmeyen arac"};
}
function sysPrompt(){
  var snap=rosterBrief();
  return "Sen Cadde Mesai Listesi asistanisin. Turkce kisa cevap ver. Degisiklik icin tool kullan. Uydurma isim yazma. HS=2500, mesai saat x 300, yol TL, prim kurye x 7. Ozet: "+snap.kisi+" kisi, "+snap.odemeAlan+" odeme, "+snap.genelToplam+" TL.\nKadro:"+JSON.stringify(snap.people.map(function(p){return {id:p.id,name:p.name,k:p.kurye,m:p.mesaiSaat,hs:p.hsSaat,yol:p.yolTutar,izinG:p.izinGun,izinT:p.izinTutar,yil:p.yillikTutar,prim:p.primAdet,top:p.toplam};}));
}
async function grokChat(userText){
  var key=xaiGet(); if(!key) throw new Error("NO_KEY");
  var messages=[{role:"system",content:sysPrompt()}].concat(hist.slice(-8)).concat([{role:"user",content:userText}]);
  var guard=0;
  while(guard++<6){
    var res=await fetch("https://api.x.ai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},body:JSON.stringify({model:MODEL,temperature:0.2,messages:messages,tools:TOOLS,tool_choice:"auto"})});
    if(!res.ok){ var err=await res.text().catch(function(){return "";}); var e=new Error("HTTP "+res.status+(err?" "+err.slice(0,120):"")); throw e; }
    var data=await res.json();
    var msg=(data.choices&&data.choices[0]&&data.choices[0].message)||{};
    var calls=msg.tool_calls||[];
    if(!calls.length){
      var text=msg.content||""; hist.push({role:"user",content:userText}); hist.push({role:"assistant",content:text}); if(hist.length>16) hist=hist.slice(-16); return text;
    }
    messages.push(msg);
    for(var i=0;i<calls.length;i++){
      var call=calls[i], args={};
      try{args=JSON.parse(call.function.arguments||"{}");}catch(ex){args={};}
      messages.push({role:"tool",tool_call_id:call.id,content:JSON.stringify(runTool(call.function.name,args))});
    }
  }
  return "Islem tamam.";
}
window.xaiGet=xaiGet; window.xaiSave=xaiSave; window.xaiHas=xaiHas; window.grokChat=grokChat; window.caddeGrokModel=MODEL;
})();
