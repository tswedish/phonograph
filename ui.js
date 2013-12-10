var c = document.getElementById("control_surface");
var ctx = c.getContext("2d");

var startdown = false;
var selectedRegion = 0;
var dragging = false;
var dragEnd = [0,0];
var startLoc = [0,0];
var touchDown = false;
var StartSection = new Section([100,500,200,200]);
var EndSection = new Section([900,500,200,200]);

function Section(UIregion, soundIndex, name) {
  UIregion[0] = UIregion[0]*0.001*ctx.canvas.width;
  UIregion[1] = UIregion[1]*0.001*ctx.canvas.height;
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
        touchDown = true;
        startLoc[0] = composition[selectedRegion].UIregion[0];
        startLoc[1] = composition[selectedRegion].UIregion[1];
      }
    }
    if (inRegion(StartSection.UIregion,e)) {
      touchDown = true;
      startLoc[0] = StartSection.UIregion[0];
      startLoc[1] = StartSection.UIregion[1];
    }
  }, false);

  c.addEventListener("mousemove", function(e){
    if (touchDown) {
      dragging = true;
      dragEnd = [e.pageX,e.pageY];
      //console.log(dragEnd);
    }
  }, false);

  c.addEventListener("mouseup", function(e) {
    var childSet = false;
    dragging = false;
    touchDown = false;
    if (startLoc[0] != StartSection.UIregion[0] &&
        startLoc[1] != StartSection.UIregion[1]) {
      if (inRegion(composition[selectedRegion].UIregion, e)) {
        //console.log("click");
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
    } else  {
        if (inRegion(StartSection.UIregion,e))  {
          queueTrack(StartSection.children[0]);
        } else  {
          for (var i = 0; i < composition.length; i++) {
            if (inRegion(composition[i].UIregion, e)) {
              StartSection.children[0] = i;
              childSet = true;
            }
            if (!childSet) {
              nextTrackIndex = null;
              //resetSectionColor();
            }

          }
        }
    }

  }, false);


  animate();

  var doc = document.documentElement;
  doc.ondragover = function () { this.className = 'hover'; return false; };
  doc.ondragend = function () { this.className = ''; return false; };
  doc.ondrop = function (event) {
    event.preventDefault && event.preventDefault();
    this.className = '';
    console.log("file dropped");
    // now do something with:
    var files = event.dataTransfer.files;
    for (var i = 0; i < files.length; i++)  {
      (function(file) {
        var name = file.name;
        var reader = new FileReader();
        reader.onload = function(e) {
          context.decodeAudioData(
              e.target.result, function(buffer) {
                trackBufferList[trackBufferList.length] = buffer;
                composition[composition.length] = new Section (
                  [Math.round(Math.random()*100+200),200,200,200],
                  trackBufferList.length-1,
                  name
                  );
              }, function (err) { console.error(err) }
          );
        };
        reader.readAsArrayBuffer(file);})
      (files[i]);
    }

    return false;
  };



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
  //console.log(d);
  if (d < 50 ) {
    return true;
  } else {
    return false;
  }
}

