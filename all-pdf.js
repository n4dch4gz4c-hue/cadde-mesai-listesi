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
  
  function calcMesai(p){
    return (p.mesaiSaat||0)*(p.mesaiBirim||300);
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
        var mesai=calcMesai(p);
        return {name:p.name,mesai:mesai,saat:p.mesaiSaat||0};
      });
      var total=people.reduce(function(a,x){return a+x.mesai;},0);
      var payCount=people.filter(function(x){return x.mesai>0;}).length;
      allData.push({branch:b,people:people,total:total,payCount:payCount,count:people.length});
      grandTotal+=total;
      grandCount+=people.length;
      grandPay+=payCount;
    });
    
    allData.forEach(function(d,idx){
      if(idx>0) doc.addPage();
      var y=12;
      
      doc.setFontSize(16);
      doc.setFont(undefined,"bold");
      doc.text(d.branch.toUpperCase()+" MESAI RAPORU",105,y,{align:"center"});
      y+=6;
      doc.setFontSize(9);
      doc.setFont(undefined,"normal");
      doc.text(new Date().toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"}),105,y,{align:"center"});
      y+=8;
      
      doc.setFillColor(31,75,143);
      doc.rect(14,y-4,182,12,"F");
      doc.setTextColor(255);
      doc.setFontSize(10);
      doc.text("TOPLAM: "+tl(d.total)+" TL  |  "+d.payCount+"/"+d.count+" kisi",105,y+3,{align:"center"});
      doc.setTextColor(0);
      y+=14;
      
      var rows=d.people.map(function(p,i){
        return [i+1,p.name,p.saat||"-",tl(p.mesai)];
      });
      rows.push(["","TOPLAM","",tl(d.total)]);
      
      doc.autoTable({
        startY:y,
        head:[["No","Ad Soyad","Saat","Mesai TL"]],
        body:rows,
        theme:"grid",
        styles:{fontSize:7,cellPadding:1,overflow:"linebreak"},
        headStyles:{fillColor:[196,92,38],textColor:255,fontSize:7},
        columnStyles:{0:{cellWidth:10},1:{cellWidth:90},2:{cellWidth:20,halign:"center"},3:{cellWidth:35,halign:"right"}},
        margin:{left:14,right:14},
        didParseCell:function(data){
          if(data.row.index===rows.length-1){
            data.cell.styles.fontStyle="bold";
            data.cell.styles.fillColor=[232,245,233];
          }
        }
      });
    });
    
    doc.addPage();
    var y=20;
    doc.setFontSize(18);
    doc.setFont(undefined,"bold");
    doc.text("GENEL OZET",105,y,{align:"center"});
    y+=15;
    
    doc.setFillColor(31,75,143);
    doc.rect(40,y-5,130,25,"F");
    doc.setTextColor(255);
    doc.setFontSize(14);
    doc.text("GENEL TOPLAM",105,y+2,{align:"center"});
    doc.setFontSize(16);
    doc.text(tl(grandTotal)+" TL",105,y+12,{align:"center"});
    doc.setTextColor(0);
    y+=35;
    
    var summaryRows=allData.map(function(d){
      return [d.branch,d.payCount+"/"+d.count,tl(d.total)];
    });
    summaryRows.push(["TOPLAM",grandPay+"/"+grandCount,tl(grandTotal)]);
    
    doc.autoTable({
      startY:y,
      head:[["Sube","Odeme","Toplam TL"]],
      body:summaryRows,
      theme:"grid",
      styles:{fontSize:10,cellPadding:3},
      headStyles:{fillColor:[31,75,143],textColor:255},
      columnStyles:{0:{cellWidth:60},1:{cellWidth:40,halign:"center"},2:{cellWidth:50,halign:"right"}},
      margin:{left:40},
      didParseCell:function(data){
        if(data.row.index===summaryRows.length-1){
          data.cell.styles.fontStyle="bold";
          data.cell.styles.fillColor=[232,245,233];
        }
      }
    });
    
    doc.save("Tum-Subeler-Mesai-"+new Date().toISOString().slice(0,10)+".pdf");
    if(typeof toast==="function") toast("PDF indirildi");
  };
  
  setTimeout(showBtn,500);
  setInterval(showBtn,2000);
})();
