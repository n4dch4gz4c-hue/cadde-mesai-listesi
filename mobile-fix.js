(function(){
var st=document.createElement("style");
st.id="mobileFixCss";
st.textContent="#mobileList{display:none}.mlist{background:#fff;border-top:1px solid #eadfd2}.mrow{border-bottom:1px solid #eadfd2}.mrow.pay{background:#fffdf8}.mhead{width:100%;display:flex;align-items:center;gap:10px;padding:11px 12px;border:0;background:transparent;text-align:left;font:inherit;cursor:pointer}.mno{width:28px;color:#8a7d6e;font-size:13px;flex:none}.mname{flex:1;font-weight:700;font-size:15px}.mtot{font-weight:800;font-size:15px;flex:none}.mfields{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 12px 12px}.mfields label{font-size:11px;color:#6b6258;display:flex;flex-direction:column;gap:3px}.mfields input{width:100%;box-sizing:border-box;font-size:16px;padding:8px 6px}@media(max-width:800px){.table-wrap{display:none}#mobileList{display:block;padding-bottom:88px}#sec-devam .table-wrap,#sec-rapor .table-wrap,#sec-ozet .table-wrap,#sec-duzenle .table-wrap{display:block!important}}";
document.head.appendChild(st);
window.openMob=window.openMob||null;
window.toggleMob=function(id,ev){
  if(ev&&ev.target&&ev.target.tagName==="INPUT")return;
  window.openMob=window.openMob===id?null:id;
  paintMob();
};
function paintMob(){
  var box=document.getElementById("mobileList");
  if(!box||typeof state==="undefined"||!state.people)return;
  var rows=(typeof visible==="function")?visible():state.people;
  var html="<div class='mlist'>";
  rows.forEach(function(p){
    var c=calc(p);
    var no=state.people.findIndex(function(x){return x.id===p.id;})+1;
    var on=window.openMob===p.id;
    html+="<div class='mrow "+(c.toplam>0?"pay":"")+(on?" on":"")+"'>";
    html+="<button type='button' class='mhead' onclick='toggleMob("+p.id+",event)'>";
    html+="<span class='mno'>"+no+"</span><span class='mname'>"+p.name+(p.kurye?" K":"")+"</span><span class='mtot'>"+dash(c.toplam)+"</span></button>";
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
