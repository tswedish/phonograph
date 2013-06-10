var c;
var ctx;
var startdown = false;
var setRegion=0;

var sections = new Array();

function Section(UIregion, sound)  {
  this.UIregion = UIregion;
  this.sound = sound;
}


function startControl() {
  c = document.getElementById("control_surface");
  ctx = c.getContext("2d");
  console.log(filelist);
  for(var i = 0; i < currentBufferList.length;i++) {
    var region = [50+i*160,50,150,75];
    ctx.fillStyle="rgb(50,50,50)";
    ctx.fillRect(50+i*160,50,150,75);
    sections[i] = new Section(region,currentBufferList[i]);
  }

  c.addEventListener("mousedown", function(e){
    for(var i = 0; i<sections.length;i++) {
      if(inRegion(sections[i].UIregion,e))  {
        setRegion = i;
      }
    }
    startdown = true;
  }, false);
  /*
  c.addEventListener("mousemove", function(e){
    console.log('mouse move');
    if (startdown)  {
      updateSectionRegion(e);
    }
  }, false);
  */
  c.addEventListener("mouseup", function(e){
    if(inRegion(sections[setRegion].UIregion,e))  {
      console.log('clicked rectangle '+(setRegion+1));
      queueTrack(currentBufferList[setRegion]);
    }
    //setRegion = null;
    startdown = false;
  }, false);

  animate();


}

function updateSectionRegion(e)  {
  sections[setRegion].UIregion[0] = e.pageX;
  sections[setRegion].UIregion[1] = e.pageY;
}

function inRegion(region,e)  {
  if ((e.pageX > region[0] && e.pageX < region[2]+region[0]) &&
      (e.pageY > region[1] && e.pageY < region[3]+region[1])) {
    return true;
  } else {
    return false;
  }
}


window.requestAnimFrame = (function(callback) {
  return window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

function animate() {
  var canvas = document.getElementById('control_surface');
  var context = canvas.getContext('2d');

  // update

  // clear
  context.clearRect(0, 0, canvas.width, canvas.height);

  // draw stuff
  for (var i=0;i<sections.length;i++) {
    var region = [
                  sections[i].UIregion[0],
                  sections[i].UIregion[1]
                 ];
    ctx.fillStyle="rgb(50,50,50)";
    ctx.fillRect(region[0]-50,region[1]-50,150,75);
  }


  // request new frame
  requestAnimFrame(function() {
    animate();
  });
}


