#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const binPath = path.join(__dirname, process.platform === 'win32' ? 'orca.exe' : 'orca');

const child = spawn(binPath, process.argv.slice(2), { stdio: 'inherit' });

child.on('close', (code) => {
  process.exit(code);
});

child.on('error', (err) => {
  console.error('Failed to start Orca CLI:', err);
  console.error('This might be because the binary was not installed correctly.');
  console.error('Try running: npm rebuild @vanthaita/orca');
  process.exit(1);
});
