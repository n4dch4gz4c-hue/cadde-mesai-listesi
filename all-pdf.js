(function(){
  function isAdmin(){
    try{
      var user=JSON.parse(sessionStorage.getItem("mesaiUser")||"{}");
      return user.role==="admin";
    }catch(e){return false;}
  }
  
  function showBtn(){
    var btn=document.getElementById("allPdfBtn");
    if(!btn) return;
    if(isAdmin()) btn.classList.remove("hide");
    else btn.classList.add("hide");
  }
  
  function getBranchData(branch){
    var key="mesai_"+branch;
    try{
      var raw=localStorage.getItem(key);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch(e){return null;}
  }
  
  function calc(p){
    var mesai=(p.mesaiSaat||0)*(p.mesaiBirim||300);
    var hs=(p.hsSaat||0)*2500;
    var prim=p.kurye?(p.primAdet||0)*7:0;
    var yol=p.yolTutar||0;
    var izin=p.izinTutar||0;
    var yillik=p.yillikTutar||0;
    var dis=(p.disiplinDk||0)*1;
    return {mesai:mesai,hs:hs,prim:prim,yol:yol,izin:izin,yillik:yillik,dis:dis,toplam:mesai+hs+prim+yol+izin+yillik+dis};
  }
  
  function tl(n){return Math.round(n||0).toLocaleString("tr-TR");}
  
  window.generateAllPdf=async function(){
    var {jsPDF}=window.jspdf;
    var doc=new jsPDF("p","mm","a4");
    
    var hasFont=false;
    try{
      if(typeof ensurePdfFont==="function"){
        hasFont=await ensurePdfFont(doc);
      }
    }catch(e){}
    
    var fontName=hasFont?"DejaVu":"helvetica";
    
    var branches=["Kadıköy","Cadde","Çengelköy"];
    var allData=[];
    var grandTotal=0;
    var grandCount=0;
    var grandPay=0;
    var giderler={mesai:0,hs:0,prim:0,yol:0,izin:0,yillik:0,dis:0};
    
    branches.forEach(function(b){
      var data=getBranchData(b);
      if(!data||!data.people) return;
      var people=data.people.map(function(p){
        var c=calc(p);
        return {name:p.name,c:c};
      });
      var total=people.reduce(function(a,x){return a+x.c.toplam;},0);
      var payCount=people.filter(function(x){return x.c.toplam>0;}).length;
      
      people.forEach(function(p){
        giderler.mesai+=p.c.mesai;
        giderler.hs+=p.c.hs;
        giderler.prim+=p.c.prim;
        giderler.yol+=p.c.yol;
        giderler.izin+=p.c.izin;
        giderler.yillik+=p.c.yillik;
        giderler.dis+=p.c.dis;
      });
      
      allData.push({branch:b,people:people,total:total,payCount:payCount,count:people.length});
      grandTotal+=total;
      grandCount+=people.length;
      grandPay+=payCount;
    });
    
    doc.setFont(fontName,"normal");
    var y=15;
    doc.setFontSize(18);
    doc.setFont(fontName,"bold");
    doc.text("AYLIK MESAİ RAPORU",105,y,{align:"center"});
    y+=8;
    doc.setFontSize(10);
    doc.setFont(fontName,"normal");
    doc.text(new Date().toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"}),105,y,{align:"center"});
    y+=15;
    
    doc.setFillColor(31,75,143);
    doc.rect(20,y-5,170,20,"F");
    doc.setTextColor(255);
    doc.setFontSize(14);
    doc.setFont(fontName,"bold");
    doc.text("GENEL TOPLAM",105,y+2,{align:"center"});
    doc.setFontSize(16);
    doc.text(tl(grandTotal)+" TL",105,y+10,{align:"center"});
    doc.setTextColor(0);
    y+=25;
    
    doc.setFontSize(12);
    doc.setFont(fontName,"bold");
    doc.text("GİDER DAĞILIMI",14,y);
    y+=8;
    
    var giderRows=[
      ["Mesai",tl(giderler.mesai)],
      ["Hafta Sonu",tl(giderler.hs)],
      ["Prim",tl(giderler.prim)],
      ["Yol",tl(giderler.yol)],
      ["İzin",tl(giderler.izin)],
      ["Yıllık",tl(giderler.yillik)],
      ["Disiplin",tl(giderler.dis)],
      ["TOPLAM",tl(grandTotal)]
    ];
    
    doc.autoTable({
      startY:y,
      head:[["Kalem","Tutar (TL)"]],
      body:giderRows,
      theme:"grid",
      styles:{fontSize:9,cellPadding:3,font:fontName},
      headStyles:{fillColor:[31,75,143],textColor:255,font:fontName},
      columnStyles:{0:{cellWidth:80},1:{cellWidth:50,halign:"right"}},
      margin:{left:14},
      didParseCell:function(data){
        if(data.row.index===giderRows.length-1){
          data.cell.styles.fontStyle="bold";
          data.cell.styles.fillColor=[232,245,233];
        }
      }
    });
    y=doc.lastAutoTable.finalY+15;
    
    doc.setFontSize(12);
    doc.setFont(fontName,"bold");
    doc.text("ŞUBE BAZLI ÖZET",14,y);
    y+=8;
    
    var subeRows=allData.map(function(d){
      return [d.branch,d.payCount+"/"+d.count,tl(d.total)];
    });
    subeRows.push(["TOPLAM",grandPay+"/"+grandCount,tl(grandTotal)]);
    
    doc.autoTable({
      startY:y,
      head:[["Şube","Ödeme","Toplam (TL)"]],
      body:subeRows,
      theme:"grid",
      styles:{fontSize:9,cellPadding:3,font:fontName},
      headStyles:{fillColor:[196,92,38],textColor:255,font:fontName},
      columnStyles:{0:{cellWidth:60},1:{cellWidth:40,halign:"center"},2:{cellWidth:50,halign:"right"}},
      margin:{left:14},
      didParseCell:function(data){
        if(data.row.index===subeRows.length-1){
          data.cell.styles.fontStyle="bold";
          data.cell.styles.fillColor=[232,245,233];
        }
      }
    });
    
    allData.forEach(function(d){
      doc.addPage();
      var y=15;
      
      doc.setFont(fontName,"bold");
      doc.setFontSize(16);
      doc.text(d.branch.toUpperCase(),105,y,{align:"center"});
      y+=8;
      
      doc.setFillColor(31,75,143);
      doc.rect(14,y-4,182,12,"F");
      doc.setTextColor(255);
      doc.setFontSize(11);
      doc.text("TOPLAM: "+tl(d.total)+" TL  |  "+d.payCount+"/"+d.count+" kişi",105,y+3,{align:"center"});
      doc.setTextColor(0);
      doc.setFont(fontName,"normal");
      y+=14;
      
      var rows=d.people.map(function(p,i){
        return [i+1,p.name,tl(p.c.toplam)];
      });
      rows.push(["","TOPLAM",tl(d.total)]);
      
      doc.autoTable({
        startY:y,
        head:[["No","Ad Soyad","Ay Sonu (TL)"]],
        body:rows,
        theme:"grid",
        styles:{fontSize:8,cellPadding:1.5,font:fontName},
        headStyles:{fillColor:[196,92,38],textColor:255,fontSize:8,font:fontName},
        columnStyles:{0:{cellWidth:12},1:{cellWidth:110},2:{cellWidth:40,halign:"right"}},
        margin:{left:14,right:14},
        didParseCell:function(data){
          if(data.row.index===rows.length-1){
            data.cell.styles.fontStyle="bold";
            data.cell.styles.fillColor=[232,245,233];
          }
        }
      });
    });
    
    doc.save("Aylik-Rapor-"+new Date().toISOString().slice(0,10)+".pdf");
    if(typeof toast==="function") toast("PDF indirildi");
  };
  
  setTimeout(showBtn,500);
  setInterval(showBtn,2000);
})();
