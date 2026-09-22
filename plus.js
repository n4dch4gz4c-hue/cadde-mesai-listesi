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
