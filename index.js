// index.js
require('ts-node/register'); // Enable TypeScript execution
require('./src/app'); // Point to your actual app entry
// index.js (production entry)
require('dotenv').config(); // Load environment variables
require('./dist/app'); // Load compiled application


// server.js
// console.log("Render Entry Point Activated");

// index.js (updated production entry)
console.log("Production Environment - Using Compiled JS");
require('./dist/app'); // Points to compiled TypeScript
