function calc(p){const mesai=(p.mesaiSaat||0)*(p.mesaiBirim||0);const hs=p.hsVar?(p.hsSaat||0)*1250:0;const prim=p.kurye?(p.primAdet||0)*PRIM_BIRIM:0;const yol=p.yolVar?(p.yolGun||0)*(p.yolBirim||1200):0;const izin=p.izinTutar||0,yillik=p.yillikTutar||0,dis=(p.disiplinDk||0)*DIS_BIRIM;return{mesai,hs,prim,yol,izin,yillik,dis,toplam:mesai+hs+prim+yol+izin+yillik+dis};}
function setF(id,key,val){var p=state.people.find(function(x){return x.id===id;});if(!p)return;p[key]=parseFloat(val)||0;if(key==="hsSaat")p.hsVar=p.hsSaat>0;if(key==="yolGun")p.yolVar=p.yolGun>0;persist();renderListe();}
function renderListe(){
  var people=visiblePeople();
  var all=state.people.map(calc);
  var sum=all.reduce(function(a,b){return a+b.toplam;},0);
  var poz=all.filter(function(x){return x.toplam>0;}).length;
  document.getElementById("stats").innerHTML='<div class="stat"><span>Genel toplam</span><b>'+tl(sum)+'</b></div><div class="stat"><span>Odemesi olan</span><b>'+poz+' / '+state.people.length+'</b></div>';
  var h='<div style="overflow:auto"><table class="sheetTab"><thead><tr><th>No</th><th>Ad Soyad</th><th>Mesai</th><th>Mesai TL</th><th>HS</th><th>HS TL</th><th>Yol gun</th><th>Yol TL</th><th>Izin</th><th>Toplam</th></tr></thead><tbody>';
  people.forEach(function(p){
    var c=calc(p);
    var sira=state.people.findIndex(function(x){return x.id===p.id;})+1;
    var inp='style="width:64px;padding:4px;font-size:13px"';
    h+='<tr>';
    h+='<td>'+sira+'</td>';
    h+='<td class="ad">'+p.name+(p.kurye?' <span class="badge">K</span>':'')+'</td>';
    h+='<td><input type="number" step="0.5" value="'+(p.mesaiSaat||0)+'" '+inp+' onchange="setF('+p.id+',\'mesaiSaat\',this.value)"></td>';
    h+='<td>'+(c.mesai?tl(c.mesai):'-')+'</td>';
    h+='<td><input type="number" step="0.5" value="'+(p.hsVar?(p.hsSaat||0):0)+'" '+inp+' onchange="setF('+p.id+',\'hsSaat\',this.value)"></td>';
    h+='<td>'+(c.hs?tl(c.hs):'-')+'</td>';
    h+='<td><input type="number" step="1" value="'+(p.yolVar?(p.yolGun||0):0)+'" '+inp+' onchange="setF('+p.id+',\'yolGun\',this.value)"></td>';
    h+='<td>'+(c.yol?tl(c.yol):'-')+'</td>';
    h+='<td><input type="number" step="100" value="'+(p.izinTutar||0)+'" '+inp+' onchange="setF('+p.id+',\'izinTutar\',this.value)"></td>';
    h+='<td><b>'+tl(c.toplam)+'</b></td>';
    h+='</tr>';
  });
  h+='</tbody></table></div>';
  document.getElementById("list").innerHTML=h;
}
function renderTopluHs(){var box=document.getElementById("hsList");if(!box)return;var q=(document.getElementById("hsQ")&&document.getElementById("hsQ").value||"").toLocaleLowerCase("tr-TR");var list=state.people.filter(function(p){return !q||(p.name||"").toLocaleLowerCase("tr-TR").indexOf(q)>=0;});box.innerHTML=list.map(function(p){var saat=p.hsVar?(p.hsSaat||0):0;return '<div class="card"><div class="name"><label style="flex-direction:row;align-items:center;gap:8px;color:var(--txt)"><input type="checkbox" class="hsChk" data-id="'+p.id+'" '+(saat>0?'checked':'')+'/><strong>'+p.name+'</strong></label><span class="tiny">'+(saat?(saat+' adet \u00b7 '+tl(saat*1250)):'0 TL')+'</span></div><label>HS adet<input type="number" step="0.5" value="'+saat+'" onchange="hsTekKaydet('+p.id+', this.value)"/></label></div>';}).join("");}
function fold(s){return(s||"").toLocaleUpperCase("tr-TR").replace(/[\u0130I]/g,"I").replace(/\u015e/g,"S").replace(/\u011e/g,"G").replace(/\u00dc/g,"U").replace(/\u00d6/g,"O").replace(/\u00c7/g,"C").replace(/\s+/g," ").trim();}
function findP(name){var f=fold(name);return state.people.find(function(p){return fold(p.name)===f;})||state.people.find(function(p){return fold(p.name).indexOf(f)>=0;});}
function applyPdfData(){
  if(!state||!state.people||!state.people.length)return;
  ["ABDULLAH AVCI","BURHAN BAYAKIR","ERDAL CAVDAR","HIKMET ERDOGDU","ERHAN SOFUOGLU","BILAL SURUKLI","UGUR GOKER","BEDRETTIN AVCI","SELAHATTIN AVCI","CANER AVCI","YILMAZ AVCI","RAMAZAN BAYAKIR","ONUR AVCI","CIHAN AVCI","MURAT DAGIDIR","SEYFI CELIK","FEVZI DOLAK","MUHAMMET SOFUOGLU","AYDIN AVCI","CIHAN GENC","ABDULLAH DENERI","HAMIT AKPINAR","SAYIM GUMUS","MUHITTIN OZCELIK","HASAN IPEK","VAHDETTIN AVCI","ERCAN ALTUN","OSMAN CEYLAN","ABDURRAHMAN OZKAN","MENDERES SOFUOGLU"].forEach(function(n){var p=findP(n);if(p){p.hsSaat=2;p.hsVar=true;}});
  [["AYDIN AVCI",2],["MUHITTIN OZCELIK",4],["ABDURRAHMAN GURKAN",2],["MENDERES SOFUOGLU",2]].forEach(function(x){var p=findP(x[0]);if(p)p.mesaiSaat=x[1];});
  var p;
  p=findP("CEMAL CELIK");if(p)p.yillikTutar=8000;
  p=findP("YASIR FURKAN KAVAK");if(p)p.izinTutar=2700;
  p=findP("HASAN IPEK");if(p)p.izinTutar=5800;
  p=findP("KAAN ATASOY");if(p)p.izinTutar=4800;
  p=findP("VAHDETTIN AVCI");if(p)p.izinTutar=2400;
  persist();renderListe();
}
(function(){
  var s=document.createElement("style");
  s.textContent='.sheetTab{width:100%;border-collapse:collapse;font-size:13px;background:#fff;color:#111}.sheetTab th{background:#e85d04;color:#fff;padding:7px 6px;text-align:left;font-weight:700;position:sticky;top:0}.sheetTab td{border:1px solid #f0c9a8;padding:4px 6px;background:#fff}.sheetTab tr:nth-child(even) td{background:#fff4ea}.sheetTab td.ad{white-space:nowrap;font-weight:600}.sheetTab input{border:1px solid #e0c4a8;border-radius:6px;background:#fff}#list{display:block!important}';
  document.head.appendChild(s);
})();
applyPdfData();
