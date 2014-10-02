$(window).resize(function(){
    center("#push");
    center("#stop");
});

$(document).ready(function(){
    // Handler for .ready() called.
    center("#push");
    center("#stop");
    /* your other page load code here*/
    $( "#stop" ).hide();

    var socket = createSocket();
    var recorder = createRecorder();
});

$( document ).on( "click", ".show-page-loading-msg", function() {
    var $this = $( this ),
        theme = $this.jqmData( "theme" ) || $.mobile.loader.prototype.options.theme,
        msgText = $this.jqmData( "msgtext" ) || $.mobile.loader.prototype.options.text,
        textVisible = $this.jqmData( "textvisible" ) || $.mobile.loader.prototype.options.textVisible,
        textonly = !!$this.jqmData( "textonly" );
        html = $this.jqmData( "html" ) || "";
    $.mobile.loading( "show", {
            text: msgText,
            textVisible: textVisible,
            theme: theme,
            textonly: textonly,
            html: html
    });
    $( "#push" ).hide();
    $( "#stop" ).show();
    startRecorder()
});

$( document ).on( "click", ".hide-page-loading-msg", function() {
    $.mobile.loading( "hide" );
    $( "#push" ).show();
    $( "#stop" ).hide();
    stopRecorder()
});

function center(content){
	var content = $( content );
    var container = content.parent();
	content.css("left", (container.width()-content.outerWidth())/2);
	content.css("top", (container.height()-content.outerHeight())/2);
}

function createSocket() {
    socket = io.connect();

    socket.on("connection", function() {
        console.log("Socket connected");
    });

    socket.on("result", function(results) {
        console.log(results);
    });

    socket.on("error", function(error) {
        console.log(error);
    });

    socket.on("end", function() {
        console.log("Socket end");
    });

    return socket;
}

function createRecorder() {
    recorder = new Recorder({
        bufferCallback: handleChunk
    });
    recorder.init();

    return recorder;
}

function startRecorder() {
    socket.emit('start', {sample_rate: recorder.sample_rate()});
    recorder.record();
};

function stopRecorder() {
    recorder.stop();
    socket.emit('stop', {});
};

function handleChunk(chunk) {
    socket.emit("chunk", {chunk: floatTo16BitPCM(chunk[0])});
}

function floatTo16BitPCM(chunk){
    result = [];
    for( i = 0; i < chunk.length; i++ ) {
        var s = Math.max(-1, Math.min(1, chunk[i]));
        result[i] = Math.round(s < 0 ? s * 0x8000 : s * 0x7FFF);
    }

    return result;
}