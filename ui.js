var c;
var ctx;
var startdown = false;
var selectedRegion=0;

var sections = new Array();

function Section(UIregion, sound,children,weights)  {
  this.UIregion = UIregion;
  this.sound = sound;
  this.color = "rgb(50,50,50)";
  this.children = new Array();
  this.weights = new Array();
  this.weightTotal = 0;
}


function startControl() {
  c = document.getElementById("control_surface");
  ctx = c.getContext("2d");
  console.log(filelist);
  for(var i = 0; i < currentBufferList.length;i++) {
    var region = [0,i*80,150,75];
    ctx.fillStyle="rgb(50,50,50)";
    ctx.fillRect(region[0]+50,region[1],region[2]-50,region[3]);
    ctx.fillRect(region[0],region[1]+20,region[2]+25,region[3]-20);
    sections[i] = new Section(region,currentBufferList[i]);
  }

  // Drag logic
  c.addEventListener("mousedown", function(e){
    for(var i = 0; i<sections.length;i++) {
      if(inRegion(sections[i].UIregion,e))  {
        selectedRegion = i;
      }
    }
  }, false);
  /*
  c.addEventListener("mousemove", function(e){
    //console.log('mouse move');
  }, false);
  */
  c.addEventListener("mouseup", function(e){
    var childSet = false;
    if(inRegion(sections[selectedRegion].UIregion,e))  {
     console.log("click");
     queueTrack(selectedRegion);

    } else  {
      for(var i = 0; i<sections.length;i++) {
        if(inRegion(sections[i].UIregion,e))  {
          connectChild(selectedRegion,i);
          childSet = true;
        }
      }
      if (!childSet)  {
        nextTrackIndex = null;
        resetSectionColor();
      }
    }
    //setRegion = null;
    dragged = true;
  }, false);


  animate();


}

function connectChild(origin, destination)  {
  if(sections[origin].children.indexOf(destination) < 0)  {
    sections[origin].children[sections[origin].children.length] = destination;
    // weight strength defaults to 1 (uniform distribution)
    sections[origin].weights[sections[origin].weights.length] = 1;
  } else {
    sections[origin].weights[sections[origin].children.indexOf(destination)]
      += 1;
  }
  var total = 0;
  for (var i = 0; i < sections[origin].weights.length;i++) {
    total += sections[origin].weights[i];
  }
  sections[origin].weightTotal = total;
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
    window.setTimeout(callback, 1000 / 20);
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
    var region = sections[i].UIregion;
    ctx.fillStyle=sections[i].color;
    ctx.fillRect(region[0]+25,region[1],region[2]-50,region[3]);
    ctx.fillStyle="rgb(100,100,100)";
    ctx.fillRect(region[0],region[1]+15,25,region[3]-30);
    ctx.fillRect(region[2]-25,region[1]+15,25,region[3]-30);
  }

  for (var i=0;i<sections.length;i++) {
    var region = sections[i].UIregion;
    for (var j = 0; j < sections[i].children.length;j++)  {
      var childRegion = sections[sections[i].children[j]].UIregion;
      var strokeWeight = sections[i].weights[j]/sections[i].weightTotal;
      strokeWeight = Math.round(strokeWeight*180);
      ctx.beginPath();
      ctx.moveTo(childRegion[0]+12,childRegion[1]+25);
      ctx.lineTo(region[2]-12,region[1]+25);
      ctx.strokeStyle="rgb(" + strokeWeight + ",0,"+ (180-strokeWeight)+")"
      ctx.stroke();
    }

  }


  // request new frame
  requestAnimFrame(function() {
    animate();
  });
}


