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
  if(!prev||prev===0) return "-";
  var d=((cur-prev)/prev*100);
  var sign=d>=0?"↑":"↓";
  var col=d>=0?"#0f7b4c":"#c45c26";
  return '<span style="color:'+col+';font-weight:700;font-size:13px">'+sign+' '+Math.abs(d).toFixed(1)+'%</span>';
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

  var colors={Kadıköy:"#1f4b8f",Cadde:"#c45c26",Çengelöy:"#0f7b4c"};
  var icons={Kadıköy:"📍",Cadde:"🏪",Çengelöy:"🌿"};

  var html='<div style="padding:12px 16px 24px;background:#f4f1ea;min-height:70vh">';

  // Üst kartlar
  html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-bottom:16px">';
  branches.forEach(function(b){
    var t=data[b];
    var avg=t.kisi?Math.round(t.toplam/t.kisi):0;
    var c=colors[b];
    html+='<div style="background:#fff;border-radius:14px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,.06);border-top:5px solid '+c+'">';
    html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><span style="font-size:20px">'+icons[b]+'</span><span style="font-weight:700;font-size:16px;color:#111">'+b+'</span></div>';
    html+='<div style="font-size:12px;color:#666;margin-bottom:2px">Toplam Ödenecek</div>';
    html+='<div style="font-size:26px;font-weight:800;color:'+c+';line-height:1.1">'+tl(t.toplam)+' TL</div>';
    html+='<div style="display:flex;justify-content:space-between;margin-top:12px;font-size:13px;color:#444"><span>👤 Kişi Sayısı</span><b>'+t.kisi+'</b></div>';
    html+='<div style="display:flex;justify-content:space-between;margin-top:4px;font-size:13px;color:#444"><span>📊 Ortalama</span><b>'+tl(avg)+' TL</b></div>';
    html+='</div>';
  });
  html+='</div>';

  // Ay karşılaştırması
  html+='<div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)">';
  html+='<div style="font-weight:700;font-size:16px;margin-bottom:12px">Ay Karşılaştırması</div>';
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 80px;gap:8px;font-size:13px;color:#666;margin-bottom:6px;padding:0 4px"><div>📅 Bu Ay</div><div>📅 Geçen Ay</div><div></div></div>';
  function cmpRow(label,icon,cur,prevv){
    return '<div style="display:grid;grid-template-columns:1fr 1fr 90px;gap:8px;align-items:center;padding:8px 4px;border-bottom:1px solid #f0ebe3"><div style="display:flex;align-items:center;gap:6px"><span>'+icon+'</span><span>'+label+'</span><b style="margin-left:auto">'+tl(cur)+' TL</b></div><div style="text-align:right;color:#555">'+(prevv?tl(prevv)+' TL':'-')+'</div><div style="text-align:right">'+pct(cur,prevv)+'</div></div>';
  }
  html+=cmpRow("Toplam","💰",all.toplam,prevAll.toplam);
  html+=cmpRow("Mesai","⏱️",all.mesai,prevAll.mesai);
  html+=cmpRow("İzin","🏠",all.izin,prevAll.izin);
  html+=cmpRow("Ceza","⚠️",all.ceza,prevAll.ceza);
  html+='<div style="margin-top:12px;text-align:right"><button class="btn" style="font-size:13px;padding:6px 12px" onclick="savePrevSnapshot()">Bu ayı geçen ay olarak kaydet</button></div>';
  html+='</div>';

  // Bar chart
  html+='<div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)">';
  html+='<div style="font-weight:700;font-size:16px;margin-bottom:12px">Şube Bazında Toplam Ödenecek</div>';
  var max=Math.max(data.Kadıköy.toplam,data.Cadde.toplam,data["Çengelöy"].toplam,1);
  branches.forEach(function(b){
    var t=data[b];
    var w=Math.max(8,Math.round(t.toplam/max*100));
    var c=colors[b];
    html+='<div style="margin-bottom:10px">';
    html+='<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:50%;background:'+c+'"></span>'+b+'</span><b>'+tl(t.toplam)+' TL</b></div>';
    html+='<div style="background:#eee;border-radius:8px;height:22px;overflow:hidden"><div style="background:'+c+';width:'+w+'%;height:100%;border-radius:8px"></div></div>';
    html+='</div>';
  });
  html+='</div>';

  // Uyarılar
  var missingIzin=0;
  branches.forEach(function(b){
    var s=loadBranch(b);
    if(s&&s.people) s.people.forEach(function(p){ if((p.izinGun||0)>0 && !(p.izinBirim||p.izinTutar)) missingIzin++; });
  });
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
  html+='<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px;font-size:13px"><span style="color:#c45c26;font-weight:700">⚠️ '+(missingIzin||0)+' kişide izin birim eksik</span><div style="color:#666;font-size:12px;margin-top:4px">İzin girişlerinde birim bilgisi eksik.</div></div>';
  html+='<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:12px;font-size:13px"><span style="color:#c45c26;font-weight:700">⚠️ Ceza kontrolü</span><div style="color:#666;font-size:12px;margin-top:4px">Ceza girişi yapılmayan şube var mı kontrol et.</div></div>';
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
})();
