// index.js
require('ts-node/register'); // Enable TypeScript execution
require('./src/app'); // Point to your actual app entry

// server.js
console.log("Render Entry Point Activated");
require('./dist/app'); // Points to compiled TypeScript