(function(){
function killAs(){
  ["asFab","asPanel"].forEach(function(id){ var el=document.getElementById(id); if(el) el.remove(); });
}
killAs();
setInterval(killAs,800);
var st=document.createElement("style");
st.id="mobileFixCss";
st.textContent="#asFab,#asPanel{display:none!important}";
document.head.appendChild(st);
})();
