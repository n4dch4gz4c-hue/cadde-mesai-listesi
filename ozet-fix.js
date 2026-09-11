function renderOzet(){
  const all=state.people.map(p=>({p,c:calc(p)})).filter(x=>ozetMode==="kisa"?x.c.toplam>0:true);
  const sum=all.reduce((a,x)=>a+x.c.toplam,0);
  const devam=state.devamsizlik||[];
  const ceza=state.cezalar||[];
  const gunToplam=devam.reduce((a,d)=>a+(parseFloat(d.gun)||0),0);
  const cezaToplam=ceza.reduce((a,c)=>a+(parseFloat(c.tutar)||0),0);
  let html=`<b>Ozet</b><div class="tiny">${all.length} kisi · ${tl(sum)}</div>`;
  html+=`<table><tr><th>Ad</th><th>Toplam</th></tr>${all.map(x=>`<tr><td>${x.p.name}</td><td>${tl(x.c.toplam)}</td></tr>`).join("")}</table>`;
  html+=`<div style="margin-top:16px"><b>Devamsizlik</b><div class="tiny">${devam.length} kayit · ${gunToplam} gun</div>`;
  if(!devam.length) html+=`<div class="tiny">Kayit yok</div>`;
  else html+=`<table><tr><th>Ad</th><th>Gun</th><th>Not</th></tr>${devam.map(d=>`<tr><td>${d.kisi}</td><td>${d.gun}</td><td>${d.not||""}</td></tr>`).join("")}</table>`;
  html+=`</div><div style="margin-top:16px"><b>Cezalar</b><div class="tiny">${ceza.length} kayit · ${tl(cezaToplam)}</div>`;
  if(!ceza.length) html+=`<div class="tiny">Kayit yok</div>`;
  else html+=`<table><tr><th>Ad</th><th>Tutar</th><th>Neden</th></tr>${ceza.map(c=>`<tr><td>${c.kisi}</td><td>${tl(c.tutar)}</td><td>${c.neden||""}</td></tr>`).join("")}</table>`;
  html+=`</div>`;
  document.getElementById("ozetBox").innerHTML=html;
}
