const GH_KEY="cadde_gh_cfg";
const GH_DEFAULT_REPO="n4dch4gz4c-hue/cadde-mesai-listesi";
const GH_DEFAULT_PATH="cadde-data.json";
const GH_RAW="https://raw.githubusercontent.com/n4dch4gz4c-hue/cadde-mesai-listesi/main/cadde-data.json";
let _taps=0,_tapT=null;
function secretTap(){
  _taps++;
  clearTimeout(_tapT);
  _tapT=setTimeout(function(){_taps=0;},900);
  if(_taps>=3){ _taps=0; toggleGhBox(); }
}
function toggleGhBox(forceOpen){
  var box=document.getElementById("ghBox");
  if(!box)return;
  if(forceOpen) box.classList.remove("hide");
  else box.classList.toggle("hide");
  ghLoadCfg();
}
function ghSaveCfg(){
  localStorage.setItem(GH_KEY,JSON.stringify({
    token:(document.getElementById("ghToken")||{}).value||"",
    repo:(document.getElementById("ghRepo")||{}).value||GH_DEFAULT_REPO,
    path:(document.getElementById("ghPath")||{}).value||GH_DEFAULT_PATH
  }));
  toast("Anahtar kaydedildi");
}
function ghLoadCfg(){
  try{
    var c=JSON.parse(localStorage.getItem(GH_KEY)||"{}");
    var tok=document.getElementById("ghToken");
    var repo=document.getElementById("ghRepo");
    var path=document.getElementById("ghPath");
    if(tok)tok.value=c.token||"";
    if(repo)repo.value=c.repo||GH_DEFAULT_REPO;
    if(path)path.value=c.path||GH_DEFAULT_PATH;
  }catch(e){}
}
function ghCfg(){
  try{return JSON.parse(localStorage.getItem(GH_KEY)||"{}");}catch(e){return {};}
}
function ghToken(){
  return (((document.getElementById("ghToken")||{}).value)||ghCfg().token||"").trim();
}
function ghHasToken(){return !!ghToken();}
function toB64(s){return btoa(unescape(encodeURIComponent(s)));}
function fromB64(s){return decodeURIComponent(escape(atob(s)));}
async function ghPush(){
  var token=ghToken();
  var repo=(ghCfg().repo||GH_DEFAULT_REPO).trim();
  var path=(ghCfg().path||GH_DEFAULT_PATH).trim();
  if(!token){
    toggleGhBox(true);
    toast("Once senkron anahtarini yaz");
    return false;
  }
  state.updatedAt=new Date().toISOString();
  persist();
  var url="https://api.github.com/repos/"+repo+"/contents/"+path;
  var headers={Authorization:"Bearer "+token,Accept:"application/vnd.github+json"};
  var sha=null;
  try{
    var get=await fetch(url,{headers:headers});
    if(get.ok){var j=await get.json();sha=j.sha;}
  }catch(e){}
  var body={message:"Cadde kaydet "+state.updatedAt,content:toB64(JSON.stringify(state)),branch:"main"};
  if(sha)body.sha=sha;
  var put=await fetch(url,{method:"PUT",headers:Object.assign({"Content-Type":"application/json"},headers),body:JSON.stringify(body)});
  if(put.ok) toast("Sunucuya kaydedildi");
  else toast("Kaydedilemedi "+put.status);
  return put.ok;
}
async function applyRemote(data,msg){
  if(!data||!data.people||!data.people.length){toast("Sunucu bos");return false;}
  state=hydrate(data);
  persist();
  renderAll();
  toast(msg||"Sunucudan cekildi");
  return true;
}
async function ghPullPublic(){
  var urls=[
    GH_RAW+"?t="+Date.now(),
    "cadde-data.json?t="+Date.now()
  ];
  for(var i=0;i<urls.length;i++){
    try{
      var r=await fetch(urls[i],{cache:"no-store"});
      if(!r.ok) continue;
      var data=await r.json();
      if(await applyRemote(data,"Sunucudan cekildi")) return true;
    }catch(e){}
  }
  toast("Cekilemedi");
  return false;
}
async function ghPull(){
  var token=ghToken();
  var repo=(ghCfg().repo||GH_DEFAULT_REPO).trim();
  var path=(ghCfg().path||GH_DEFAULT_PATH).trim();
  if(token){
    try{
      var headers={Accept:"application/vnd.github+json",Authorization:"Bearer "+token};
      var get=await fetch("https://api.github.com/repos/"+repo+"/contents/"+path+"?t="+Date.now(),{headers:headers,cache:"no-store"});
      if(get.ok){
        var j=await get.json();
        var data=JSON.parse(fromB64((j.content||"").replace(/\n/g,"")));
        return applyRemote(data,"Sunucudan cekildi");
      }
    }catch(e){}
  }
  return ghPullPublic();
}
async function save(){
  state.updatedAt=new Date().toISOString();
  persist();
  toast("Yaziliyor...");
  await ghPush();
}
async function yenileSunucu(){
  toast("Cekiliyor...");
  await ghPull();
}
document.addEventListener("DOMContentLoaded",function(){
  ghLoadCfg();
  if(!ghHasToken()){
    var box=document.getElementById("ghBox");
    if(box) box.classList.remove("hide");
  }
});
