# iotaHighwayTolls
node.js scripts to pay highway tolls in IOTA tokens using GPS



tollbooths.json - set of polygon geographical areas over selected highways between Charleston WV and Outer Banks NC for field testing during an upcoming trip to the beach and back. 


GPS_payToll.js - node.js script to run from /etc/rc.local on startup, tracks GPS location and sends IOTA tokens to the toll collector address whenever a virtual tollbooth area is entered.


config.ini :
   1. stores current index of source address of IOTA tokens, incremented every time a toll payment is made
   1. address of toll collector - this can be based off a different seed and account from the drivers source address
   1. seed of drivers source addresses. This file should have permissions 0600 read/writable by owner only for security 
   
node.js packages used:
1. https://www.npmjs.com/package/@iota/core
1. https://www.npmjs.com/package/@iota/converter
1. https://www.npmjs.com/package/ini
1. https://www.npmjs.com/package/gps
1. https://www.npmjs.com/package/serialport
1. https://www.npmjs.com/package/@serialport/parser-readline
1. https://www.npmjs.com/package/geolib
1. https://www.npmjs.com/package/nexmo


