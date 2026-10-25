(function(){
function css(){
  if(document.getElementById("pagePdfCss"))return;
  var st=document.createElement("style");
  st.id="pagePdfCss";
  st.textContent=".page-pdf{gap:6px;margin:6px 0}#duzenleList input.nm{width:100%;text-align:left;min-width:180px}#asFab,#asPanel{display:none!important}#ozetKisa table{width:100%!important;max-width:none!important;min-width:0!important}#kisiPanel table.kisi-table{max-width:420px!important;min-width:0!important}";
  document.head.appendChild(st);
}
function bar(kind){
  return '<div class="row page-pdf" data-pdfbar="'+kind+'"><button class="btn primary" type="button" onclick="pagePdf(\''+kind+'\',false)">PDF indir</button><button class="btn" type="button" onclick="pagePdf(\''+kind+'\',true)">Paylas</button></div>';
}
function attach(){
  css();
  var fab=document.getElementById("asFab"); if(fab) fab.remove();
  var pan=document.getElementById("asPanel"); if(pan) pan.remove();
  [["sec-liste",".panel","liste"],["sec-kurye",".panel","kurye"],["sec-devam",".panel","devam"],["sec-ceza",".panel","ceza"],["sec-rapor",".rapor-head","rapor"]].forEach(function(it){
    var root=document.getElementById(it[0]); if(!root)return;
    var host=root.querySelector(it[1])||root;
    if(host.querySelector("[data-pdfbar='"+it[2]+"']"))return;
    var d=document.createElement("div");
    d.innerHTML=bar(it[2]);
    host.appendChild(d.firstChild);
  });
}
function _sums(){return typeof sums==="function"?sums():{all:[],pay:[],mesai:0,hs:0,prim:0,yol:0,izin:0,yillik:0,dis:0,toplam:0};}
function isCadde(){ return typeof currentBranch==="undefined" || currentBranch==="Cadde"; }
function renderDuzenle(){
  var box=document.getElementById("duzenleList");
  if(!box)return;
  var rows=(typeof state!=="undefined"&&state.people)?state.people:[];
  var max=rows.length;
  var showKurye=isCadde();
  var head='<tr><th>Sira</th><th>Ad Soyad</th>'+(showKurye?'<th>Kurye</th>':'')+'<th>Birim</th><th></th></tr>';
  box.innerHTML='<div class="table-wrap" style="max-height:70vh;padding:0"><table class="sheet slim"><thead>'+head+'</thead><tbody>'+
    rows.map(function(p,i){
      var kuryeCell=showKurye?'<td><input type="checkbox" class="ky"'+(p.kurye?" checked":"")+'></td>':'';
      return '<tr data-id="'+p.id+'"><td><input type="number" class="sira" value="'+(i+1)+'" min="1" max="'+max+'" style="width:56px;text-align:center"></td><td class="name"><input class="nm"></td>'+kuryeCell+'<td><input type="number" class="br" value="'+(p.mesaiBirim||300)+'"></td><td><button class="btn del" type="button">Sil</button></td></tr>';
    }).join("")+"</tbody></table></div>";
  rows.forEach(function(p){
    var tr=box.querySelector('tr[data-id="'+p.id+'"]');
    if(!tr)return;
    var nm=tr.querySelector(".nm");
    if(nm) nm.value=p.name||"";
  });
  box.onchange=function(ev){
    var tr=ev.target.closest("tr[data-id]"); if(!tr)return;
    var id=+tr.getAttribute("data-id");
    var p=state.people.find(function(x){return x.id===id;}); if(!p)return;
    if(ev.target.classList.contains("nm")){ p.name=ev.target.value.trim(); persist(); toast("Isim guncellendi"); }
    if(ev.target.classList.contains("ky")){ p.kurye=!!ev.target.checked; persist(); renderAll(); }
    if(ev.target.classList.contains("br")){ p.mesaiBirim=num(ev.target.value,300); persist(); renderAll(); }
    if(ev.target.classList.contains("sira")){
      var newPos=parseInt(ev.target.value,10)||1;
      if(newPos<1) newPos=1;
      if(newPos>state.people.length) newPos=state.people.length;
      window.setSira(id, newPos);
    }
  };
  box.onclick=function(ev){
    var tr=ev.target.closest("tr[data-id]"); if(!tr)return;
    var id=+tr.getAttribute("data-id");
    if(ev.target.classList.contains("del")){ if(typeof silKisi==="function") silKisi(id); renderDuzenle(); }
  };
}
window.renderDuzenle=renderDuzenle;
window.setSira=function(id, newPos){
  var i=state.people.findIndex(function(x){return x.id===id;});
  if(i<0) return;
  var person=state.people.splice(i,1)[0];
  var target=Math.max(0, Math.min(newPos-1, state.people.length));
  state.people.splice(target, 0, person);
  persist();
  renderDuzenle();
  renderAll();
  toast("Sira guncellendi");
};
window.tab=function(el){
  document.querySelectorAll(".tab[data-tab]").forEach(function(t){t.classList.toggle("on",t===el);});
  var id=el.dataset.tab;
  ["liste","kurye","devam","ceza","ozet","rapor","duzenle"].forEach(function(s){
    var e=document.getElementById("sec-"+s); if(e) e.classList.toggle("hide",s!==id);
  });
  if(id==="kurye") renderKurye();
  if(id==="devam") renderDevam();
  if(id==="ceza") renderCeza();
  if(id==="ozet"){ renderOzet(); if(typeof ozetMod==="function") ozetMod((document.querySelector("[data-ozet].on")||{}).dataset.ozet||"kisa"); }
  if(id==="rapor") renderRapor();
  if(id==="duzenle") renderDuzenle();
};
var _ra=renderAll;
renderAll=function(){
  _ra();
  attach();
  var d=document.getElementById("sec-duzenle");
  if(d && !d.classList.contains("hide")) renderDuzenle();
};
setTimeout(attach,400);
setTimeout(attach,1200);
window.pagePdf = pagePdf;
})();
