#!/usr/bin/env python

import wave
import struct
import os.path
import time

from flask import Flask, render_template, request, jsonify
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

@app.route('/feedback/<sessionname>/<feedback>/<language>', methods=['GET', 'POST'])
def feedback(sessionname, feedback, language):
    print "Feedback", sessionname, feedback, language
    print sessionname+".feedback"
    with open("./data/"+sessionname+".feedback", "w") as f:
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

        emit('sessionname', {'sessionname': os.path.basename(session['file_name'])})

    print "Opening file:", session['file_name']

@socketio.on('chunk')
def chunk(message):
    print "Chunk", message.keys()

    if session['file_name']:
        session['wav'].writeframes(''.join([struct.pack('h', v) for v in message['chunk']]))

        emit('result', {'language': 'Silence'})

@socketio.on('stop')
def stop(message):
    print "Stop", message

    if session['file_name']:
        session['wav'].close()

if __name__ == '__main__':
    socketio.run(app, host = '0.0.0.0')