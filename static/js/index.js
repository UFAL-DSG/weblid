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
    $( "#yes" ).attr("disabled", "disabled");
    $( "#no" ).attr("disabled", "disabled");
    $( "#whatsound" ).hide();
    $( "#warning" ).hide();

    var socket = createSocket();
    var recorder = createRecorder();
});

$( document ).on( "click", "#warning", function() {
    $( "#warning" ).hide();
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

    $( "#yes" ).attr("disabled", "disabled");
    $( "#no" ).attr("disabled", "disabled");

    startRecorder();
});

$( document ).on( "click", ".hide-page-loading-msg", function() {
    stopRecorderAll();
});

$( document ).on( "click", "#yes", function() {
    $( "#yes" ).attr("disabled", "disabled");
    $( "#no" ).attr("disabled", "disabled");

    $.post( "/feedback/"+recorder.sessionname_get()+"/yes" + "/"+$( "#language" ).text() );
});

$( document ).on( "click", "#no", function() {
    $( "#yes" ).attr("disabled", "disabled");
    $( "#no" ).attr("disabled", "disabled");
    $( "#whatsound" ).show();

    $.post( "/feedback/"+recorder.sessionname_get()+"/no" + "/"+$( "#language" ).text() );
});

$( document ).on( "click", "#slselection", function() {
    $( "#whatsound" ).hide();
    $( "#soundtype" ).val("");

    $.post( "/feedback/"+recorder.sessionname_get()+"/yes" + "/"+$( this ).text() );
});

function stopRecorderAll() {
    $.mobile.loading( "hide" );
    $( "#push" ).show();
    $( "#stop" ).hide();

    $( "#yes" ).removeAttr("disabled");
    $( "#no" ).removeAttr("disabled");

    stopRecorder();
}

function center(content) {
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

    socket.on("sessionname", function(r) {
        console.log(r["sessionname"]);
        recorder.sessionname(r["sessionname"]);
    });

    socket.on("result", function(r) {
        console.log(r);
        $( "#language" ).text(r['language']);
    });

    socket.on("stop", function(r) {
        console.log(r);
        stopRecorderAll();
    });

    socket.on("error", function(error) {
        $( "#warning-content" ).text(error);
        $( "#warning" ).show()
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
}

function stopRecorder() {
    recorder.stop();
    socket.emit('stop', {});
}

function handleChunk(chunk) {
    socket.emit("chunk", {chunk: floatTo16BitPCM(chunk)});
}

function floatTo16BitPCM(chunk){
    result = [];
    for( var i = 0; i < chunk.length; i++ ) {
        var s = Math.max(-1, Math.min(1, chunk[i]));
        result[i] = Math.round(s < 0 ? s * 0x8000 : s * 0x7FFF);
    }

    return result;
}

