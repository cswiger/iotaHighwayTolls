#!/usr/local/bin/node

// create a seed with: cat /dev/urandom |tr -dc A-Z9|head -c${1:-81}

if (process.argv.length < 3) { 
  console.log("Usage: getAddr.js <address> ");
  process.exit(-1); }

const Iota = require('@iota/core');

// using devnet
const iota = Iota.composeAPI({provider: 'https://nodes.devnet.iota.org:443'});


// Create a wrapping function so you can use async/await
const main = async () => {
  try {
     // use cmd line, args are 2
     const balance = await iota.getBalances([process.argv[2]],100);
     console.log(balance['balances'][0]);
  } catch (error) {
     console.log(error);
  }
}


main();

