let KEY="mesai_Cadde";
const HS_BIRIM=2500,PRIM_BIRIM=7,DIS_BIRIM=1,YOL_BIRIM=1200;
function num(v,d){const n=parseFloat(v);return Number.isFinite(n)?n:(d||0);}
function hydratePerson(p){
  p=p||{};
  const hs=num(p.hsSaat??p.hsAdet??p.hs,0);
  const yol=num(p.yolGun??p.yol,0);
  let name=p.name||"";
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
  return {
    people:Array.isArray(s.people)?s.people.map(hydratePerson):[],
    cezalar:Array.isArray(s.cezalar)?s.cezalar:[],
    devamsizlik:Array.isArray(s.devamsizlik)?s.devamsizlik:[],
    updatedAt:s.updatedAt||""
  };
}
function loadLocal(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){const s=hydrate(JSON.parse(raw));if(s.people.length)return s;}
  }catch(e){}
  var seed={};
  if(typeof getSeedForBranch==="function" && typeof currentBranch!=="undefined"){
    seed=getSeedForBranch(currentBranch);
  }else if(typeof SEED!=="undefined"){
    seed=SEED;
  }
  return hydrate(JSON.parse(JSON.stringify(seed||{})));
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
function toast(t, long=false){const el=document.getElementById("toast");if(!el)return;el.textContent=t;el.style.display="block";setTimeout(()=>el.style.display="none", long?4000:1800);}
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
function kTag(p){return p.kurye?' <span class="kmark">K</span>':'';}
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
    return `<tr class="${cls}"><td>${state.people.findIndex(x=>x.id===p.id)+1}</td><td class="name">${p.name}${kTag(p)}</td><td><input type="number" step="0.5" value="${p.mesaiSaat||""}" onchange="setVal(${p.id},'mesaiSaat',this.value)"/></td><td>${dash(c.mesai)}</td><td><input type="number" step="0.5" value="${p.hsSaat||""}" onchange="setVal(${p.id},'hsSaat',this.value)"/></td><td>${dash(c.hs)}</td><td>${p.kurye?dash(c.prim):"-"}</td><td><input class="wide" type="number" value="${p.yolTutar||""}" onchange="setVal(${p.id},'yolTutar',this.value)"/></td><td><input type="number" step="0.5" value="${p.izinGun||""}" onchange="setVal(${p.id},'izinGun',this.value)"/></td><td><input class="wide" type="number" value="${p.izinTutar||""}" onchange="setVal(${p.id},'izinTutar',this.value)"/></td><td><input class="wide" type="number" value="${p.yillikTutar||""}" onchange="setVal(${p.id},'yillikTutar',this.value)"/></td><td><input type="number" value="${p.disiplinDk||""}" onchange="setVal(${p.id},'disiplinDk',this.value)"/></td><td class="tot">${dash(c.toplam)}</td></tr>`;
  }).join("");
  const vis=rows.map(calc);
  const add=k=>vis.reduce((a,c)=>a+c[k],0);
  document.getElementById("tfoot").innerHTML=`<tr><td colspan="3">TOPLAM</td><td>${tl(add("mesai"))}</td><td></td><td>${tl(add("hs"))}</td><td>${tl(add("prim"))}</td><td>${tl(add("yol"))}</td><td></td><td>${tl(add("izin"))}</td><td>${tl(add("yillik"))}</td><td>${tl(add("dis"))}</td><td>${tl(add("toplam"))}</td></tr>`;
}
function renderKurye(){
  const list=state.people.filter(p=>p.kurye);
  const sum=list.reduce((a,p)=>a+(p.primAdet||0),0);
  document.getElementById("kuryeList").innerHTML=`<div class="table-wrap"><table class="sheet slim"><thead><tr><th>No</th><th>Ad Soyad</th><th>Prim adet</th><th>Prim tutar</th></tr></thead><tbody>${list.length?list.map((p,i)=>`<tr><td>${i+1}</td><td class="name">${p.name}</td><td><input type="number" value="${p.primAdet||0}" onchange="setPrim(${p.id},this.value)" style="width:80px"></td><td>${tl((p.primAdet||0)*PRIM_BIRIM)} TL</td></tr>`).join(""):`<tr><td colspan="4">Kurye yok</td></tr>`}</tbody><tfoot><tr><td></td><td>TOPLAM</td><td>${sum}</td><td>${tl(sum*PRIM_BIRIM)} TL</td></tr></tfoot></table></div>`;
}
function setPrim(id,v){const p=state.people.find(x=>x.id===id);if(!p)return;p.primAdet=num(v,0);persist();renderKurye();renderListe();}
function fillSel(id){const sel=document.getElementById(id);if(!sel)return;const cur=sel.value;sel.innerHTML='<option value="">Kişi seç</option>'+state.people.map(p=>`<option value="${p.name}">${p.name}</option>`).join("");if(cur)sel.value=cur;}
function normName(s){return (s||"").toLocaleUpperCase("tr-TR").replace(/\s+/g," ").trim();}
function compactDevam(){
  const map={};
  (state.devamsizlik||[]).forEach(d=>{
    const k=normName(d.kisi);
    if(!k)return;
    if(!map[k]) map[k]={kisi:d.kisi,gun:0,not:"",eklenme:d.eklenme||""};
    map[k].gun+=num(d.gun,0);
    if(d.not){
      const n=d.not.trim();
      if(n && map[k].not.indexOf(n)<0) map[k].not=map[k].not?(map[k].not+" · "+n):n;
    }
    if(d.eklenme && !map[k].eklenme) map[k].eklenme=d.eklenme;
  });
  state.devamsizlik=Object.values(map);
}
function renderDevam(){
  fillSel("dKisi");
  compactDevam();
  const rows=state.devamsizlik||[];
  document.getElementById("devamList").innerHTML=`<div class="table-wrap"><table class="sheet slim"><thead><tr><th>No</th><th>Ad Soyad</th><th>Gün</th><th>Not</th><th></th></tr></thead><tbody>${rows.length?rows.map((d,i)=>`<tr><td>${i+1}</td><td class="name">${d.kisi}${d.eklenme?`<div style="font-size:11px;color:#888;font-weight:400;margin-top:2px">${d.eklenme}</div>`:""}</td><td>${d.gun}</td><td class="name">${d.not||"-"}</td><td><button class="btn" onclick="state.devamsizlik.splice(${i},1);persist();renderDevam()">Sil</button></td></tr>`).join(""):`<tr><td colspan="5">Kayıt yok</td></tr>`}</tbody></table></div>`;
}
function addDevam(){
  const kisi=document.getElementById("dKisi").value;if(!kisi){toast("Kişi seç");return;}
  const gun=num(document.getElementById("dGun").value,1);
  const not=(document.getElementById("dNot").value||"").trim();
  if(!state.devamsizlik)state.devamsizlik=[];
  compactDevam();
  const ex=state.devamsizlik.find(d=>normName(d.kisi)===normName(kisi));
  if(ex){
    ex.gun=num(ex.gun,0)+gun;
    if(not && (ex.not||"").indexOf(not)<0) ex.not=ex.not?(ex.not+" · "+not):not;
    if(!ex.eklenme) ex.eklenme=new Date().toLocaleDateString("tr-TR");
    toast(kisi+" üzerine eklendi · "+ex.gun+" gün");
  }else{
    const eklenme=new Date().toLocaleDateString("tr-TR");
    state.devamsizlik.push({kisi,gun,not,eklenme});
    toast(kisi+" eklendi · "+gun+" gün");
  }
  document.getElementById("dGun").value="1";
  document.getElementById("dNot").value="";
  persist();renderDevam();
}
function renderCeza(){
  fillSel("cKisi");
  const rows=state.cezalar||[];
  document.getElementById("cezaList").innerHTML=`<div class="table-wrap"><table class="sheet slim"><thead><tr><th>No</th><th>Ad Soyad</th><th>Tutar</th><th>Neden</th><th></th></tr></thead><tbody>${rows.length?rows.map((c,i)=>`<tr><td>${i+1}</td><td class="name">${c.kisi}${c.eklenme?`<div style="font-size:11px;color:#888;font-weight:400;margin-top:2px">${c.eklenme}</div>`:""}</td><td>${tl(c.tutar)} TL</td><td class="name">${c.neden||"-"}</td><td><button class="btn" onclick="state.cezalar.splice(${i},1);persist();renderCeza()">Sil</button></td></tr>`).join(""):`<tr><td colspan="5">Kayıt yok</td></tr>`}</tbody></table></div>`;
}
function addCeza(){
  const kisi=document.getElementById("cKisi").value;if(!kisi){toast("Kişi seç");return;}
  const eklenme=new Date().toLocaleDateString("tr-TR");
  state.cezalar.push({kisi,tutar:num(document.getElementById("cTutar").value,0),neden:document.getElementById("cNeden").value||"",eklenme});
  persist();renderCeza();
}
function renderOzet(){
  const all=state.people.map(p=>({p,c:calc(p)}));
  const sum=all.reduce((a,x)=>a+x.c.toplam,0);
  const box=document.getElementById("ozetBox");
  if(!box)return;
  box.innerHTML=`<h2>Tüm kadro</h2><p>${all.length} kişi · ${tl(sum)} TL</p><table class="sheet"><thead><tr><th>No</th><th>Ad</th><th>Mesai</th><th>HS</th><th>İzin</th><th>Toplam</th></tr></thead><tbody>${all.map((x,i)=>`<tr><td>${i+1}</td><td class="name">${x.p.name}</td><td>${dash(x.c.mesai)}</td><td>${dash(x.c.hs)}</td><td>${dash(x.c.izin+x.c.yillik)}</td><td>${dash(x.c.toplam)}</td></tr>`).join("")}</tbody></table>`;
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
function load(){
  state=loadLocal();
  renderAll();
}
async function save(){
  state.updatedAt=new Date().toISOString();
  persist();
  if(typeof ghHasToken==="function" && ghHasToken()){
    toast("Kaydedildi, GitHub'a yazılıyor...");
    await ghPush();
  }else{
    toast("Bu cihazda kaydedildi. Telefona gitmesi için başlığa 3 kez basıp token gir.");
  }
}
async function yenileSunucu(){
  toast("Sunucu kontrol ediliyor...");
  if(typeof ghPullPublic==="function") await ghPullPublic();
}
function resetData(){
  if(!confirm("Liste yüklensin mi?"))return;
  localStorage.removeItem(KEY);
  state=loadLocal();
  persist();renderAll();toast("Yüklendi");
}
function exportCSV(){
  const head=["No","Ad","Mesai saat","Mesai tutar","HS adet","HS tutar","Prim","Yol","Izin gun","Izin","Yillik","Disiplin","Toplam"];
  const rows=state.people.map((p,i)=>{const c=calc(p);return [i+1,p.name,p.mesaiSaat||0,Math.round(c.mesai),p.hsSaat||0,Math.round(c.hs),Math.round(c.prim),Math.round(c.yol),p.izinGun||0,Math.round(c.izin),Math.round(c.yillik),p.disiplinDk||0,Math.round(c.toplam)].join(";");});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob(["\ufeff"+head.join(";")+"\n"+rows.join("\n")],{type:"text/csv;charset=utf-8"}));
  a.download="bordro.csv";a.click();
}
let _pdfFontB64=null;
async function arrayBufferToBase64(buffer){
  const bytes=new Uint8Array(buffer);
  let binary="";
  const chunk=8192;
  for(let i=0;i<bytes.length;i+=chunk){
    binary+=String.fromCharCode.apply(null,bytes.subarray(i,i+chunk));
  }
  return btoa(binary);
}
async function loadFontB64(url){
  const r=await fetch(url);
  if(!r.ok) throw new Error("Font fetch failed: "+url);
  const buf=await r.arrayBuffer();
  return arrayBufferToBase64(buf);
}
async function ensurePdfFont(doc){
  try{
    if(!_pdfFontB64){
      const urls=["DejaVuSans.ttf","https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf"];
      for(const url of urls){
        try{
          _pdfFontB64=await loadFontB64(url);
          break;
        }catch(e){}
      }
    }
    if(_pdfFontB64){
      doc.addFileToVFS("DejaVuSans.ttf",_pdfFontB64);
      doc.addFont("DejaVuSans.ttf","DejaVu","normal");
    }
    return !!_pdfFontB64;
  }catch(e){
    return false;
  }
}
function yedekAl(){
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "yedek-" + new Date().toISOString().slice(0,10) + ".json";
  a.click();
  toast("Yedek indirildi", true);
}