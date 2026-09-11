const GH_KEY="cadde_gh_cfg";
let _taps=0,_tapT=null;
function secretTap(){
  _taps++;
  clearTimeout(_tapT);
  _tapT=setTimeout(function(){_taps=0;},900);
  if(_taps>=3){
    _taps=0;
    var box=document.getElementById("ghBox");
    if(!box)return;
    box.classList.toggle("hide");
    ghLoadCfg();
    toast(box.classList.contains("hide")?"GitHub kapandi":"GitHub acildi");
  }
}
function ghSaveCfg(){
  localStorage.setItem(GH_KEY,JSON.stringify({
    token:document.getElementById("ghToken").value,
    repo:document.getElementById("ghRepo").value,
    path:document.getElementById("ghPath").value
  }));
  toast("Token kaydedildi");
}
function ghLoadCfg(){
  try{
    var c=JSON.parse(localStorage.getItem(GH_KEY)||"{}");
    if(c.token)document.getElementById("ghToken").value=c.token;
    if(c.repo)document.getElementById("ghRepo").value=c.repo;
    if(c.path)document.getElementById("ghPath").value=c.path;
  }catch(e){}
}
function toB64(s){return btoa(unescape(encodeURIComponent(s)));}
function fromB64(s){return decodeURIComponent(escape(atob(s)));}
async function ghPush(){
  var token=document.getElementById("ghToken").value.trim();
  var repo=document.getElementById("ghRepo").value.trim();
  var path=document.getElementById("ghPath").value.trim()||"cadde-data.json";
  if(!token||!repo){toast("Token ve repo gir");return;}
  var url="https://api.github.com/repos/"+repo+"/contents/"+path;
  var headers={Authorization:"Bearer "+token,Accept:"application/vnd.github+json"};
  var sha=null;
  try{
    var get=await fetch(url,{headers:headers});
    if(get.ok){var j=await get.json();sha=j.sha;}
  }catch(e){}
  var body={message:"Cadde bordro guncelleme "+new Date().toISOString(),content:toB64(JSON.stringify(state,null,2)),branch:"main"};
  if(sha)body.sha=sha;
  var put=await fetch(url,{method:"PUT",headers:Object.assign({"Content-Type":"application/json"},headers),body:JSON.stringify(body)});
  toast(put.ok?"GitHub gonderildi":"Gonderilemedi "+put.status);
}
async function ghPull(){
  var token=document.getElementById("ghToken").value.trim();
  var repo=document.getElementById("ghRepo").value.trim();
  var path=document.getElementById("ghPath").value.trim()||"cadde-data.json";
  if(!repo){toast("Repo gir");return;}
  var headers={Accept:"application/vnd.github+json"};
  if(token)headers.Authorization="Bearer "+token;
  var get=await fetch("https://api.github.com/repos/"+repo+"/contents/"+path,{headers:headers});
  if(!get.ok){toast("Cekilemedi "+get.status);return;}
  var j=await get.json();
  var data=JSON.parse(fromB64(j.content.replace(/\n/g,"")));
  state=hydratePeople(data);
  persist();
  renderListe();
  toast("GitHubdan cekildi");
}
