var filename = new Array();
// to generate: JSON.stringify(composition, null, 4);
//compositionFile = 'http://localhost:8000/composition.json';
var domainPrefix = '';
var compositionFile = domainPrefix + 'composition.json';

var trackBufferList = new Array();
var composition = new Array();

window.onload = init;
var context;
var bufferLoader;
var nextTrackIndex = null;
var playing = false;
var currentTrackIndex = null;


function init() {
  // Fix up prefixing
  domainPrefix = document.URL;
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext();

  //compositionLoader = new CompositionLoader(finishedLoadingComposition);
  //compositionLoader.load(compositionFile);
  startControl(false);

}

function saveComposition()  {
  var jsonStr = JSON.stringify(composition,null,2);
  function sendText(txt) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/savecomposition', true);
    xhr.responseType = 'text';
    xhr.onload = function(e) {
      if (this.status == 200) {
        console.log(this.response);
      }
    };
    xhr.send(txt);
  }
  sendText(jsonStr);
}

sendTextNew('test string');
  return jsonStr;
}

function finishedLoadingSound(bufferList) {
  console.log('loadedbuffers');
  trackBufferList = bufferList;
  startControl(true);
}

function finishedLoadingComposition(composer) {
  console.log('loaded Composition');
  composition = composer;
  var filelist = new Array();
  for (var i = 0; i < composition.length; i++) {
    filelist[i] = composition[i].name;
  }
  for (var i = 0; i < filelist.length; i++) {
    filename[i] = filelist[i];
    filelist[i] = domainPrefix + filelist[i];
  }
  bufferLoader = new BufferLoader(
    context,
    filelist,
    finishedLoadingSound);

  bufferLoader.load();

}


//var filter = context.createBiquadFilter();
//filter.type = 0;  // In this case it's a lowshelf filter
//filter.frequency.value = 440;
//source.connect(filter);
//filter.connect(context.destination);

function playTrack(buffer) {
  var source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.noteOn(0);
  currentTrackIndex = nextTrackIndex;
  nextTrackIndex = rollNextTrack();
  resetSectionColor();
  playing = true;
  var timer = setTimeout(function() {
    playing = false;
    composition[currentTrackIndex].color = "rgb(50,50,50)";
    playNextinQueue();
  }, buffer.duration * 1000);
}

function rollNextTrack() {
  var roll = Math.ceil(Math.random() *
    (composition[currentTrackIndex].weightTotal - 1));
  //console.log("weightTotal:" + composition[currentTrackIndex].weightTotal);
  //console.log("rolled: " + roll);
  for (var i = 0; i < composition[currentTrackIndex].weights.length; i++) {
    if (roll < composition[currentTrackIndex].weights[i]) {
      return composition[currentTrackIndex].children[i];
    } else {
      roll = roll - composition[currentTrackIndex].weights[i];
    }
  }
  //console.log("No roll, returning null");
  return null;
}

function playNextinQueue() {
  if (nextTrackIndex != null) {
    playTrack(trackBufferList[composition[nextTrackIndex].soundIndex]);
  }
}

function queueTrack(newTrackIndex) {
  nextTrackIndex = newTrackIndex;
  resetSectionColor();
  //console.log('queued next track');
  if (!playing) {
    playNextinQueue();
  }
}

function resetSectionColor() {
  //console.log(currentTrackIndex);
  //console.log(nextTrackIndex);
  for (var i = 0; i < composition.length; i++) {
    if (i != nextTrackIndex && i != currentTrackIndex) {
      composition[i].color = "rgb(50,50,50)";
    } else if (i == currentTrackIndex && i == nextTrackIndex) {
      composition[i].color = "rgb(150,100,0)";
    } else if (i == currentTrackIndex) {
      composition[i].color = "rgb(0,150,0)";
    } else if (i == nextTrackIndex) {
      composition[i].color = "rgb(150,0,0)";
    }
  }
}

function CompositionLoader(callback) {
  this.onload = callback;
}

CompositionLoader.prototype.load = function(url) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);

  var loader = this;
  request.onload = function() {
    loader.onload(eval(request.response));
  }


  request.onerror = function() {
    alert('CompositionLoader: XHR error');
  }

  request.send();
}


function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response, function(buffer) {
      if (!buffer) {
        alert('error decoding file data: ' + url);
        return;
      }
      loader.bufferList[index] = buffer;
      if (++loader.loadCount == loader.urlList.length)
        loader.onload(loader.bufferList);
    }, function(error) {
      console.error('decodeAudioData error', error);
    });
  }

  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }

  request.send();
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
    this.loadBuffer(this.urlList[i], i);
}
