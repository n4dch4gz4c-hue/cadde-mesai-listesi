const GH_KEY="cadde_gh_cfg";
const GH_DEFAULT_REPO="n4dch4gz4c-hue/cadde-mesai-listesi";
const GH_DEFAULT_PATH="cadde-data.json";
const GH_RAW="https://raw.githubusercontent.com/n4dch4gz4c-hue/cadde-mesai-listesi/main/cadde-data.json";
function ghCfg(){
  try{return JSON.parse(localStorage.getItem(GH_KEY)||"{}");}catch(e){return {};}
}
function ghToken(){
  return (ghCfg().token||"").trim();
}
function toB64(s){return btoa(unescape(encodeURIComponent(s)));}
async function ghPush(){
  var token=ghToken();
  if(!token){
    toast("Kaydedildi");
    return false;
  }
  var repo=(ghCfg().repo||GH_DEFAULT_REPO).trim();
  var path=(ghCfg().path||GH_DEFAULT_PATH).trim();
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
  else toast("Kaydedildi");
  return put.ok;
}
async function applyRemote(data){
  if(!data||!data.people||!data.people.length) return false;
  state=hydrate(data);
  persist();
  renderAll();
  return true;
}
async function ghPullPublic(){
  var urls=[GH_RAW+"?t="+Date.now(),"cadde-data.json?t="+Date.now()];
  for(var i=0;i<urls.length;i++){
    try{
      var r=await fetch(urls[i],{cache:"no-store"});
      if(!r.ok) continue;
      var data=await r.json();
      if(await applyRemote(data)) return true;
    }catch(e){}
  }
  return false;
}
async function save(){
  state.updatedAt=new Date().toISOString();
  persist();
  await ghPush();
}
document.addEventListener("DOMContentLoaded",function(){
  setTimeout(function(){ ghPullPublic(); }, 400);
});
