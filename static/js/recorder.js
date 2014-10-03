(function(window){

    var Recorder = function(cfg){
        var config = cfg || {};
        var bufferLen = config.bufferLen || 2048;
        var numChannels = config.numChannels || 1;
        var sampleRate = 0;

        var bufferCallback = config.bufferCallback || function(buffer) { console.log(buffer); };
        var recording = false;
        var sessionname = "none"


        this.init = function() {
            audio_context = createAudioContext();
            navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
                $( "#warning-content" ).text('No live audio input: ' + e);
                $( "#warning" ).show()
            });
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
                console.log('Audio context set up.');
                console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));

                return audio_context;
            } catch (e) {
                $( "#warning-content" ).text('This browser does not support microphone access.');
                $( "#warning" ).show()
            }
        }

        function startUserMedia(stream) {
            var input = audio_context.createMediaStreamSource(stream);
            console.log('Media stream created.');

            var node = input.context.createScriptProcessor(bufferLen, numChannels, 1);
            sampleRate = input.context.sampleRate;

            node.onaudioprocess = function(e){
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
                    buffer_down = buffer
                }

                bufferCallback(buffer_down);
            }

            input.connect(node);
            node.connect(input.context.destination);
        }

    };

    window.Recorder = Recorder;

})(window);