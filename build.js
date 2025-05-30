// build.js - Memory-efficient build script
const { spawn } = require('child_process');

console.log('Starting memory-optimized TypeScript build...');

const chunks = [];
const build = spawn('node', [
    '--max-old-space-size=1024',
    './node_modules/typescript/lib/tsc.js',
    '--incremental',
    '--skipLibCheck'
]);

build.stdout.on('data', data => chunks.push(data));
build.stderr.on('data', data => process.stderr.write(data));

build.on('close', code => {
    console.log(Buffer.concat(chunks).toString());
    process.exit(code);
});