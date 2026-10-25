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
  
  function fixTr(s){
    if(!s) return "";
    return s.replace(/ğ/g,"g").replace(/Ğ/g,"G").replace(/ü/g,"u").replace(/Ü/g,"U").replace(/ş/g,"s").replace(/Ş/g,"S").replace(/ı/g,"i").replace(/İ/g,"I").replace(/ö/g,"o").replace(/Ö/g,"O").replace(/ç/g,"c").replace(/Ç/g,"C");
  }
  
  window.generateAllPdf=function(){
    var {jsPDF}=window.jspdf;
    var doc=new jsPDF("p","mm","a4");
    var branches=["Kadikoy","Cadde","Cengelkoy"];
    var branchNames=["Kadıköy","Cadde","Çengelköy"];
    var allData=[];
    
    branches.forEach(function(b,idx){
      var data=getBranchData(branchNames[idx]);
      if(!data||!data.people) return;
      var people=data.people.map(function(p){
        var mesai=calcMesai(p);
        return {name:fixTr(p.name),mesai:mesai,saat:p.mesaiSaat||0};
      });
      var total=people.reduce(function(a,x){return a+x.mesai;},0);
      var payCount=people.filter(function(x){return x.mesai>0;}).length;
      allData.push({branch:b,people:people,total:total,payCount:payCount,count:people.length});
    });
    
    allData.forEach(function(d,idx){
      if(idx>0) doc.addPage();
      var y=10;
      
      doc.setFontSize(14);
      doc.setFont(undefined,"bold");
      doc.text(d.branch.toUpperCase()+" MESAI RAPORU",105,y,{align:"center"});
      y+=5;
      doc.setFontSize(8);
      doc.setFont(undefined,"normal");
      doc.text(new Date().toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"}),105,y,{align:"center"});
      y+=6;
      
      doc.setFillColor(31,75,143);
      doc.rect(14,y-3,182,8,"F");
      doc.setTextColor(255);
      doc.setFontSize(9);
      doc.text("TOPLAM: "+tl(d.total)+" TL  |  "+d.payCount+"/"+d.count+" kisi",105,y+2,{align:"center"});
      doc.setTextColor(0);
      y+=10;
      
      var rows=d.people.map(function(p,i){
        return [i+1,p.name,p.saat||"-",tl(p.mesai)];
      });
      rows.push(["","TOPLAM","",tl(d.total)]);
      
      doc.autoTable({
        startY:y,
        head:[["No","Ad Soyad","Saat","Mesai TL"]],
        body:rows,
        theme:"grid",
        styles:{fontSize:6,cellPadding:0.8,overflow:"linebreak"},
        headStyles:{fillColor:[196,92,38],textColor:255,fontSize:6},
        columnStyles:{0:{cellWidth:8},1:{cellWidth:100},2:{cellWidth:18,halign:"center"},3:{cellWidth:30,halign:"right"}},
        margin:{left:14,right:14,top:5,bottom:5},
        didParseCell:function(data){
          if(data.row.index===rows.length-1){
            data.cell.styles.fontStyle="bold";
            data.cell.styles.fillColor=[232,245,233];
          }
        }
      });
    });
    
    doc.save("Tum-Subeler-Mesai-"+new Date().toISOString().slice(0,10)+".pdf");
    if(typeof toast==="function") toast("PDF indirildi");
  };
  
  setTimeout(showBtn,500);
  setInterval(showBtn,2000);
})();
