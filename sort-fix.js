(function(){
  function srt(arr,key){
    key=key||"name";
    (arr||[]).sort(function(a,b){
      return String(a[key]||a.name||a.kisi||"").localeCompare(String(b[key]||b.name||b.kisi||""),"tr",{sensitivity:"base"});
    });
    return arr;
  }
  window.sortByTrName=srt;
  function apply(){
    if(typeof state==="undefined"||!state||!state.people) return false;
    srt(state.people,"name");
    if(state.devamsizlik) srt(state.devamsizlik,"kisi");
    if(typeof visible==="function"){
      var oldVis=visible;
      visible=function(){ return srt(oldVis().slice(),"name"); };
    }
    if(typeof addKisi==="function"){
      var oldAdd=addKisi;
      addKisi=function(){
        oldAdd();
        if(state&&state.people) srt(state.people,"name");
        if(typeof renderAll==="function") renderAll();
      };
    }
    if(typeof renderAll==="function") renderAll();
    return true;
  }
  function wait(){ if(!apply()) setTimeout(wait,80); }
  wait();
})();
