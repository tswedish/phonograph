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
var nextTrack = null;
var playing = false;


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


function playTrack(buffer){
        console.log('playing next track');
        var source = context.createBufferSource();
        source.buffer = buffer;
        //var filter = context.createBiquadFilter();
        //filter.type = 0;  // In this case it's a lowshelf filter
        //filter.frequency.value = 440;
        //source.connect(filter);
        //filter.connect(context.destination);
        source.connect(context.destination);
        source.noteOn(0);
        nextTrack = null;
        playing = true;
        var timer = setTimeout(function() {
          console.log('playback finished');
          playing = false;
          playNextinQueue();
        }, buffer.duration * 1000);
}

function playNextinQueue()  {
  if(nextTrack != null) {
    playTrack(nextTrack);
  }
 }

function queueTrack(newBuffer){
  nextTrack = newBuffer;
  console.log('queued next track');
  if(!playing) {
    playNextinQueue();
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

