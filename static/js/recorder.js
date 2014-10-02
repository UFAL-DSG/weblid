(function(window){

    var Recorder = function(cfg){
        var config = cfg || {};
        var bufferLen = config.bufferLen || 4096;
        var numChannels = config.numChannels || 1;
        var sampleRate = 0;

        var bufferCallback = config.bufferCallback || function(buffer) { console.log(buffer); };
        var recording = false;

        this.init = function() {
            audio_context = createAudioContext();
            navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
                console.log('No live audio input: ' + e);
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
            return sampleRate;
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
                alert('No web audio support in this browser!');
            }
        }

        function startUserMedia(stream) {
            var input = audio_context.createMediaStreamSource(stream);
            console.log('Media stream created.');

            var node = input.context.createScriptProcessor(bufferLen, numChannels, 1);
            sampleRate = input.context.sampleRate;

            node.onaudioprocess = function(e){
                if (!recording) return;
                var buffer = [];
                for (var channel = 0; channel < numChannels; channel++){
                        buffer.push(e.inputBuffer.getChannelData(channel));
                }

                bufferCallback(buffer);
            }

            input.connect(node);
            node.connect(input.context.destination);
        }

    };

    window.Recorder = Recorder;

})(window);