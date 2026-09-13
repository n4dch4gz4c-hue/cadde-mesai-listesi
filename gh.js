const GH_KEY="cadde_gh_cfg";
const GH_DEFAULT_REPO="n4dch4gz4c-hue/cadde-mesai-listesi";
const GH_DEFAULT_PATH="cadde-data.json";
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
    toast(box.classList.contains("hide")?"GitHub kapandı":"GitHub açıldı");
  }
}
function ghSaveCfg(){
  localStorage.setItem(GH_KEY,JSON.stringify({
    token:document.getElementById("ghToken").value,
    repo:document.getElementById("ghRepo").value||GH_DEFAULT_REPO,
    path:document.getElementById("ghPath").value||GH_DEFAULT_PATH
  }));
  toast("Token kaydedildi");
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
function ghHasToken(){
  var t=(document.getElementById("ghToken")&&document.getElementById("ghToken").value)||ghCfg().token||"";
  return !!t.trim();
}
function toB64(s){return btoa(unescape(encodeURIComponent(s)));}
function fromB64(s){return decodeURIComponent(escape(atob(s)));}
async function ghPush(){
  var cfg=ghCfg();
  var token=((document.getElementById("ghToken")&&document.getElementById("ghToken").value)||cfg.token||"").trim();
  var repo=((document.getElementById("ghRepo")&&document.getElementById("ghRepo").value)||cfg.repo||GH_DEFAULT_REPO).trim();
  var path=((document.getElementById("ghPath")&&document.getElementById("ghPath").value)||cfg.path||GH_DEFAULT_PATH).trim();
  if(!token||!repo){toast("Token yok — başlığa 3 kez bas");return false;}
  state.updatedAt=new Date().toISOString();
  persist();
  var url="https://api.github.com/repos/"+repo+"/contents/"+path;
  var headers={Authorization:"Bearer "+token,Accept:"application/vnd.github+json"};
  var sha=null;
  try{
    var get=await fetch(url,{headers:headers});
    if(get.ok){var j=await get.json();sha=j.sha;}
  }catch(e){}
  var body={message:"Cadde bordro guncelleme "+state.updatedAt,content:toB64(JSON.stringify(state,null,2)),branch:"main"};
  if(sha)body.sha=sha;
  var put=await fetch(url,{method:"PUT",headers:Object.assign({"Content-Type":"application/json"},headers),body:JSON.stringify(body)});
  toast(put.ok?"GitHub'a yazıldı — telefon Yenile desin":"Gönderilemedi "+put.status);
  return put.ok;
}
async function ghPullPublic(){
  try{
    var r=await fetch("cadde-data.json?t="+Date.now(),{cache:"no-store"});
    if(!r.ok){toast("Sunucu okunamadı "+r.status);return;}
    var data=await r.json();
    if(!data||!data.people){toast("Dosya boş");return;}
    state=hydrate(data);
    persist();
    renderAll();
    toast("Sunucudan çekildi");
  }catch(e){toast("Çekilemedi");}
}
async function ghPull(){
  var cfg=ghCfg();
  var token=((document.getElementById("ghToken")&&document.getElementById("ghToken").value)||cfg.token||"").trim();
  var repo=((document.getElementById("ghRepo")&&document.getElementById("ghRepo").value)||cfg.repo||GH_DEFAULT_REPO).trim();
  var path=((document.getElementById("ghPath")&&document.getElementById("ghPath").value)||cfg.path||GH_DEFAULT_PATH).trim();
  if(!token){return ghPullPublic();}
  var headers={Accept:"application/vnd.github+json",Authorization:"Bearer "+token};
  var get=await fetch("https://api.github.com/repos/"+repo+"/contents/"+path,{headers:headers});
  if(!get.ok){toast("Çekilemedi "+get.status);return;}
  var j=await get.json();
  var data=JSON.parse(fromB64(j.content.replace(/\n/g,"")));
  state=hydrate(data);
  persist();
  renderAll();
  toast("GitHub'dan çekildi");
}
document.addEventListener("DOMContentLoaded",ghLoadCfg);
