var c;
var ctx;
var startdown = false;
var selectedRegion = 0;

function Section(UIregion, soundIndex, name) {
  this.UIregion = UIregion;
  this.soundIndex = soundIndex;
  this.name = name;
  this.color = "rgb(50,50,50)";
  this.children = new Array();
  this.weights = new Array();
  this.weightTotal = 0;
  this.velocity = [0,0];
}


function startControl(loadedComposition) {
  c = document.getElementById("control_surface");
  ctx = c.getContext("2d");
  if (!loadedComposition) {
    generateComposition;
  }

  // Drag logic
  c.addEventListener("mousedown", function(e) {
    for (var i = 0; i < composition.length; i++) {
      if (inRegion(composition[i].UIregion, e)) {
        selectedRegion = i;
      }
    }
  }, false);
  /*
  c.addEventListener("mousemove", function(e){
    //console.log('mouse move');
  }, false);
  */
  c.addEventListener("mouseup", function(e) {
    var childSet = false;
    if (inRegion(composition[selectedRegion].UIregion, e)) {
      console.log("click");
      queueTrack(selectedRegion);

    } else {
      for (var i = 0; i < composition.length; i++) {
        if (inRegion(composition[i].UIregion, e)) {
          connectChild(selectedRegion, i);
          childSet = true;
        }
      }
      if (!childSet) {
        nextTrackIndex = null;
        resetSectionColor();
      }
    }
    //setRegion = null;
    dragged = true;
  }, false);


  animate();


}

function generateComposition() {

  console.log(filename);
  for (var i = 0; i < trackBufferList.length; i++) {
    var numSections = trackBufferList.length;
    // What good is memorizing PI if I use tau?
    var radius = 2 * (numSections * 150) / (2 * 3.141592653);
    var center = [c.width / 2, c.height / 2];
    var angle = i * ((2 * 3.1415926) / numSections);
    var region = [Math.round(radius * Math.cos(angle) + center[0]),
      Math.round(radius * Math.sin(angle) + center[1]), 150, 75
    ];
    composition[i] = new Section(region, i, filename[i]);
  }
}


function connectChild(origin, destination) {
  if (composition[origin].children.indexOf(destination) < 0) {
    composition[origin].children[
      composition[origin].children.length] = destination;
    // weight strength defaults to 1 (uniform distribution)
    composition[origin].weights[composition[origin].weights.length] = 1;
  } else {
    composition[origin].weights[
      composition[origin].children.indexOf(destination)] += 1;
  }
  var total = 0;
  for (var i = 0; i < composition[origin].weights.length; i++) {
    total += composition[origin].weights[i];
  }
  composition[origin].weightTotal = total;
}

function updateSectionRegion(e) {
  composition[setRegion].UIregion[0] = e.pageX;
  composition[setRegion].UIregion[1] = e.pageY;
}

function inRegion(region, e) {
  var d = Math.sqrt(Math.pow(e.pageX - region[0],2)
          + Math.pow(e.pageY - region[1],2));
  console.log(d);
  if (d < 50 ) {
    return true;
  } else {
    return false;
  }
}

function runPhysics() {
  for (var i = 0; i < composition.length; i++) {
    var region = composition[i].UIregion;
    var force = $V([0,0]);
    for (var j = 0; j < composition[i].children.length; j++) {
      var childRegion = composition[composition[i].children[j]].UIregion;
      var strokeWeight = composition[i].weights[j] /
        composition[i].weightTotal;
      strokeWeight = Math.round(strokeWeight * 180);
      // Convert to Cartesian
      var childVec = $V([childRegion[0],-childRegion[1]]);
      var parentVec = $V([region[0],-region[1]]);
      var u2ChildVec = childVec.subtract(parentVec).toUnitVector();
      // Hooke's Law
      var k = 0.001*strokeWeight;
      var x = parentVec.distanceFrom(childVec) - 200;
      force = force.add(u2ChildVec.x(k*x));
    }
      // Damping (replace's friction?)
      var vel = $V(composition[i].velocity);
      vel.setElements([vel.e(1), -vel.e(2)]);
      force = force.add(vel.x(-0.1));
      // Static Friction
      if (force.modulus() > 0.01) {
          force = force.add(force.toUnitVector().x(-0.01));
      } else  {
          force = force.x(0);
      }

      if (force.modulus() > 0)  {
      composition[i].velocity[0] = composition[i].velocity[0]+force.e(1);
      composition[i].velocity[1] = composition[i].velocity[1]-force.e(2);
      composition[i].UIregion[0] = Math.round(composition[i].UIregion[0]
                                   + composition[i].velocity[0]);
      composition[i].UIregion[1] = Math.round((composition[i].UIregion[1]
                                   + composition[i].velocity[1]));
    }
  }

}


window.requestAnimFrame = (function(callback) {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame || function(callback) {
    window.setTimeout(callback, 1000 / 30);
  };
})();

function animate() {

  c = document.getElementById("control_surface");
  ctx = c.getContext("2d");

  // update
  runPhysics();

  // clear
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "rgb(100,100,100)";
  ctx.fillRect(0, 0, c.width, c.height);


  // draw stuff
  for (var i = 0; i < composition.length; i++) {
    var region = composition[i].UIregion;
    ctx.beginPath();
    ctx.arc(region[0],
      region[1],
      50, 0, Math.PI * 2, false); // Draw a circle
    ctx.closePath();
    ctx.fillStyle = composition[i].color;
    ctx.fill();

    ctx.font = "14pt Calibri";
    ctx.fillStyle = "rgb(75,75,75)";
    ctx.fillText(composition[i].name, region[0] - 40, region[1] + 5);
    }

  for (var i = 0; i < composition.length; i++) {
    var region = composition[i].UIregion;
    for (var j = 0; j < composition[i].children.length; j++) {
      var childRegion = composition[composition[i].children[j]].UIregion;
      var strokeWeight = composition[i].weights[j] /
        composition[i].weightTotal;
      strokeWeight = Math.round(strokeWeight * 180);
      ctx.lineWidth = 5;
      // Convert to cartesian coordinates
      var childVec = $V([childRegion[0],-childRegion[1]]);
      var parentVec = $V([region[0],-region[1]]);
      var u2ChildVec = childVec.subtract(parentVec).toUnitVector();
      var linkVec = u2ChildVec.x((childVec.distanceFrom(parentVec)-100));
      var R = Matrix.Rotation(0.1).elements;
      var nodeVec = u2ChildVec.x(50).elements;
      var linkstart = $V([nodeVec[0]*R[0][0]+nodeVec[1]*R[0][1],
                          nodeVec[0]*R[1][0]+nodeVec[1]*R[1][1]]);
      linkstart = linkstart.add(parentVec);
      linkstart = linkstart.round();
      linkVec = linkVec.round();
      ctx.beginPath();
      ctx.moveTo(linkstart.e(1), -linkstart.e(2));
      ctx.lineTo(linkstart.add(linkVec).e(1), -linkstart.add(linkVec).e(2));
      ctx.strokeStyle = ("rgb(" + strokeWeight + ",0,"
                        + (180 - strokeWeight) + ")");
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(linkstart.e(1),
              -linkstart.e(2),
              5, 0, Math.PI * 2, false); // Draw a circle
      ctx.closePath();
      ctx.fillStyle = composition[i].color;
      ctx.fill();
      }

    }


    // request new frame
    requestAnimFrame(function() {
      animate();
    });
  }
