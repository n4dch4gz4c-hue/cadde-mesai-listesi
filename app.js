const KEY="cadde_bordro_v4";
const HS_BIRIM=2500,PRIM_BIRIM=7,DIS_BIRIM=1,YOL_BIRIM=1200;
function num(v,d){const n=parseFloat(v);return Number.isFinite(n)?n:(d||0);}
function hydratePerson(p){
  p=p||{};
  const hs=num(p.hsSaat??p.hsAdet??p.hs,0);
  const yol=num(p.yolGun??p.yol,0);
  let name=p.name||"";
  if(typeof SEED!=="undefined" && SEED.people){
    const off=SEED.people.find(x=>x.id===p.id);
    if(off&&off.name)name=off.name;
  }
  return {
    id:p.id,name,kurye:!!p.kurye,
    mesaiSaat:num(p.mesaiSaat??p.saat,0),
    mesaiBirim:num(p.mesaiBirim??p.birim,300),
    hsSaat:hs,hsVar:hs>0,
    primAdet:num(p.primAdet,0),
    yolGun:yol,yolBirim:num(p.yolBirim,YOL_BIRIM),yolVar:yol>0||num(p.yolTutar,0)>0,
    yolTutar:num(p.yolTutar,0),
    izinGun:num(p.izinGun,0),izinTutar:num(p.izinTutar,0),
    yillikTutar:num(p.yillikTutar,0),
    disiplinDk:num(p.disiplinDk,0)
  };
}
function sortByTrName(arr, key){
  key=key||"name";
  (arr||[]).sort(function(a,b){
    return String(a[key]||a.name||a.kisi||"").localeCompare(String(b[key]||b.name||b.kisi||""),"tr",{sensitivity:"base"});
  });
  return arr;
}
function hydrate(s){
  s=s||{};
  const people=Array.isArray(s.people)?s.people.map(hydratePerson):[];
  sortByTrName(people,"name");
  const dev=Array.isArray(s.devamsizlik)?s.devamsizlik.slice():[];
  sortByTrName(dev,"kisi");
  return {
    people,
    cezalar:Array.isArray(s.cezalar)?s.cezalar:[],
    devamsizlik:dev,
    updatedAt:s.updatedAt||""
  };
}
function loadLocal(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){const s=hydrate(JSON.parse(raw));if(s.people.length)return s;}
  }catch(e){}
  return hydrate(JSON.parse(JSON.stringify(typeof SEED!=="undefined"?SEED:{})));
}
let state=loadLocal();
function persist(){localStorage.setItem(KEY,JSON.stringify(state));}
function calc(p){
  p=hydratePerson(p);
  const mesai=p.mesaiSaat*p.mesaiBirim;
  const hs=p.hsSaat*HS_BIRIM;
  const prim=p.kurye?p.primAdet*PRIM_BIRIM:0;
  const yol=p.yolTutar||(p.yolGun*p.yolBirim);
  const dis=p.disiplinDk*DIS_BIRIM;
  return {mesai,hs,prim,yol,izin:p.izinTutar,yillik:p.yillikTutar,dis,toplam:mesai+hs+prim+yol+p.izinTutar+p.yillikTutar+dis};
}
function tl(n){n=Math.round(n)||0;return n.toLocaleString("tr-TR");}
function dash(n){return (Math.round(n)||0)===0?"-":tl(n);}
function toast(t){const el=document.getElementById("toast");if(!el)return;el.textContent=t;el.style.display="block";setTimeout(()=>el.style.display="none",1800);}
function qv(){return (document.getElementById("q")?.value||"").toLocaleLowerCase("tr-TR");}
function visible(){const q=qv();return sortByTrName(state.people.filter(p=>!q||(p.name||"").toLocaleLowerCase("tr-TR").includes(q)).slice(),"name");}
function setVal(id,field,val){
  const p=state.people.find(x=>x.id===id);if(!p)return;
  if(field==="mesaiSaat")p.mesaiSaat=num(val,0);
  if(field==="hsSaat"){p.hsSaat=num(val,0);p.hsVar=p.hsSaat>0;}
  if(field==="yolTutar"){p.yolTutar=num(val,0);p.yolVar=p.yolTutar>0;}
  if(field==="izinGun")p.izinGun=num(val,0);
  if(field==="izinTutar")p.izinTutar=num(val,0);
  if(field==="yillikTutar")p.yillikTutar=num(val,0);
  if(field==="disiplinDk")p.disiplinDk=num(val,0);
  persist();renderListe();
}
