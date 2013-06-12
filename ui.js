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
        composition[origin].children[composition[origin].children.length] = destination;
        // weight strength defaults to 1 (uniform distribution)
        composition[origin].weights[composition[origin].weights.length] = 1;
    } else {
        composition[origin].weights[composition[origin].children.indexOf(destination)] += 1;
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
    if ((e.pageX > region[0] && e.pageX < region[2] + region[0]) &&
        (e.pageY > region[1] && e.pageY < region[3] + region[1])) {
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
        window.msRequestAnimationFrame || function(callback) {
        window.setTimeout(callback, 1000 / 20);
    };
})();

function animate() {

    c = document.getElementById("control_surface");
    ctx = c.getContext("2d");

    // update

    // clear
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "rgb(100,100,100)";
    ctx.fillRect(0, 0, c.width, c.height);


    // draw stuff
    for (var i = 0; i < composition.length; i++) {
        var region = composition[i].UIregion;
        ctx.fillStyle = composition[i].color;
        ctx.fillRect(region[0] + 25, region[1], region[2] - 50, region[3]);
        ctx.fillStyle = "rgb(150,150,150)";
        ctx.font = "14pt Calibri";
        ctx.fillText(composition[i].name, region[0] + 30, region[1] + 40);
        ctx.fillStyle = "rgb(75,75,75)";
        ctx.fillRect(region[0], region[1] + 15, 25, region[3] - 30);
        ctx.fillRect(region[0] + region[2] - 25, region[1] + 15, 25, region[3] - 30);
    }

    for (var i = 0; i < composition.length; i++) {
        var region = composition[i].UIregion;
        for (var j = 0; j < composition[i].children.length; j++) {
            var childRegion = composition[composition[i].children[j]].UIregion;
            var strokeWeight = composition[i].weights[j] / composition[i].weightTotal;
            strokeWeight = Math.round(strokeWeight * 180);
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(childRegion[0] + 12, childRegion[1] + 25);
            ctx.lineTo(region[0] + region[2] - 12, region[1] + 25);
            ctx.strokeStyle = "rgb(" + strokeWeight + ",0," + (180 - strokeWeight) + ")"
            ctx.stroke();
        }

    }


    // request new frame
    requestAnimFrame(function() {
        animate();
    });
}
