#!/usr/local/bin/node

var GPS = require('gps');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

var gps = new GPS;

const port = new SerialPort('/dev/ttyS0', { baudRate: 4800 });
const parser = new Readline();
port.pipe(parser);
parser.on('data', line => gps.update(line));

setInterval( function() {
  console.log(gps.state['time'],gps.state['lat'],gps.state['lon']);
  }, 1000);   // milliseconds

