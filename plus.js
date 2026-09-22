function nextId(){return state.people.reduce((m,p)=>Math.max(m,p.id||0),0)+1;}
function addKisi(){
  const name=(document.getElementById("nAd")?.value||"").trim();
  if(!name){toast("Isim yaz");return;}
  const kurye=!!document.getElementById("nKurye")?.checked;
  const birim=num(document.getElementById("nBirim")?.value,300);
  state.people.push(hydratePerson({id:nextId(),name,kurye,mesaiBirim:birim}));
  if(typeof sortByTrName==="function") sortByTrName(state.people,"name");
  persist();
  document.getElementById("nAd").value="";
  renderAll();
  toast(name+" eklendi");
}
function silKisi(id){
  const p=state.people.find(x=>x.id===id);
  if(!p||!confirm(p.name+" silinsin mi?"))return;
  state.people=state.people.filter(x=>x.id!==id);
  persist();renderAll();
}
function ozetMod(m){
  document.querySelectorAll("[data-ozet]").forEach(b=>b.classList.toggle("on",b.dataset.ozet===m));
  const kisa=document.getElementById("ozetKisa");
  const ayr=document.getElementById("ozetAyrinti");
  if(kisa)kisa.classList.toggle("hide",m!=="kisa");
  if(ayr)ayr.classList.toggle("hide",m!=="ayrinti");
}
function sums(){
  const all=state.people.map(p=>({p,c:calc(p)}));
  const pay=all.filter(x=>x.c.toplam>0);
  const add=k=>all.reduce((a,x)=>a+x.c[k],0);
  return {all,pay,add,toplam:add("toplam"),mesai:add("mesai"),hs:add("hs"),prim:add("prim"),yol:add("yol"),izin:add("izin"),yillik:add("yillik"),dis:add("dis")};
}
