// tests/globalSetup.js
const { register } = require('ts-node');

// Register ts-node to compile TS files on the fly
register({
  transpileOnly: true, // Speed up execution
});

// Import your actual TS setup file
// Note: We use .default because your TS file likely exports a default function
module.exports = async () => {
  const setup = require('./globalSetup.ts'); 
  if (setup.default) {
    await setup.default();
  } else {
    await setup();
  }
};
