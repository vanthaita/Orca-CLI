#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const platform = process.platform;
const binaryName = platform === 'win32' ? 'orca.exe' : 'orca';
const binaryPath = path.join(__dirname, binaryName);

const args = process.argv.slice(2);

const child = spawn(binaryPath, args, {
    stdio: 'inherit',
    windowsHide: true
});

child.on('error', (err) => {
    if (err.code === 'ENOENT') {
        console.error(`\nError: Could not find "orca" binary at ${binaryPath}`);
        console.error('Please try running "npm install" again to download the binary.\n');
    } else {
        console.error(err);
    }
    process.exit(1);
});

child.on('close', (code) => {
    process.exit(code);
});
