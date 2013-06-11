var filelist = [
                'loop1.wav',
                'loop2.wav',
                'loop3.wav'
                ];
for (var i = 0; i < filelist.length; i++) {
  filelist[i] = 'http://localhost:8000/'+filelist[i];
}

var currentBufferList;

window.onload = init;
var context;
var bufferLoader;
var nextTrackIndex = null;
var playing = false;
var currentTrackIndex = null;


function init() {
  // Fix up prefixing
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext();

  bufferLoader = new BufferLoader(
    context,
    filelist,
    finishedLoading
    );

  bufferLoader.load();
}

function finishedLoading(bufferList) {
  console.log('loadedbuffers');
  currentBufferList = bufferList;
  currBuffer = currentBufferList[0];
  startControl();
}

        //var filter = context.createBiquadFilter();
        //filter.type = 0;  // In this case it's a lowshelf filter
        //filter.frequency.value = 440;
        //source.connect(filter);
        //filter.connect(context.destination);

function playTrack(buffer){
        console.log('playing next track');
        var source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.noteOn(0);
        currentTrackIndex = nextTrackIndex;
        nextTrackIndex = rollNextTrack();
        resetSectionColor();
        playing = true;
        var timer = setTimeout(function() {
          console.log('playback finished');
          playing = false;
          sections[currentTrackIndex].color = "rgb(50,50,50)";
          playNextinQueue();
        }, buffer.duration * 1000);
}

function rollNextTrack()  {
  var roll = Math.round(Math.random()
      *(sections[currentTrackIndex].weightTotal-1));
  console.log("weightTotal:"+sections[currentTrackIndex].weightTotal);
  console.log("rolled: " +roll);
  for (var i = 0; i < sections[currentTrackIndex].weights.length;i++)  {
    if (roll < sections[currentTrackIndex].weights[i]) {
      return sections[currentTrackIndex].children[i];
    } else  {
      roll = roll - sections[currentTrackIndex].weights[i];
    }
  }
  console.log("No roll, returning null");
  return null;
}

function playNextinQueue()  {
  if(nextTrackIndex != null) {
    playTrack(sections[nextTrackIndex].sound);
  }
 }

function queueTrack(newTrackIndex){
  nextTrackIndex = newTrackIndex;
  resetSectionColor();
  console.log('queued next track');
  if(!playing) {
    playNextinQueue();
  }
}

function resetSectionColor ()  {
  console.log(currentTrackIndex);
  console.log(nextTrackIndex);
  for (var i = 0;i<sections.length;i++)  {
    if (i != nextTrackIndex && i != currentTrackIndex) {
      sections[i].color = "rgb(50,50,50)";
    } else if (i == currentTrackIndex && i == nextTrackIndex) {
      sections[i].color = "rgb(200,100,0)";
    } else if (i == currentTrackIndex) {
      sections[i].color = "rgb(0,200,0)";
    } else if (i == nextTrackIndex)  {
      sections[i].color = "rgb(200,0,0)";
    }
  }
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
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
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

