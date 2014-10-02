#!/usr/bin/env python

import wave
import struct
import os.path
import time

from flask import Flask, render_template, request, jsonify
from flask.ext.socketio import SocketIO, emit, session
from datetime import datetime

app = Flask(__name__)
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


@socketio.on('start')
def start(message):
    print "Start", message

    session['file_name'] = get_file_name()
    session['wav'] = wave.open(session['file_name'], 'wb')
    session['wav'].setparams((1, 2, message['sample_rate'], 0, 'NONE', 'not compressed'))

    print "Opening file:", session['file_name']

@socketio.on('chunk')
def chunk(message):
    print "Chunk", message.keys()
    #packed_chunk = struct.pack('b', message['chunk'])
    session['wav'].writeframes(''.join([struct.pack('h', v) for v in message['chunk']]))

@socketio.on('stop')
def end_recognition(message):
    print "Stop", message
    session['wav'].close()

if __name__ == '__main__':
    socketio.run(app)