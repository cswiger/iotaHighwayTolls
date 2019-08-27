#!/usr/local/bin/node

// create a seed with: cat /dev/urandom |tr -dc A-Z9|head -c${1:-81}

if (process.argv.length < 5) { 
  console.log("Usage: getAddr.js <seed> <index> <number>");
  process.exit(-1); }

const Iota = require('@iota/core');

// using devnet
const iota = Iota.composeAPI({provider: 'https://nodes.devnet.iota.org:443'});


// Create a wrapping function so you can use async/await
const main = async () => {

  // use cmd line, args are 2,3 converted to Number()
  const newAddr = await iota.getNewAddress(process.argv[2], { index: Number(process.argv[3]), total: Number(process.argv[4]) });

  console.log(newAddr);
}


main();
