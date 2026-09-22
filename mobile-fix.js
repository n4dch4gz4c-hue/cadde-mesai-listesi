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
"#sec-ozet td.name,#sec-rapor td.name,.mname,.rrow .rn{color:#f8fbff!important;opacity:1!important;font-weight:700!important}",
"#sec-ozet td,#sec-rapor td{color:#e8eef8!important}",
"#sec-ozet th,#sec-rapor th{color:#fff!important}",
"@media(max-width:900px){",
"#sec-rapor table{display:none!important}",
"#raporMob{display:block;padding:0 12px 28px}",
".kalem{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 14px}",
".kitem{background:#1a2438;border:1px solid #2a3a55;border-radius:12px;padding:10px 12px;color:#f8fbff}",
".kitem span{display:block;font-size:11px;color:#9aa8c2;margin-bottom:4px}",
".kitem b{display:block;font-size:16px;color:#fff}",
".kitem em{display:block;font-size:11px;color:#93c5fd;font-style:normal;margin-top:2px}",
"}",
"@media(min-width:901px){#raporMob{display:none}}"
].join("");
document.head.appendChild(st);

window.openMob=window.openMob||null;
window.toggleMob=function(id,ev){
  if(ev&&ev.target&&ev.target.tagName==="INPUT")return;
  window.openMob=window.openMob===id?null:id;
  if(typeof paintMob==="function") paintMob();
};
function paintMob(){
  var box=document.getElementById("mobileList");
  if(!box) return;
  var list=[];
  try{ if(typeof visible==="function") list=visible(); }catch(e){}
  if(!list||!list.length){ try{ list=window.state&&window.state.people||[]; }catch(e){} }
  var all=list;
  try{ if(typeof state!=="undefined"&&state.people) all=state.people; }catch(e){}
  var html="<div class='mlist'>";
  list.forEach(function(p){
    var c=(typeof calc==="function")?calc(p):{toplam:0};
    var no=all.findIndex(function(x){return x.id===p.id;})+1;
    var on=window.openMob===p.id;
    var tot=(typeof dash==="function")?dash(c.toplam):Math.round(c.toplam||0);
    html+="<div class='mrow "+(c.toplam>0?"pay":"")+(on?" on":"")+"'>";
    html+="<button type='button' class='mhead' onclick='toggleMob("+p.id+",event)'>";
    html+="<span class='mno'>"+no+"</span><span class='mname'>"+p.name+(p.kurye?" <span class='kmark'>K</span>":"")+"</span><span class='mtot'>"+tot+"</span></button>";
    if(on){
      function field(lab,key,step){
        return "<label>"+lab+"<input type='number' step='"+step+"' value='"+(p[key]||"")+"' data-id='"+p.id+"' data-key='"+key+"'></label>";
      }
      html+="<div class='mfields'>";
      html+=field("Mesai","mesaiSaat","0.5")+field("HS","hsSaat","0.5")+field("Yol","yolTutar","1");
      html+=field("Izin g","izinGun","0.5")+field("Izin TL","izinTutar","1")+field("Yillik","yillikTutar","1");
      html+="</div>";
    }
    html+="</div>";
  });
  box.innerHTML=html+"</div>";
  box.onchange=function(ev){
    var el=ev.target; if(!el||!el.getAttribute)return;
    var id=+el.getAttribute("data-id"); var key=el.getAttribute("data-key");
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
  var s=(typeof sums==="function")?sums():{all:[],pay:[],toplam:0,mesai:0,hs:0,prim:0,yol:0,izin:0,yillik:0,dis:0};
  var kalem=[
    ["Hafta sonu",s.hs],["Izin",s.izin],["Yillik izin",s.yillik],
    ["Mesai",s.mesai],["Kurye prim",s.prim],["Yol",s.yol],["Disiplin",s.dis]
  ];
  var d=document.createElement("div");
  d.id="raporMob";
  var html="<h3 style='margin:8px 0 10px;color:#fff'>Kalem dagilimi</h3><div class='kalem'>";
  kalem.forEach(function(it){
    var pct=s.toplam?((it[1]/s.toplam)*100).toFixed(1):"0";
    html+="<div class='kitem'><span>"+it[0]+"</span><b>"+dash(it[1])+" TL</b><em>% "+pct+"</em></div>";
  });
  html+="<div class='kitem'><span>GENEL TOPLAM</span><b>"+tl(s.toplam)+" TL</b><em>% 100</em></div></div>";
  html+="<h3 style='margin:16px 0 10px;color:#fff'>Kisi kisi odeme</h3>";
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
  if(!renderListe._mob2){
    var old=renderListe;
    renderListe=function(){ old(); paintMob(); };
    renderListe._mob2=1;
  }
  if(typeof renderRapor==="function" && !renderRapor._mob2){
    var oldR=renderRapor;
    renderRapor=function(){ oldR(); paintRaporMob(); killAs(); };
    renderRapor._mob2=1;
  }
  paintMob();
})();
setTimeout(function(){ paintMob(); paintRaporMob(); killAs(); },500);
setTimeout(function(){ paintMob(); paintRaporMob(); killAs(); },1600);
})();
