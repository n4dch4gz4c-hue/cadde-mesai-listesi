(function(){
function tl(n){n=Math.round(n)||0;return n.toLocaleString("tr-TR");}
function loadBranch(name){
  try{
    var raw=localStorage.getItem("mesai_"+name);
    if(!raw) return null;
    var s=JSON.parse(raw);
    if(!s.people) return null;
    return s;
  }catch(e){return null;}
}
function calcTotals(s){
  if(!s||!s.people) return {toplam:0,mesai:0,izin:0,ceza:0,kisi:0};
  var toplam=0,mesai=0,izin=0,kisi=s.people.length;
  s.people.forEach(function(p){
    var m=typeof calc==="function"?calc(p):{toplam:0,mesai:0,izin:0};
    toplam+=m.toplam||0;
    mesai+=m.mesai||0;
    izin+=(m.izin||0)+(m.yillik||0);
  });
  var ceza=(s.cezalar||[]).reduce(function(a,c){return a+(c.tutar||0);},0);
  return {toplam,mesai,izin,ceza,kisi};
}
function pct(cur,prev){
  if(!prev||prev===0) return "";
  var d=((cur-prev)/prev*100);
  var sign=d>=0?"↑":"↓";
  var col=d>=0?"#0f7b4c":"#c45c26";
  return '<span style="color:'+col+';font-weight:700">'+sign+' '+Math.abs(d).toFixed(1)+'%</span>';
}
function renderDashboard(){
  var box=document.getElementById("dashboardBox");
  if(!box) return;
  var branches=["Kadıköy","Cadde","Çengelöy"];
  var data={};
  var all={toplam:0,mesai:0,izin:0,ceza:0,kisi:0};
  branches.forEach(function(b){
    var s=loadBranch(b);
    var t=calcTotals(s);
    data[b]=t;
    all.toplam+=t.toplam; all.mesai+=t.mesai; all.izin+=t.izin; all.ceza+=t.ceza; all.kisi+=t.kisi;
  });
  var prev=null;
  try{prev=JSON.parse(localStorage.getItem("mesai_prev_snapshot")||"null");}catch(e){}
  var prevAll=prev&&prev.all?prev.all:{toplam:0,mesai:0,izin:0,ceza:0};

  var html='<div style="padding:16px">';
  html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:16px">';
  branches.forEach(function(b){
    var t=data[b];
    var avg=t.kisi?Math.round(t.toplam/t.kisi):0;
    var color=b==="Kadıköy"?"#1f4b8f":b==="Cadde"?"#c45c26":"#0f7b4c";
    html+='<div style="background:#fff;border:1px solid #d7cfc3;border-radius:12px;padding:14px;border-top:4px solid '+color+'">';
    html+='<div style="font-weight:700;font-size:16px;margin-bottom:8px">'+b+'</div>';
    html+='<div style="font-size:22px;font-weight:800;color:'+color+'">'+tl(t.toplam)+' TL</div>';
    html+='<div style="font-size:13px;color:#666;margin-top:6px">Kişi: '+t.kisi+' · Ort: '+tl(avg)+' TL</div>';
    html+='</div>';
  });
  html+='</div>';

  html+='<div class="panel" style="margin:0 0 16px"><h3 style="margin:0 0 10px">Ay Karşılaştırması</h3>';
  html+='<table style="width:100%;border-collapse:collapse;font-size:14px"><tr style="background:#f8f6f2"><th style="text-align:left;padding:8px">Kalem</th><th style="text-align:right;padding:8px">Bu Ay</th><th style="text-align:right;padding:8px">Geçen Ay</th><th style="text-align:right;padding:8px">Değişim</th></tr>';
  function row(label,cur,prevv){
    return '<tr><td style="padding:8px;border-bottom:1px solid #eadfd2">'+label+'</td><td style="text-align:right;padding:8px;border-bottom:1px solid #eadfd2;font-weight:600">'+tl(cur)+' TL</td><td style="text-align:right;padding:8px;border-bottom:1px solid #eadfd2">'+(prevv?tl(prevv)+' TL':'-')+'</td><td style="text-align:right;padding:8px;border-bottom:1px solid #eadfd2">'+pct(cur,prevv)+'</td></tr>';
  }
  html+=row("Toplam",all.toplam,prevAll.toplam);
  html+=row("Mesai",all.mesai,prevAll.mesai);
  html+=row("İzin",all.izin,prevAll.izin);
  html+=row("Ceza",all.ceza,prevAll.ceza);
  html+='</table>';
  html+='<div style="margin-top:10px"><button class="btn" onclick="savePrevSnapshot()">Bu ayı geçen ay olarak kaydet</button></div>';
  html+='</div>';

  html+='<div class="panel" style="margin:0"><h3 style="margin:0 0 10px">Şube Bazında Toplam</h3>';
  var max=Math.max(data.Kadıköy.toplam,data.Cadde.toplam,data["Çengelöy"].toplam,1);
  branches.forEach(function(b){
    var t=data[b];
    var w=Math.round(t.toplam/max*100);
    var color=b==="Kadıköy"?"#1f4b8f":b==="Cadde"?"#c45c26":"#0f7b4c";
    html+='<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:13px"><span>'+b+'</span><b>'+tl(t.toplam)+' TL</b></div><div style="background:#eee;border-radius:6px;height:18px;overflow:hidden"><div style="background:'+color+';width:'+w+'%;height:100%"></div></div></div>';
  });
  html+='</div>';
  html+='</div>';
  box.innerHTML=html;
}
window.renderDashboard=renderDashboard;
window.savePrevSnapshot=function(){
  var branches=["Kadıköy","Cadde","Çengelöy"];
  var all={toplam:0,mesai:0,izin:0,ceza:0};
  branches.forEach(function(b){
    var t=calcTotals(loadBranch(b));
    all.toplam+=t.toplam; all.mesai+=t.mesai; all.izin+=t.izin; all.ceza+=t.ceza;
  });
  localStorage.setItem("mesai_prev_snapshot",JSON.stringify({all:all,saved:new Date().toISOString()}));
  toast("Geçen ay kaydedildi");
  renderDashboard();
};

var _tab=window.tab;
window.tab=function(el){
  if(_tab) _tab(el);
  var id=el.dataset.tab;
  if(id==="dashboard"){
    document.querySelectorAll(".tab[data-tab]").forEach(function(t){t.classList.toggle("on",t===el);});
    ["liste","kurye","devam","ceza","ozet","rapor","duzenle","dashboard"].forEach(function(s){
      var e=document.getElementById("sec-"+s); if(e) e.classList.toggle("hide",s!==id);
    });
    renderDashboard();
  }
};
})();
