var source;
var sourceProcessor;

(function(window){

    var Recorder = function(cfg){
        var config = cfg || {};
        var bufferLen = config.bufferLen || 2048;
        var numChannels = config.numChannels || 1;
        var sampleRate = 0;

        var bufferCallback = config.bufferCallback || function(buffer) { console.log(buffer); };
        var recording = false;
        var first_recording = false;
        var sessionname = "none"


        this.init = function() {
            createAudioContext();
        }

        this.configure = function(cfg){
            for (var prop in cfg){
                if (cfg.hasOwnProperty(prop)){
                    config[prop] = cfg[prop];
                }
            }
        }

        this.record = function(){
            recording = true;
        }

        this.stop = function(){
            recording = false;
        }

        this.sample_rate = function(){
            if (sampleRate >= 22050) {
                return sampleRate / 2;
            }
            else {
                return sampleRate;
            }
        }

        this.sessionname = function(sn){
            sessionname = sn;
        }

        this.sessionname_get = function(){
            return sessionname;
        }

        function createAudioContext() {
            try {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;

                audio_context = new AudioContext;
                navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
                    $( "#warning-content" ).text('This browser does not support microphone access: ' + e);
                    $( "#warning" ).show();
                });

                console.log('Audio is ready.');

                return audio_context;
            } catch (e) {
                $( "#warning-content" ).text('This browser does not support microphone access: ' + e);
                $( "#warning" ).show();
            }
        }

        function startUserMedia(stream) {
            source = audio_context.createMediaStreamSource(stream);
            console.log('Media stream created.');

            sourceProcessor = source.context.createScriptProcessor(bufferLen, numChannels, 1);
            sampleRate = source.context.sampleRate;

            sourceProcessor.onaudioprocess = function(e){
                //console.log('onaudioprocess');
                if (!first_recording) {
                    console.log('onaudioprocess: first recording');
                    $( "#push" ).removeAttr("disabled");
                    first_recording = true;
                }

                if (!recording) return;
                var buffer = e.inputBuffer.getChannelData(0);

                var buffer_down = []
                if (sampleRate >= 22050) {
                    for (var i = 0; i < buffer.length - 1; i = i + 2) {
                        m = (buffer[i] + buffer[i+1]) / 2.0;
                        buffer_down.push(m);
                    }
                }
                else {
                    buffer_down = buffer;
                }

                bufferCallback(buffer_down);
            }

            source.connect(sourceProcessor);
            sourceProcessor.connect(source.context.destination);
        }

    };

    window.Recorder = Recorder;

})(window);