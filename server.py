#!/usr/bin/env python

import wave
import struct
import os.path
import time
import codecs

from flask import Flask, render_template, send_from_directory
from flask.ext.socketio import SocketIO, emit, session
from datetime import datetime

app = Flask(__name__)
app.debug = True
app.config.from_object(__name__)
app.config['SECRET_KEY'] = '12345'
socketio = SocketIO(app)


def get_time_str():
    """ Return current time in dashed ISO-like format.

    It is useful in constructing file and directory names.

    """
    return u'{dt}-{tz}'.format(dt=datetime.now().strftime('%Y-%m-%d--%H-%M-%S.%f'),
        tz=time.tzname[time.localtime().tm_isdst])

def get_file_name():
    fn = os.path.join("data", get_time_str()+".wav")
    return fn

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data/<fn>')
def data(fn):
    print fn
    return send_from_directory('./data', fn, as_attachment=True)

@app.route('/feedback/<sessionname>/<feedback>/<language>', methods=['GET', 'POST'])
def feedback(sessionname, feedback, language):
    print "Feedback", sessionname, feedback, language
    print sessionname+".feedback"
    with codecs.open("./data/"+sessionname+".feedback", "a+", encoding="utf8") as f:
        f.write(feedback)
        f.write("\n")
        f.write(language)
        f.write("\n")

    return "received"

@socketio.on('start')
def start(message):
    print "Start", message

    if message['sample_rate']:
        session['file_name'] = get_file_name()
        session['wav'] = wave.open(session['file_name'], 'wb')
        session['wav'].setparams((1, 2, message['sample_rate'], 0, 'NONE', 'not compressed'))
        session['sample_rate'] = message['sample_rate']
        session['received_samples'] = 0

        emit('sessionname', {'sessionname': os.path.basename(session['file_name'])})

        print "Opening file:", session['file_name']
    else:
        print "sample rate is 0, doing nothing"


@socketio.on('chunk')
def chunk(message):
    print "Chunk", message.keys()

    if 'file_name' in session:
        session['wav'].writeframes(''.join([struct.pack('h', v) for v in message['chunk']]))
        session['received_samples'] += len(message['chunk'])

        emit('result', {'language': 'Silence'})

        if session['received_samples'] > 6*session['sample_rate']:
            emit('stop', {})

@socketio.on('stop')
def stop(message):
    print "Stop", message

    if 'file_name' in session:
        session['wav'].close()

if __name__ == '__main__':
#    socketio.run(app, host = '0.0.0.0', ssl_context=('server.crt', 'server.key'))
    socketio.run(app, host = '0.0.0.0')