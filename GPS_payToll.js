#!/usr/local/bin/node
// Sends an iota from a source address to a toll collector with remainer saved in the next address

// requirements
const Iota = require('@iota/core');
const Converter = require('@iota/converter');
const fs = require('fs');
const ini = require('ini');
// stuff for reading the em506 gps module
var GPS = require('gps');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
// geolib
const geolib = require('geolib');
// nexmo sms text notifications
const Nexmo = require('nexmo');
// load tollbooths polys - important to use absolute path here if run from /etc/rc.local
const tollbooths = require('/home/pi/src/iotaNodeJS/tollbooths.json');

// create the iota api on devnet
const iota = Iota.composeAPI({ provider: 'https://nodes.devnet.iota.org:443' }); 

// create the gps object and start reading and parsing nmea sentences
var gps = new GPS;
const port = new SerialPort('/dev/ttyS0', { baudRate: 4800 });
const parser = new Readline();
port.pipe(parser);
parser.on('data', line => gps.update(line));

// flag for having paid toll prevent multi payments
var paid = false;

// function to clear paid toll flag after a setTimeout(clearPaidFlag,300000) or 5 minutes
function clearPaidFlag() { paid = false; }

// create nexmo 
const nexmo = new Nexmo({
  apiKey: YOUR_API_KEY,
  apiSecret: YOUR_API_SECRET
});

// Create a wrapping function for IOTA payments
async function payToll(msg) {

  // read current config
  var config = ini.parse(fs.readFileSync('/home/pi/src/iotaNodeJS/config.ini', 'utf-8'));
  const seed = config.paytoll.myseed;
  const tollCollector = config.paytoll.tollCollector;
  currentIndex = Number(config.paytoll.currentIndex);

  // Construct a bundle that transfers the tokens to your new address
  // Pay 1 IOTA per toll
  const transfers = [
    {
      value: 1,             // tolls are currently minimal
      address: tollCollector,
      tag: 'TBCOLLECT', 	// Toll Booth collection
      message: Converter.asciiToTrytes(msg)
    }
  ];

  // gets current address with funds and next one for remainder
  // prints deprecated warning about 'total' https://github.com/iotaledger/iota.js/blob/next/api_reference.md#module_core.getNewAddress
  const newAddr = await iota.getNewAddress(seed, { index: currentIndex, total: 2 });   // returns an array of 2 addr

  // get balance in source address, needed for the transfer options
  const balance = await iota.getBalances([newAddr[0]],100);
  if (balance['balances'][0] < 50) {   // text user if balance below threshold, set above balance to test
    nexmo.message.sendSms(YOUR_SRC_NUMBER, YOUR_DST_NUMBER, 'low toll balance: ' + balance['balances'][0].toString(), (err, responseData) => {
    if (err) { console.log(err); } else { console.dir(responseData); }
    });
  }

  try {
    // Construct bundle and convert to trytes
    // extra stuff - options contains an address for any remainder, 
    const securitylvl = 2;
    const options = { 'inputs': 
	[{ address: newAddr[0],     // take from current index address
	keyIndex: currentIndex,     // <-- source address index, must match option address below or get invalid signature
	balance: balance['balances'][0],   // balance from query above, could be kept in config.ini also
	security: securitylvl, }],     // end of options.inputs
	remainderAddress: newAddr[1]
	} 
    const trytes = await iota.prepareTransfers(seed, transfers, options);
    // Send bundle to node.
    const response = await iota.sendTrytes(trytes, 3, 9);

    console.log('Bundle sent');
    response.map(tx => console.log(tx));
    // bump up currentIndex, config.ini should have permissions 0600 to be private and writable
    config.paytoll.currentIndex = (currentIndex + 1).toString()
    fs.writeFileSync('/home/pi/src/iotaNodeJS/config.ini', ini.stringify(config.paytoll, { section: 'paytoll' }))
  } catch (error) {
    console.log(error);
    throw error;	// try fixing unhandled promise rejections when cell coverage is spotty
  }
}

// function to check gps and call payToll() when in range of any virtual booth in array 'tollbooths'

async function checkGPS() {
    if (gps.state.fix) {    // do not check if gps.state.lat|lon are null
        console.log("checking ",gps.state.lat,", ",gps.state.lon," ");
        for (var ndx=0; ndx<tollbooths.length; ndx++) {
           if ( geolib.isPointInPolygon({ latitude: gps.state.lat, longitude: gps.state.lon }, tollbooths[ndx] ))
           { console.log("in toll area");
             if ( ! paid ) {
                paid = true;
                // create iota message of lat/lon/vin in legal characters
                if (gps.state.lat>0) { var NS = 'N' } else { var NS = 'S'}
                if (gps.state.lon>0) { var EW = 'E' } else { var EW = 'W'}
                var msg = 'LAT' + Math.abs(gps.state.lat).toFixed(4).replace('.','P') + NS + 'LON' + Math.abs(gps.state.lon).toFixed(4).replace('.','P') + EW + 'VINORSOMEID'; 

                await payToll(msg).catch( e => { console.error(e) } );   //  fix unhandled promise rejections when cell coverage is spotty
                nexmo.message.sendSms(YOUR_SRC_NUMBER, YOUR_DST_NUMBER, 'toll paid 1i', (err, responseData) => {
                   if (err) { console.log(err); } else { console.dir(responseData); }
                });    // send text to user that payment was made
                setTimeout(clearPaidFlag,300000);
             }
           }
        }
    }
    setTimeout(checkGPS,5000);    // schedule another run of myself in 5 seconds
}

checkGPS();          // start it off


