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
  
  function calcPerson(p){
    var mesai=(p.mesaiSaat||0)*(p.mesaiBirim||300);
    var hs=(p.hsSaat||0)*2500;
    var yol=p.yolTutar||0;
    var izin=p.izinTutar||0;
    var yillik=p.yillikTutar||0;
    var dis=p.disiplinDk||0;
    return {mesai:mesai,hs:hs,yol:yol,izin:izin,yillik:yillik,dis:dis,toplam:mesai+hs+yol+izin+yillik+dis};
  }
  
  function tl(n){return n?n.toLocaleString("tr-TR"):"-";}
  
  window.generateAllPdf=function(){
    var {jsPDF}=window.jspdf;
    var doc=new jsPDF("p","mm","a4");
    var branches=["Kadıköy","Cadde","Çengelköy"];
    var allData=[];
    var grandTotal=0;
    var grandCount=0;
    var grandPay=0;
    
    branches.forEach(function(b){
      var data=getBranchData(b);
      if(!data||!data.people) return;
      var people=data.people.map(function(p){
        var c=calcPerson(p);
        return {name:p.name,c:c};
      });
      var total=people.reduce(function(a,x){return a+x.c.toplam;},0);
      var payCount=people.filter(function(x){return x.c.toplam>0;}).length;
      allData.push({branch:b,people:people,total:total,payCount:payCount,count:people.length});
      grandTotal+=total;
      grandCount+=people.length;
      grandPay+=payCount;
    });
    
    var y=15;
    doc.setFontSize(18);
    doc.setFont(undefined,"bold");
    doc.text("TÜM ŞUBELER MESAİ RAPORU",105,y,{align:"center"});
    y+=8;
    doc.setFontSize(10);
    doc.setFont(undefined,"normal");
    doc.text(new Date().toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"}),105,y,{align:"center"});
    y+=12;
    
    doc.setFillColor(31,75,143);
    doc.rect(14,y-5,182,18,"F");
    doc.setTextColor(255);
    doc.setFontSize(11);
    doc.text("GENEL TOPLAM: "+tl(grandTotal)+" TL",105,y+2,{align:"center"});
    doc.setFontSize(9);
    doc.text(grandCount+" kişi · "+grandPay+" ödeme",105,y+8,{align:"center"});
    doc.setTextColor(0);
    y+=22;
    
    allData.forEach(function(d){
      if(y>250){doc.addPage();y=15;}
      doc.setFillColor(196,92,38);
      doc.rect(14,y-4,182,8,"F");
      doc.setTextColor(255);
      doc.setFontSize(11);
      doc.setFont(undefined,"bold");
      doc.text(d.branch.toUpperCase()+" · "+tl(d.total)+" TL · "+d.payCount+"/"+d.count+" kişi",105,y+1,{align:"center"});
      doc.setTextColor(0);
      doc.setFont(undefined,"normal");
      y+=8;
      
      var rows=d.people.map(function(p,i){
        return [i+1,p.name,tl(p.c.toplam)];
      });
      rows.push(["","TOPLAM",tl(d.total)]);
      
      doc.autoTable({
        startY:y,
        head:[["No","Ad Soyad","Toplam"]],
        body:rows,
        theme:"grid",
        styles:{fontSize:8,cellPadding:1.5},
        headStyles:{fillColor:[31,75,143],textColor:255,fontSize:8},
        columnStyles:{0:{cellWidth:12},1:{cellWidth:120},2:{cellWidth:40,halign:"right"}},
        didParseCell:function(data){
          if(data.row.index===rows.length-1){
            data.cell.styles.fontStyle="bold";
            data.cell.styles.fillColor=[232,245,233];
          }
        }
      });
      y=doc.lastAutoTable.finalY+8;
    });
    
    doc.save("Tum-Subeler-Rapor-"+new Date().toISOString().slice(0,10)+".pdf");
    if(typeof toast==="function") toast("PDF indirildi");
  };
  
  setTimeout(showBtn,500);
  setInterval(showBtn,2000);
})();
