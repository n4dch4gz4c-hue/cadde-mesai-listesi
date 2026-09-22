(function(){
var st=document.createElement("style");
st.id="mobileFixCss";
st.textContent=[
"@media(max-width:800px){",
"html,body{background:linear-gradient(165deg,#0b1220 0%,#121a2b 45%,#0e1624 100%);color:#e8eef8;}",
"body{padding-bottom:env(safe-area-inset-bottom,12px);}",
"header.bar{position:sticky;top:0;z-index:20;padding:10px 12px 8px;background:rgba(12,18,32,.62);backdrop-filter:saturate(1.3) blur(18px);-webkit-backdrop-filter:saturate(1.3) blur(18px);border-bottom:1px solid rgba(255,255,255,.12);}",
"header.bar h1{font-size:18px;letter-spacing:.2px;color:#f3f7ff;}",
"#pageSub{margin:2px 0 0;font-size:12px;color:#9aa8c2;}",
"header.bar .row{width:100%;gap:6px;padding:8px 0 0;}",
"header.bar #q{flex:1;min-width:0;color:#e8eef8;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(8px);}",
"header.bar .btn{padding:8px 10px;font-size:13px;color:#e8eef8;background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.16);backdrop-filter:blur(8px);}",
"header.bar .btn.primary{background:rgba(59,130,246,.55);border-color:rgba(147,197,253,.35);}",
"header.bar .btn.sync{background:rgba(16,185,129,.42);border-color:rgba(110,231,183,.3);}",
"nav.tabs{position:sticky;top:86px;z-index:19;padding:6px 10px;gap:6px;background:rgba(12,18,32,.5);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.1);overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;}",
"nav.tabs .tab{flex:none;border-radius:999px;padding:7px 12px;font-size:13px;color:#d7e2f4;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);}",
"nav.tabs .tab.on{background:rgba(59,130,246,.72);color:#fff;border-color:transparent;box-shadow:0 8px 20px rgba(37,99,235,.28);}",
".stats{grid-template-columns:1fr 1fr;gap:8px;padding:10px 12px;}",
".stat{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 10px 28px rgba(0,0,0,.22);color:#e8eef8;}",
".stat span{font-size:11px;color:#9aa8c2;}",
".panel,.card,.pcard{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 12px 32px rgba(0,0,0,.24);margin:10px 12px;color:#e8eef8;}",
".table-wrap{display:none;}",
"#mobileList{display:block;padding:4px 12px 96px;}",
"#sec-devam .table-wrap,#sec-rapor .table-wrap,#sec-ozet .table-wrap,#sec-duzenle .table-wrap{display:block!important;padding:0 12px 24px;}",
"#sec-ozet table,#sec-rapor table,#sec-duzenle table{background:rgba(8,14,26,.55);color:#e8eef8;min-width:0;}",
"#sec-ozet th,#sec-rapor th{background:rgba(37,99,235,.75);}",
"#sec-ozet td,#sec-rapor td{border-color:rgba(255,255,255,.08);color:#e8eef8;}",
"#asFab,#asPanel{display:none!important;}",
"}",
".kmark{font-size:9px;font-weight:600;opacity:.65;margin-left:3px;vertical-align:super;}",
".mlist{display:flex;flex-direction:column;gap:8px;background:transparent;border:0;}",
".mrow{border:1px solid rgba(255,255,255,.14);border-radius:16px;background:rgba(255,255,255,.07);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 8px 22px rgba(0,0,0,.22);overflow:hidden;color:#e8eef8;}",
".mrow.pay{background:rgba(251,191,36,.1);border-color:rgba(251,191,36,.28);}",
".mrow.on{background:rgba(255,255,255,.12);box-shadow:0 12px 28px rgba(0,0,0,.3);}",
".mhead{width:100%;display:flex;align-items:center;gap:10px;padding:13px 14px;border:0;background:transparent;text-align:left;font:inherit;cursor:pointer;color:inherit;}",
".mno{width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:rgba(59,130,246,.22);color:#93c5fd;font-size:12px;font-weight:700;flex:none;}",
".mname{flex:1;font-weight:700;font-size:15px;letter-spacing:.1px;}",
".mtot{font-weight:800;font-size:15px;flex:none;color:#93c5fd;}",
".mrow.pay .mtot{color:#fbbf24;}",
".mfields{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 12px 14px;}",
".mfields label{font-size:11px;color:#9aa8c2;display:flex;flex-direction:column;gap:4px;}",
".mfields input{width:100%;box-sizing:border-box;font-size:16px;padding:9px 8px;color:#e8eef8;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.14);border-radius:10px;}"
].join("");
document.head.appendChild(st);
window.openMob=window.openMob||null;
window.toggleMob=function(id,ev){
  if(ev&&ev.target&&ev.target.tagName==="INPUT")return;
  window.openMob=window.openMob===id?null:id;
  paintMob();
};
function paintMob(){
  var box=document.getElementById("mobileList");
  if(!box) return;
  var list=null;
  try{ if(typeof visible==="function") list=visible(); }catch(e){}
  try{ if(!list && typeof state!=="undefined" && state.people) list=state.people; }catch(e){}
  try{ if(!list && window.state && window.state.people) list=window.state.people; }catch(e){}
  if(!list){
    try{
      var raw=localStorage.getItem("cadde_bordro_v4");
      if(raw) list=JSON.parse(raw).people||[];
    }catch(e){ list=[]; }
  }
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
(function wrap(){
  if(typeof renderListe!=="function"){ setTimeout(wrap,80); return; }
  if(renderListe._mob) return;
  var old=renderListe;
  renderListe=function(){ old(); paintMob(); };
  renderListe._mob=1;
  paintMob();
})();
setTimeout(paintMob,400);
setTimeout(paintMob,1400);
})();
