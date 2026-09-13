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
function normName(s){return (s||"").toLocaleUpperCase("tr-TR").replace(/\s+/g," ").trim();}
function compactDevam(){
  const map={};
  (state.devamsizlik||[]).forEach(d=>{
    const k=normName(d.kisi);
    if(!k)return;
    if(!map[k]) map[k]={kisi:d.kisi,gun:0,not:""};
    map[k].gun+=num(d.gun,0);
    if(d.not){
      const n=d.not.trim();
      if(n && map[k].not.indexOf(n)<0) map[k].not=map[k].not?(map[k].not+" · "+n):n;
    }
  });
  state.devamsizlik=Object.values(map);
}
function renderDevam(){
  fillSel("dKisi");
  compactDevam();
  document.getElementById("devamList").innerHTML=(state.devamsizlik||[]).map((d,i)=>`<article class="card"><b>${d.kisi}</b><div>${d.gun} gün · ${d.not||""}</div><button class="btn" onclick="state.devamsizlik.splice(${i},1);persist();renderDevam()">Sil</button></article>`).join("");
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
    toast(kisi+" üzerine eklendi · "+ex.gun+" gün");
  }else{
    state.devamsizlik.push({kisi,gun,not});
    toast(kisi+" eklendi · "+gun+" gün");
  }
  document.getElementById("dGun").value="1";
  document.getElementById("dNot").value="";
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
let _pdfFontB64=null;
async function ensurePdfFont(doc){
  try{
    if(!_pdfFontB64){
      const r=await fetch("https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf");
      if(!r.ok)return false;
      const buf=await r.arrayBuffer();
      const bytes=new Uint8Array(buf);
      let bin="";const step=0x8000;
      for(let i=0;i<bytes.length;i+=step) bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+step));
      _pdfFontB64=btoa(bin);
    }
    doc.addFileToVFS("DejaVuSans.ttf",_pdfFontB64);
    doc.addFont("DejaVuSans.ttf","DejaVu","normal");
    return true;
  }catch(e){return false;}
}
function pdfDrawChrome(doc,font,W,H,now,payLen,allLen){
  doc.setFillColor(31,75,143);
  doc.rect(0,0,W,14,"F");
  doc.setFillColor(196,92,38);
  doc.rect(0,14,W,1.4,"F");
  doc.setTextColor(255,255,255);
  doc.setFont(font,"normal");
  doc.setFontSize(12);
  doc.text("CADDE MESAI LISTESI",10,7);
  doc.setFontSize(7.5);
  doc.text(now+"  ·  "+payLen+" odeme / "+allLen+" kayit",10,12);
  doc.setFillColor(31,75,143);
  doc.rect(0,H-7,W,7,"F");
  doc.setFontSize(7);
  doc.text("Cadde Mesai Listesi  ·  gizli personel belgesi",10,H-2.6);
}
async function sharePDF(){
  if(!window.jspdf||!window.jspdf.jsPDF){toast("PDF yok");return;}
  if(typeof (new window.jspdf.jsPDF()).autoTable!=="function" && typeof window.jspdf.jsPDF.API.autoTable!=="function"){
    toast("Tablo eklentisi yok, sayfayi yenile");return;
  }
  toast("PDF hazırlanıyor...");
  const {jsPDF}=window.jspdf;
  compactDevam();
  const pay=state.people.map(p=>({p,c:calc(p)})).filter(x=>x.c.toplam>0);
  const all=state.people.map(p=>({p,c:calc(p)}));
  const add=k=>all.reduce((a,x)=>a+x.c[k],0);
  const now=new Date().toLocaleString("tr-TR",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"});
  const devam=state.devamsizlik||[];
  const cezalar=state.cezalar||[];
  const n=pay.length;
  const fs=n>50?6:n>38?6.5:7;
  const pad=n>50?0.55:n>38?0.7:0.85;
  const body=pay.map((x,i)=>[
    String(i+1),
    x.p.name+(x.p.kurye?" (K)":""),
    dash(x.c.mesai),dash(x.c.hs),dash(x.c.prim),dash(x.c.yol),
    dash(x.c.izin),dash(x.c.yillik),dash(x.c.dis),tl(x.c.toplam)
  ]);
  const boxes=[
    ["GENEL TOPLAM",tl(add("toplam"))+" TL",31,75,143],
    ["HAFTA SONU",tl(add("hs"))+" TL",15,123,76],
    ["MESAI",tl(add("mesai"))+" TL",196,92,38],
    ["IZIN + YILLIK",tl(add("izin")+add("yillik"))+" TL",90,70,140]
  ];

  function build(fontSize,padding){
    const doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
    return ensurePdfFont(doc).then(hasFont=>{
      const font=hasFont?"DejaVu":"helvetica";
      const W=doc.internal.pageSize.getWidth();
      const H=doc.internal.pageSize.getHeight();
      pdfDrawChrome(doc,font,W,H,now,pay.length,state.people.length);
      boxes.forEach((b,i)=>{
        const x=10+i*72;
        doc.setFillColor(b[2],b[3],b[4]);
        doc.roundedRect(x,17.2,69,9,1.2,1.2,"F");
        doc.setTextColor(255,255,255);
        doc.setFont(font,"normal");
        doc.setFontSize(6);
        doc.text(b[0],x+3,20.4);
        doc.setFontSize(9);
        doc.text(b[1],x+3,24.6);
      });
      doc.autoTable({
        startY:28,
        head:[["No","Ad Soyad","Mesai","HS","Prim","Yol","Izin","Yillik","Disiplin","Odenecek"]],
        body,
        foot:[["","TOPLAM",tl(add("mesai")),tl(add("hs")),tl(add("prim")),tl(add("yol")),tl(add("izin")),tl(add("yillik")),tl(add("dis")),tl(add("toplam"))]],
        theme:"grid",
        styles:{font,fontSize,cellPadding:padding,halign:"center",textColor:[31,41,51],lineColor:[232,223,210],lineWidth:0.15,overflow:"linebreak",minCellHeight:fontSize*0.55},
        headStyles:{fillColor:[31,75,143],textColor:[255,255,255],fontStyle:"normal",halign:"center",cellPadding:padding},
        footStyles:{fillColor:[34,34,34],textColor:[255,255,255],fontStyle:"normal",cellPadding:padding},
        columnStyles:{0:{cellWidth:8},1:{halign:"left",cellWidth:58},9:{fillColor:[243,232,210]}},
        alternateRowStyles:{fillColor:[250,247,242]},
        margin:{left:10,right:10,top:16,bottom:10},
        showHead:"everyPage",
        pageBreak:"auto",
        rowPageBreak:"avoid",
        didDrawPage:function(){pdfDrawChrome(doc,font,W,H,now,pay.length,state.people.length);}
      });
      if(doc.getNumberOfPages()===1) doc.addPage();
      while(doc.getNumberOfPages()>2) doc.deletePage(doc.getNumberOfPages());
      doc.setPage(2);
      pdfDrawChrome(doc,font,W,H,now,pay.length,state.people.length);
      let y=doc.lastAutoTable.finalY||16;
      if(doc.lastAutoTable.pageNumber===1 || y<18) y=16;
      if(y>118) y=16;
      const colW=(W-24)/2;
      if(devam.length){
        doc.setFillColor(196,92,38);
        doc.rect(10,y,colW,5.5,"F");
        doc.setTextColor(255,255,255);
        doc.setFontSize(8);
        doc.text("DEVAMSIZLIK",12,y+3.8);
        doc.autoTable({
          startY:y+6.2,
          head:[["Ad Soyad","Gun","Not"]],
          body:devam.map(d=>[d.kisi,String(d.gun),d.not||"-"]),
          theme:"grid",
          styles:{font,fontSize:6.2,cellPadding:0.6,textColor:[31,41,51],lineColor:[232,223,210],overflow:"linebreak"},
          headStyles:{fillColor:[139,64,24],textColor:[255,255,255],cellPadding:0.6},
          columnStyles:{0:{cellWidth:42},1:{cellWidth:12,halign:"center"}},
          margin:{left:10,right:10+colW+4},
          tableWidth:colW,
          pageBreak:"avoid"
        });
      }
      if(cezalar.length){
        const x0=10+colW+4;
        doc.setFillColor(120,30,30);
        doc.rect(x0,y,colW,5.5,"F");
        doc.setTextColor(255,255,255);
        doc.setFontSize(8);
        doc.text("CEZALAR",x0+2,y+3.8);
        doc.autoTable({
          startY:y+6.2,
          head:[["Ad Soyad","Tutar","Neden"]],
          body:cezalar.map(c=>[c.kisi,tl(c.tutar)+" TL",c.neden||"-"]),
          theme:"grid",
          styles:{font,fontSize:6.2,cellPadding:0.6,textColor:[31,41,51],lineColor:[232,223,210],overflow:"linebreak"},
          headStyles:{fillColor:[120,30,30],textColor:[255,255,255],cellPadding:0.6},
          columnStyles:{0:{cellWidth:42},1:{cellWidth:22,halign:"right"}},
          margin:{left:x0,right:10},
          tableWidth:colW,
          pageBreak:"avoid"
        });
      }
      while(doc.getNumberOfPages()>2) doc.deletePage(doc.getNumberOfPages());
      const pages=Math.min(doc.getNumberOfPages(),2);
      for(let i=1;i<=pages;i++){
        doc.setPage(i);
        doc.setTextColor(255,255,255);
        doc.setFont(font,"normal");
        doc.setFontSize(7);
        doc.text(i+" / 2",W-10,H-2.6,{align:"right"});
      }
      return doc;
    });
  }

  let size=fs, padding=pad, doc=await build(size,padding);
  let guard=0;
  while(doc.getNumberOfPages()>2 && guard<4){
    size=Math.max(5.2,size-0.6);
    padding=Math.max(0.4,padding-0.12);
    doc=await build(size,padding);
    guard++;
  }
  while(doc.getNumberOfPages()>2) doc.deletePage(doc.getNumberOfPages());
  doc.save("cadde-bordro.pdf");
  toast("PDF 2 sayfa indirildi");
}
async function bootSync(){
  try{
    const r=await fetch("cadde-data.json?t="+Date.now(),{cache:"no-store"});
    if(!r.ok){renderAll();return;}
    const remote=await r.json();
    if(!remote||!remote.people||remote.people.length<10){renderAll();return;}
    const rt=remote.updatedAt?Date.parse(remote.updatedAt):0;
    const lt=state.updatedAt?Date.parse(state.updatedAt):0;
    const localSum=state.people.reduce((a,p)=>a+Math.abs(num(p.hsSaat)+num(p.mesaiSaat)+num(p.izinTutar)+num(p.yillikTutar)),0);
    if(!lt || rt>=lt || localSum===0){
      state=hydrate(remote);
      persist();
      toast("Sunucudan alındı");
    }
  }catch(e){}
  renderAll();
}
bootSync();
