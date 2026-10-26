(function(){
  var USERS={
    "1903":{name:"Semih Sofuoğlu",role:"admin",branches:["Kadıköy","Cadde","Çengelöy"]},
    "1905":{name:"Alper Kızılkaya",role:"admin",branches:["Kadıköy","Cadde","Çengelöy"]},
    "367536":{name:"Özay Alşan",role:"branch",branches:["Kadıköy"]},
    "345334":{name:"Sedat Kızılkaya",role:"branch",branches:["Kadıköy"]},
    "5353":{name:"Ahmet Özçelik",role:"branch",branches:["Çengelöy"]},
    "1919":{name:"Kemal Körpe",role:"branch",branches:["Çengelöy"]},
    "3434":{name:"İsmail",role:"branch",branches:["Çengelöy"]},
    "5656":{name:"Ferhat Avcı",role:"branch",branches:["Cadde"]}
  };
  
  var currentUser=null;
  
  function showLogin(){
    var overlay=document.createElement("div");
    overlay.id="loginOverlay";
    overlay.innerHTML='<div style="position:fixed;inset:0;background:#0b1220;display:flex;align-items:center;justify-content:center;z-index:9999"><div style="background:#fff;padding:32px;border-radius:16px;width:320px;text-align:center"><h2 style="margin:0 0 16px;color:#0b1220">Giriş</h2><input id="loginPass" type="password" placeholder="Şifre" style="width:100%;padding:12px;font-size:18px;border:1px solid #ddd;border-radius:8px;margin-bottom:12px;text-align:center"/><button onclick="doLogin()" style="width:100%;padding:12px;background:#1f4b8f;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer">Giriş Yap</button><p id="loginError" style="color:#c00;margin:12px 0 0;font-size:14px"></p></div></div>';
    document.body.appendChild(overlay);
    document.getElementById("loginPass").focus();
    document.getElementById("loginPass").onkeydown=function(e){if(e.key==="Enter")doLogin();};
  }
  
  window.doLogin=function(){
    var pass=document.getElementById("loginPass").value.trim();
    var user=USERS[pass];
    if(!user){
      document.getElementById("loginError").textContent="Yanlış şifre";
      return;
    }
    currentUser=user;
    sessionStorage.setItem("mesaiUser",JSON.stringify(user));
    document.getElementById("loginOverlay").remove();
    initApp();
  };
  
  function applyRoleUI(){
    var btn=document.querySelector("button[onclick='openDashboard()']");
    if(btn){
      btn.style.display=(currentUser && currentUser.role==="admin")?"":"none";
    }
  }
  
  function initApp(){
    if(!currentUser)return;
    window.BRANCHES=currentUser.branches;
    window.currentBranch=currentUser.branches[0];
    localStorage.setItem("currentBranch",window.currentBranch);
    if(typeof KEY!=="undefined") KEY="mesai_"+window.currentBranch;
    if(typeof renderBranchBar==="function") renderBranchBar();
    if(typeof load==="function") load();
    var sub=document.getElementById("pageSub");
    if(sub) sub.textContent=currentUser.name+" · "+currentUser.branches.join(", ");
    applyRoleUI();
  }
  
  function checkSession(){
    var saved=sessionStorage.getItem("mesaiUser");
    if(saved){
      try{
        currentUser=JSON.parse(saved);
        initApp();
        return true;
      }catch(e){}
    }
    return false;
  }
  
  window.logout=function(){
    sessionStorage.removeItem("mesaiUser");
    location.reload();
  };
  
  window.isAdmin=function(){ return currentUser && currentUser.role==="admin"; };
  
  var _renderBranchBar=window.renderBranchBar;
  window.renderBranchBar=function(){
    if(!currentUser) return;
    var h="";
    currentUser.branches.forEach(function(b){
      h+='<button class="'+(b===window.currentBranch?"active":"")+'" onclick="selectBranch(\''+b+'\')">'+b+'</button>';
    });
    var bar=document.getElementById("branchBar");
    if(bar) bar.innerHTML=h;
    var isCadde=window.currentBranch==="Cadde";
    var k=document.getElementById("tabKurye");
    if(k) k.style.display=isCadde?"":"none";
    var kl=document.getElementById("kuryeLabel");
    if(kl) kl.style.display=isCadde?"":"none";
  };
  
  if(!checkSession()){
    document.addEventListener("DOMContentLoaded",showLogin);
    if(document.readyState!=="loading") showLogin();
  } else {
    setTimeout(applyRoleUI, 100);
  }
})();
