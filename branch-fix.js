(function(){
  var correct = "Çengel" + "k" + "öy";
  function fix(){
    var bar = document.getElementById("branchBar");
    if(!bar) return;
    var buttons = bar.querySelectorAll("button");
    buttons.forEach(function(btn){
      var txt = btn.textContent || "";
      if(txt.indexOf("Çengel") !== -1 || txt.indexOf("Çengel") !== -1){
        if(btn.textContent !== correct){
          btn.textContent = correct;
        }
      }
    });
  }
  setTimeout(fix, 50);
  setTimeout(fix, 200);
  setTimeout(fix, 600);
  setTimeout(fix, 1200);
  setInterval(fix, 800);
  
  var observer = new MutationObserver(fix);
  var bar = document.getElementById("branchBar");
  if(bar) observer.observe(bar, {childList:true, subtree:true, characterData:true});
})();
