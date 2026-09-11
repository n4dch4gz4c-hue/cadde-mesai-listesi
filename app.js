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
function hydrate(s){
  s=s||{};
  return {people:Array.isArray(s.people)?s.people.map(hydratePerson):[],cezalar:Array.isArray(s.cezalar)?s.cezalar:[],devamsizlik:Array.isArray(s.devamsizlik)?s.devamsizlik:[]};
}
function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){const s=hydrate(JSON.parse(raw));if(s.people.length)return s;}
  }catch(e){}
  return hydrate(JSON.parse(JSON.stringify(SEED)));
}
let state=load();
function persist(){localStorage.setItem(KEY,JSON.stringify(state));}
persist();
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
function toast(t){const el=document.getElementById("toast");if(!el)return;el.textContent=t;el.style.display="block";setTimeout(()=>el.style.display="none",1400);}
function qv(){return (document.getElementById("q")?.value||"").toLocaleLowerCase("tr-TR");}
function visible(){const q=qv();return state.people.filter(p=>!q||(p.name||"").toLocaleLowerCase("tr-TR").includes(q));}
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
function renderListe(){
  const rows=visible();
  const all=state.people.map(p=>({p,c:calc(p)}));
  const sum=x=>all.reduce((a,r)=>a+r.c[x],0);
  const sub=document.getElementById("pageSub");
  if(sub)sub.textContent=state.people.length+" kişi · genel toplam "+tl(sum("toplam"))+" TL";
  document.getElementById("stats").innerHTML=`<div class="stat"><span>Genel toplam</span><b>${tl(sum("toplam"))} TL</b></div><div class="stat"><span>Ödemesi olan</span><b>${all.filter(r=>r.c.toplam>0).length} / ${state.people.length}</b></div><div class="stat"><span>Hafta sonu</span><b>${tl(sum("hs"))} TL</b></div><div class="stat"><span>Mesai</span><b>${tl(sum("mesai"))} TL</b></div>`;
  document.getElementById("tbody").innerHTML=rows.map(p=>{
    const c=calc(p);
    const cls=c.toplam>0?"pay":"zero";
    return `<tr class="${cls}"><td>${state.people.findIndex(x=>x.id===p.id)+1}</td><td class="name">${p.name}${p.kurye?" <small>KURYE</small>":""}</td><td><input type="number" step="0.5" value="${p.mesaiSaat||""}" onchange="setVal(${p.id},'mesaiSaat',this.value)"/></td><td>${dash(c.mesai)}</td><td><input type="number" step="0.5" value="${p.hsSaat||""}" onchange="setVal(${p.id},'hsSaat',this.value)"/></td><td>${dash(c.hs)}</td><td>${p.kurye?dash(c.prim):"-"}</td><td><input class="wide" type="number" value="${p.yolTutar||""}" onchange="setVal(${p.id},'yolTutar',this.value)"/></td><td><input type="number" step="0.5" value="${p.izinGun||""}" onchange="setVal(${p.id},'izinGun',this.value)"/></td><td><input class="wide" type="number" value="${p.izinTutar||""}" onchange="setVal(${p.id},'izinTutar',this.value)"/></td><td><input class="wide" type="number" value="${p.yillikTutar||""}" onchange="setVal(${p.id},'yillikTutar',this.value)"/></td><td><input type="number" value="${p.disiplinDk||""}" onchange="setVal(${p.id},'disiplinDk',this.value)"/></td><td class="tot">${dash(c.toplam)}</td></tr>`;
  }).join("");
  const vis=rows.map(calc);
  const add=k=>vis.reduce((a,c)=>a+c[k],0);
  document.getElementById("tfoot").innerHTML=`<tr><td colspan="3">TOPLAM</td><td>${tl(add("mesai"))}</td><td></td><td>${tl(add("hs"))}</td><td>${tl(add("prim"))}</td><td>${tl(add("yol"))}</td><td></td><td>${tl(add("izin"))}</td><td>${tl(add("yillik"))}</td><td>${tl(add("dis"))}</td><td>${tl(add("toplam"))}</td></tr>`;
}
function renderKurye(){
  const list=state.people.filter(p=>p.kurye);
  const sum=list.reduce((a,p)=>a+(p.primAdet||0),0);
  document.getElementById("kuryeList").innerHTML=list.map(p=>`<article class="card"><b>${p.name}</b><label>Prim adet<input type="number" value="${p.primAdet||0}" onchange="setPrim(${p.id},this.value)"/></label><div>${tl((p.primAdet||0)*PRIM_BIRIM)} TL</div></article>`).join("")+`<article class="card"><b>Toplam adet ${sum}</b><div>${tl(sum*PRIM_BIRIM)} TL</div></article>`;
}
function setPrim(id,v){const p=state.people.find(x=>x.id===id);if(!p)return;p.primAdet=num(v,0);persist();renderKurye();renderListe();}
function fillSel(id){const sel=document.getElementById(id);if(!sel)return;const cur=sel.value;sel.innerHTML='<option value="">Kişi seç</option>'+state.people.map(p=>`<option value="${p.name}">${p.name}</option>`).join("");if(cur)sel.value=cur;}
function renderDevam(){
  fillSel("dKisi");
  document.getElementById("devamList").innerHTML=(state.devamsizlik||[]).map((d,i)=>`<article class="card"><b>${d.kisi}</b><div>${d.gun} gün · ${d.not||""}</div><button class="btn" onclick="state.devamsizlik.splice(${i},1);persist();renderDevam()">Sil</button></article>`).join("");
}
function addDevam(){
  const kisi=document.getElementById("dKisi").value;if(!kisi){toast("Kişi seç");return;}
  state.devamsizlik.push({kisi,gun:num(document.getElementById("dGun").value,1),not:document.getElementById("dNot").value||""});
  persist();renderDevam();
}
function renderCeza(){
  fillSel("cKisi");
  document.getElementById("cezaList").innerHTML=(state.cezalar||[]).map((c,i)=>`<article class="card"><b>${c.kisi}</b><div>${tl(c.tutar)} TL · ${c.neden||""}</div><button class="btn" onclick="state.cezalar.splice(${i},1);persist();renderCeza()">Sil</button></article>`).join("");
}
function addCeza(){
  const kisi=document.getElementById("cKisi").value;if(!kisi){toast("Kişi seç");return;}
  state.cezalar.push({kisi,tutar:num(document.getElementById("cTutar").value,0),neden:document.getElementById("cNeden").value||""});
  persist();renderCeza();
}
function renderOzet(){
  const all=state.people.map(p=>({p,c:calc(p)})).filter(x=>x.c.toplam>0);
  const sum=all.reduce((a,x)=>a+x.c.toplam,0);
  document.getElementById("ozetBox").innerHTML=`<h2>Ödemesi olanlar</h2><p>${all.length} kişi · ${tl(sum)} TL</p><table class="sheet"><thead><tr><th>Ad</th><th>Mesai</th><th>HS</th><th>İzin</th><th>Toplam</th></tr></thead><tbody>${all.map(x=>`<tr><td class="name">${x.p.name}</td><td>${dash(x.c.mesai)}</td><td>${dash(x.c.hs)}</td><td>${dash(x.c.izin+x.c.yillik)}</td><td>${tl(x.c.toplam)}</td></tr>`).join("")}</tbody></table>`;
}
function renderAll(){renderListe();if(document.getElementById("kuryeList"))renderKurye();if(document.getElementById("devamList"))renderDevam();if(document.getElementById("cezaList"))renderCeza();if(document.getElementById("ozetBox"))renderOzet();}
function tab(el){
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("on",t===el));
  const id=el.dataset.tab;
  ["liste","kurye","devam","ceza","ozet"].forEach(s=>{const e=document.getElementById("sec-"+s);if(e)e.classList.toggle("hide",s!==id);});
  if(id==="kurye")renderKurye();
  if(id==="devam")renderDevam();
  if(id==="ceza")renderCeza();
  if(id==="ozet")renderOzet();
}
function save(){persist();toast("Kaydedildi");}
function resetData(){
  if(!confirm("PDF listesi yüklensin mi?"))return;
  localStorage.removeItem(KEY);
  state=hydrate(JSON.parse(JSON.stringify(SEED)));
  persist();renderAll();toast("Yüklendi");
}
function exportCSV(){
  const head=["No","Ad","Mesai saat","Mesai tutar","HS adet","HS tutar","Prim","Yol","Izin gun","Izin","Yillik","Disiplin","Toplam"];
  const rows=state.people.map((p,i)=>{const c=calc(p);return [i+1,p.name,p.mesaiSaat||0,Math.round(c.mesai),p.hsSaat||0,Math.round(c.hs),Math.round(c.prim),Math.round(c.yol),p.izinGun||0,Math.round(c.izin),Math.round(c.yillik),p.disiplinDk||0,Math.round(c.toplam)].join(";");});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob(["\ufeff"+head.join(";")+"\n"+rows.join("\n")],{type:"text/csv;charset=utf-8"}));
  a.download="cadde-bordro.csv";a.click();
}
async function sharePDF(){
  if(!window.jspdf||!window.jspdf.jsPDF){toast("PDF yok");return;}
  const doc=new window.jspdf.jsPDF({orientation:"landscape"});
  doc.setFontSize(13);doc.text("Cadde Mesai Listesi",10,12);
  let y=20;
  state.people.forEach((p,i)=>{const c=calc(p);if(y>190){doc.addPage();y=16;}doc.setFontSize(9);doc.text(`${i+1}  ${p.name}  ${Math.round(c.toplam)} TL`,10,y);y+=6;});
  doc.save("cadde-bordro.pdf");
}
renderAll();