function runPhysics() {
  for (var i = 0; i < composition.length; i++) {
    var region = composition[i].UIregion;
    var parentVec = $V([region[0],-region[1]]);
    var force = $V([0,0]);
    for (var j = 0; j < composition[i].children.length; j++) {
      var childRegion = composition[composition[i].children[j]].UIregion;
      var strokeWeight = composition[i].weights[j] /
        composition[i].weightTotal;
      strokeWeight = Math.round(strokeWeight * 180);
      // Convert to Cartesian
      var childVec = $V([childRegion[0],-childRegion[1]]);
      var u2ChildVec = childVec.subtract(parentVec).toUnitVector();
      // Hooke's Law
      var k = 0.0001*strokeWeight;
      var x = parentVec.distanceFrom(childVec) - 200;
      force = force.add(u2ChildVec.x(k*x));
    }
    // Drag spring
    if (dragging) {
      if (startLoc[0] != StartSection.UIregion[0] &&
        startLoc[1] != StartSection.UIregion[1]) {
        if (i == selectedRegion) {
          var childVec = $V([dragEnd[0],-dragEnd[1]]);
          var u2ChildVec = childVec.subtract(parentVec).toUnitVector();
          // Hooke's Law
          var k = 0.05;
          var x = parentVec.distanceFrom(childVec) - 100;
          force = force.add(u2ChildVec.x(k*x));
        }
      }
    }
    // Start Section spring
    for (var j = 0; j < StartSection.children.length; j++)  {
      if (i == StartSection.children[j])  {
        var childRegion = StartSection.UIregion;
        var childVec = $V([childRegion[0],-childRegion[1]]);
        var u2ChildVec = childVec.subtract(parentVec).toUnitVector();
        // Hooke's Law
        var k = 0.0005;
        var x = parentVec.distanceFrom(childVec) - 100;
        force = force.add(u2ChildVec.x(k*x));
      }
    }
    // Charge
    for (var j = 0; j < composition.length; j++)  {
      var otherRegion = composition[j].UIregion;
      var otherVec = $V([otherRegion[0],-otherRegion[1]]);
      var u2OtherVec = otherVec.subtract(parentVec).toUnitVector();
      var r = parentVec.distanceFrom(otherVec);
      if (r > 0)  {
        force = force.add(u2OtherVec.x(-30000*(1/Math.pow(r,2))));
      }
    }
    // Potential Well
    c = document.getElementById("control_surface");
    poleVec = $V([c.width/2,-c.height/2]);
    force = force.add(poleVec.subtract(parentVec).x(0.01));

    // Damping
    var vel = $V(composition[i].velocity);
    vel.setElements([vel.e(1), -vel.e(2)]);
    force = force.add(vel.x(-0.3));
    // Static Friction
    if (force.modulus() > 0.00001) {
        force = force.add(force.toUnitVector().x(-0.00001));
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

function drawMultilineText(el,ctx,x,y){

     // Creates an array where the <br/> tag splits the values.
     function toMultiLine(text){
      var textArr = new Array();
      text = text.replace(/\n\r?/g, '<br/>');
      textArr = text.split("<br/>");
      return textArr;
     }


      // set context and formatting
      ctx.font = "14pt Calibri";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgb(75,75,75)";

      // prepare textarea value to be drawn as multiline text.
      var textval = document.getElementById(el).value;
      var textvalArr = toMultiLine(textval);
      var linespacing = 25;
      var startX = x;
      var startY = y;

      // draw each line on canvas.
      y = startY;
      for(var i = 0; i < textvalArr.length; i++){
          ctx.fillText(textvalArr[i], startX, y);
          y += linespacing;
      }
}


function animate() {

  ctx.canvas.width  = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
  StartSection.UIregion[0] = ctx.canvas.width*0.1;
  StartSection.UIregion[1] = ctx.canvas.height*0.5;
  EndSection.UIregion[0] = ctx.canvas.width*0.9;
  EndSection.UIregion[1] = ctx.canvas.height*0.5;

  // update
  runPhysics();

  // clear
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "rgb(100,100,100)";
  ctx.fillRect(0, 0, c.width, c.height);


  // Title
  ctx.font = "74pt Calibri";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgb(75,75,75)";
  ctx.fillText("PhonoGraph", 50, 25);

  // Instruction text
  drawMultilineText("instructions",ctx,150,150)
  // Info text
  drawMultilineText("info",ctx,ctx.canvas.width*0.7,ctx.canvas.height*0.8)

  // draw stuff
  if (dragging) {
    if (startLoc[0] != StartSection.UIregion[0] &&
        startLoc[1] != StartSection.UIregion[1]) {
      startLoc[0] = composition[selectedRegion].UIregion[0];
      startLoc[1] = composition[selectedRegion].UIregion[1];
    }
    //console.log(startLoc);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(startLoc[0], startLoc[1]);
    ctx.lineTo(dragEnd[0], dragEnd[1]);
    ctx.strokeStyle = "rgb(200,0,0)";
    ctx.stroke();

  }
  StartSection.color = "rgb(100,200,100)";
  ctx.beginPath();
  ctx.arc(StartSection.UIregion[0],
    StartSection.UIregion[1],
    50, 0, Math.PI * 2, false); // Draw a circle
  ctx.closePath();
  ctx.fillStyle = StartSection.color;
  ctx.fill();
  for (var i = 0; i < StartSection.children.length; i++)  {
    var region = StartSection.UIregion;
    var childRegion = composition[StartSection.children[i]].UIregion;
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
    ctx.fillStyle = StartSection.color;
    ctx.fill();

  }
  ctx.beginPath();
  ctx.arc(EndSection.UIregion[0],
    EndSection.UIregion[1],
    50, 0, Math.PI * 2, false); // Draw a circle
  ctx.closePath();
  ctx.fillStyle = "rgb(200,100,100)";
  ctx.fill();


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
