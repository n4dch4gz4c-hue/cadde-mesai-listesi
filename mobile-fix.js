(function(){
function killAs(){
  ["asFab","asPanel","asHead","asMsgs","asForm"].forEach(function(id){
    var el=document.getElementById(id); if(el) el.remove();
  });
  document.querySelectorAll('button').forEach(function(b){
    var t=(b.textContent||"").trim();
    if(t==="+" && (b.id==="asFab" || getComputedStyle(b).position==="fixed")) b.remove();
  });
}
killAs();
setInterval(killAs,400);

var st=document.createElement("style");
st.id="mobileFixCss";
st.textContent=[
"#asFab,#asPanel{display:none!important}",
"@media(max-width:900px){",
"html.night,html.night body{background:#0b1220!important;color:#e8eef8!important}",
"html.night td.tot,html.night tr.pay td.tot{background:#fbbf24!important;color:#111!important}",
"html.night td{color:#e8eef8!important}",
"html.night td.name{color:#f3f7ff!important}",
"html.night #sec-rapor table{min-width:0!important;width:100%!important;display:none!important}",
"html.night #sec-rapor .table-wrap{display:none!important}",
"#raporMob{display:block;padding:0 12px 28px}",
".rrow{border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.08);padding:10px 12px;margin:0 0 8px;color:#e8eef8}",
".rrow.pay{background:rgba(251,191,36,.12);border-color:rgba(251,191,36,.35)}",
".rrow .rh{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}",
".rrow .rn{font-weight:700;font-size:14px;line-height:1.25}",
".rrow .rt{font-weight:800;font-size:15px;color:#fbbf24;flex:none}",
".rrow .rmeta{display:flex;flex-wrap:wrap;gap:6px 10px;margin-top:6px;font-size:11px;color:#9aa8c2}",
".rrow .rmeta b{color:#e8eef8;font-weight:700}",
"}",
"@media(min-width:901px){#raporMob{display:none}}",
"#asFab,#asPanel{display:none!important}"
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
  try{ if(!list && window.state && window.state.people) list=window.state.people; }catch(e){}
  if(!list){
    try{ var raw=localStorage.getItem("cadde_bordro_v4"); if(raw) list=JSON.parse(raw).people||[]; }catch(e){ list=[]; }
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

function paintRaporMob(){
  var root=document.getElementById("raporBox");
  if(!root) return;
  var old=document.getElementById("raporMob");
  if(old) old.remove();
  if(window.innerWidth>900) return;
  var s=(typeof sums==="function")?sums():{all:[],pay:[],toplam:0};
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
    if(bits.length) html+="<div class='rmeta'>"+bits.join(" · ")+"</div>";
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
setTimeout(function(){ paintMob(); paintRaporMob(); killAs(); },500);
setTimeout(function(){ paintMob(); paintRaporMob(); killAs(); },1600);
})();
