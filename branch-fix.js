(function(){
  var correct = "Çengel" + "k" + "öy";
  function fix(){
    var bar = document.getElementById("branchBar");
    if(!bar) return;
    var buttons = bar.querySelectorAll("button");
    buttons.forEach(function(btn){
      if(btn.textContent && btn.textContent.indexOf("Çengel") !== -1){
        btn.textContent = correct;
      }
    });
  }
  setTimeout(fix, 100);
  setTimeout(fix, 500);
  setTimeout(fix, 1500);
  setInterval(fix, 2000);
})();
