(function(){
function killAs(){
  ["asFab","asPanel"].forEach(function(id){ var el=document.getElementById(id); if(el) el.remove(); });
}
killAs();
setInterval(killAs,800);

var st=document.createElement("style");
st.id="mobileFixCss";
st.textContent=[
"#asFab,#asPanel{display:none!important}",
"@media(max-width:900px){",
"html,body{background:#0b1220!important;color:#e8eef8!important}",
"header.bar{position:sticky;top:0;z-index:20;padding:10px 12px 8px;background:rgba(12,18,32,.75)!important;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.12)}",
"header.bar h1{font-size:18px;color:#f3f7ff}",
"#pageSub{margin:2px 0 0;font-size:12px;color:#9aa8c2}",
"header.bar .row{width:100%;gap:6px;padding:8px 0 0}",
"header.bar #q,header.bar .btn{background:rgba(255,255,255,.08)!important;border:1px solid rgba(255,255,255,.16)!important;color:#e8eef8!important}",
"header.bar .btn.primary{background:rgba(59,130,246,.6)!important}",
"header.bar .btn.sync{background:rgba(16,185,129,.45)!important}",
"nav.tabs{position:sticky;top:86px;z-index:19;padding:6px 10px;gap:6px;background:rgba(12,18,32,.55)!important;backdrop-filter:blur(14px);overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch}",
"nav.tabs .tab{flex:none;border-radius:999px;padding:7px 12px;font-size:13px;color:#d7e2f4;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14)}",
"nav.tabs .tab.on{background:rgba(59,130,246,.75)!important;color:#fff!important;border-color:transparent}",
".stats{grid-template-columns:1fr 1fr;gap:8px;padding:10px 12px}",
".stat{background:rgba(255,255,255,.08)!important;border:1px solid rgba(255,255,255,.14)!important;color:#e8eef8}",
".stat span{display:block;font-size:11px;color:#9aa8c2;margin-bottom:4px}",
".stat b{display:block;font-size:16px}",
".panel,.card,.pcard{background:rgba(255,255,255,.08)!important;border:1px solid rgba(255,255,255,.14)!important;color:#e8eef8;margin:10px 12px}",
".table-wrap{display:none}",
"#mobileList{display:block!important;padding:4px 12px 40px}",
"#sec-ozet .table-wrap,#sec-duzenle .table-wrap,#sec-devam .table-wrap{display:block!important;padding:0 12px 24px}",
"#sec-rapor .table-wrap,#sec-rapor table{display:none!important}",
"td.tot,tr.pay td.tot{background:#fbbf24!important;color:#111!important}",
"}",
".kmark{font-size:9px;font-weight:600;opacity:.7;margin-left:3px;vertical-align:super}",
".mlist{display:flex;flex-direction:column;gap:8px}",
".mrow{border:1px solid rgba(255,255,255,.14);border-radius:16px;background:rgba(255,255,255,.08);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);overflow:hidden;color:#e8eef8}",
".mrow.pay{background:rgba(251,191,36,.12);border-color:rgba(251,191,36,.3)}",
".mrow.on{background:rgba(255,255,255,.12)}",
".mhead{width:100%;display:flex;align-items:center;gap:10px;padding:13px 14px;border:0;background:transparent;text-align:left;font:inherit;cursor:pointer;color:inherit;box-sizing:border-box}",
".mno{width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:rgba(59,130,246,.22);color:#93c5fd;font-size:12px;font-weight:700;flex:none}",
".mname{flex:1;font-weight:700;font-size:15px;min-width:0}",
".mtot{font-weight:800;font-size:15px;flex:none;color:#93c5fd}",
".mrow.pay .mtot{color:#fbbf24}",
".mfields{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 12px 14px}",
".mfields label{font-size:11px;color:#9aa8c2;display:flex;flex-direction:column;gap:4px}",
".mfields input{width:100%;box-sizing:border-box;font-size:16px;padding:9px 8px;color:#e8eef8;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.14);border-radius:10px}",
".rrow{border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.08);padding:10px 12px;margin:0 0 8px;color:#e8eef8}",
".rrow.pay{background:rgba(251,191,36,.12);border-color:rgba(251,191,36,.35)}",
".rrow .rh{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}",
".rrow .rn{font-weight:700;font-size:14px;line-height:1.25}",
".rrow .rt{font-weight:800;font-size:15px;color:#fbbf24;flex:none}",
".rrow .rmeta{margin-top:6px;font-size:11px;color:#9aa8c2}",
".rrow .rmeta b{color:#e8eef8}",
"@media(min-width:901px){#raporMob{display:none}}"
].join("");
document.head.appendChild(st);

window.openMob=window.openMob||null;
window.toggleMob=function(id,ev){
  if(ev&&ev.target&&ev.target.tagName==="INPUT")return;
  window.openMob=window.openMob===id?null:id;
  paintMob();
};
function peopleList(){
  var list=null;
  try{ if(typeof visible==="function") list=visible(); }catch(e){}
  try{ if(!list && window.state && window.state.people) list=window.state.people; }catch(e){}
  if(!list){
    try{ var raw=localStorage.getItem("cadde_bordro_v4"); if(raw) list=JSON.parse(raw).people||[]; }catch(e){ list=[]; }
  }
  return list||[];
}
function paintMob(){
  var box=document.getElementById("mobileList");
  if(!box) return;
  var list=peopleList();
  var all=list;
  try{ if(typeof state!=="undefined" && state.people) all=state.people; }catch(e){}
  var html="<div class='mlist'>";
  list.forEach(function(p){
    var c=(typeof calc==="function")?calc(p):{toplam:0};
    var no=all.findIndex(function(x){return x.id===p.id;})+1;
    var on=window.openMob===p.id;
    var tot=(typeof dash==="function")?dash(c.toplam):(Math.round(c.toplam)||0);
    html+="<div class='mrow "+(c.toplam>0?"pay":"")+(on?" on":"")+"'>";
    html+="<button type='button' class='mhead' onclick='toggleMob("+p.id+",event)'>";
    html+="<span class='mno'>"+no+"</span><span class='mname'>"+p.name+(p.kurye?" <span class='kmark'>K</span>":"")+"</span><span class='mtot'>"+tot+"</span></button>";
    if(on){
      function field(lab,key,step){
        return "<label>"+lab+"<input type='number' step='"+step+"' value='"+(p[key]||"")+"' data-id='"+p.id+"' data-key='"+key+"'></label>";
      }
      html+="<div class='mfields'>";
      html+=field("Mesai","mesaiSaat","0.5");
      html+=field("HS","hsSaat","0.5");
      html+=field("Yol","yolTutar","1");
      html+=field("Izin g","izinGun","0.5");
      html+=field("Izin TL","izinTutar","1");
      html+=field("Yillik","yillikTutar","1");
      html+="</div>";
    }
    html+="</div>";
  });
  box.innerHTML=html+"</div>";
  box.onchange=function(ev){
    var el=ev.target;
    if(!el||!el.getAttribute)return;
    var id=+el.getAttribute("data-id");
    var key=el.getAttribute("data-key");
    if(id&&key&&typeof setVal==="function") setVal(id,key,el.value);
  };
}
window.paintMob=paintMob;
function paintRaporMob(){
  var root=document.getElementById("raporBox");
  if(!root) return;
  var old=document.getElementById("raporMob");
  if(old) old.remove();
  if(window.innerWidth>900) return;
  var s=(typeof sums==="function")?sums():{all:[]};
  var d=document.createElement("div");
  d.id="raporMob";
  var html="";
  (s.all||[]).forEach(function(x,i){
    var c=x.c,p=x.p;
    var bits=[];
    if(c.mesai) bits.push("Mesai <b>"+dash(c.mesai)+"</b>");
    if(c.hs) bits.push("HS <b>"+dash(c.hs)+"</b>");
    if(c.izin||c.yillik) bits.push("Izin <b>"+dash((c.izin||0)+(c.yillik||0))+"</b>");
    if(c.prim||c.yol||c.dis) bits.push("Diger <b>"+dash((c.prim||0)+(c.yol||0)+(c.dis||0))+"</b>");
    html+="<div class='rrow "+(c.toplam>0?"pay":"")+"'><div class='rh'><div class='rn'>"+(i+1)+". "+p.name+(p.kurye?" <span class='kmark'>K</span>":"")+"</div><div class='rt'>"+dash(c.toplam)+"</div></div>";
    if(bits.length) html+="<div class='rmeta'>"+bits.join(" \u00b7 ")+"</div>";
    html+="</div>";
  });
  d.innerHTML=html;
  root.appendChild(d);
}
window.paintRaporMob=paintRaporMob;
(function wrap(){
  if(typeof renderListe!=="function"){ setTimeout(wrap,80); return; }
  if(!renderListe._mob){
    var old=renderListe;
    renderListe=function(){ old(); paintMob(); };
    renderListe._mob=1;
  }
  if(typeof renderRapor==="function" && !renderRapor._mob){
    var oldR=renderRapor;
    renderRapor=function(){ oldR(); paintRaporMob(); killAs(); };
    renderRapor._mob=1;
  }
  paintMob();
})();
setTimeout(function(){ paintMob(); paintRaporMob(); killAs(); },400);
setTimeout(function(){ paintMob(); paintRaporMob(); killAs(); },1400);
})();
