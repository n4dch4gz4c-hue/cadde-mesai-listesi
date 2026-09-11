function setF(id,key,val){var p=state.people.find(function(x){return x.id===id;});if(!p)return;p[key]=parseFloat(val)||0;if(key==="hsSaat")p.hsVar=p.hsSaat>0;if(key==="yolGun")p.yolVar=p.yolGun>0;persist();renderListe();if(typeof renderTopluHs==="function")renderTopluHs();}
function renderListe(){
  var people=visiblePeople();
  var all=state.people.map(calc);
  var sum=all.reduce(function(a,b){return a+b.toplam;},0);
  var poz=all.filter(function(x){return x.toplam>0;}).length;
  var st=document.getElementById("stats");
  if(st)st.innerHTML='<div class="stat"><span>Genel toplam</span><b>'+tl(sum)+'</b></div><div class="stat"><span>Odemesi olan</span><b>'+poz+' / '+state.people.length+'</b></div>';
  var h='<div style="overflow:auto"><table class="sheetTab"><thead><tr><th>No</th><th>Ad Soyad</th><th>Mesai</th><th>Mesai TL</th><th>HS</th><th>HS TL</th><th>Yol</th><th>Yol TL</th><th>Izin</th><th>Toplam</th></tr></thead><tbody>';
  people.forEach(function(p){
    var c=calc(p);
    var sira=state.people.findIndex(function(x){return x.id===p.id;})+1;
    h+='<tr><td>'+sira+'</td><td class="ad">'+p.name+(p.kurye?' K':'')+'</td>';
    h+='<td><input type="number" step="0.5" value="'+(p.mesaiSaat||0)+'" onchange="setF('+p.id+',\'mesaiSaat\',this.value)"></td>';
    h+='<td>'+(c.mesai?tl(c.mesai):'-')+'</td>';
    h+='<td><input type="number" step="0.5" value="'+(p.hsVar?(p.hsSaat||0):0)+'" onchange="setF('+p.id+',\'hsSaat\',this.value)"></td>';
    h+='<td>'+(c.hs?tl(c.hs):'-')+'</td>';
    h+='<td><input type="number" step="1" value="'+(p.yolVar?(p.yolGun||0):0)+'" onchange="setF('+p.id+',\'yolGun\',this.value)"></td>';
    h+='<td>'+(c.yol?tl(c.yol):'-')+'</td>';
    h+='<td><input type="number" step="100" value="'+(p.izinTutar||0)+'" onchange="setF('+p.id+',\'izinTutar\',this.value)"></td>';
    h+='<td><b>'+tl(c.toplam)+'</b></td></tr>';
  });
  h+='</tbody></table></div>';
  var box=document.getElementById("list");
  if(box){box.style.display='block';box.innerHTML=h;}
}
function renderTopluHs(){
  var box=document.getElementById("hsList");
  if(!box)return;
  box.style.display='block';
  var q=((document.getElementById("hsQ")||{}).value||"").toLocaleLowerCase("tr-TR");
  var list=state.people.filter(function(p){return !q||(p.name||"").toLocaleLowerCase("tr-TR").indexOf(q)>=0;});
  var h='<div style="overflow:auto"><table class="sheetTab"><thead><tr><th></th><th>No</th><th>Ad Soyad</th><th>HS adet</th><th>HS TL</th></tr></thead><tbody>';
  list.forEach(function(p){
    var saat=p.hsVar?(p.hsSaat||0):0;
    var sira=state.people.findIndex(function(x){return x.id===p.id;})+1;
    h+='<tr'+(saat>0?' class="on"':'')+'>
';
    h+='<td><input type="checkbox" class="hsChk" data-id="'+p.id+'" '+(saat>0?'checked':'')+'></td>';
    h+='<td>'+sira+'</td><td class="ad">'+p.name+'</td>';
    h+='<td><input type="number" step="0.5" value="'+saat+'" onchange="setF('+p.id+',\'hsSaat\',this.value)"></td>';
    h+='<td><b>'+(saat?tl(saat*1250):'-')+'</b></td></tr>';
  });
  h+='</tbody></table></div>';
  box.innerHTML=h;
}
(function(){
  var s=document.createElement("style");
  s.textContent='#list,#hsList{display:block!important;grid-template-columns:none!important}.sheetTab{width:100%;border-collapse:collapse;font-size:13px;background:#fff}.sheetTab th{background:#e85d04;color:#fff;padding:7px 6px;text-align:left;position:sticky;top:0}.sheetTab td{border:1px solid #f0c9a8;padding:4px 6px}.sheetTab tr:nth-child(even) td{background:#fff4ea}.sheetTab tr.on td{background:#ffe0c2}.sheetTab td.ad{white-space:nowrap;font-weight:600}.sheetTab input[type=number]{width:58px;padding:3px;border:1px solid #e0c4a8;border-radius:6px}';
  document.head.appendChild(s);
  renderListe();
  renderTopluHs();
})();
