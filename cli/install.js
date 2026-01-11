#!/usr/bin/env node

/**
 * Post-install script for orca npm package
 * Downloads and installs the appropriate binary for the user's platform
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const { pipeline } = require('stream');
const { promisify } = require('util');
const zlib = require('zlib');

const streamPipeline = promisify(pipeline);

const REPO = 'vanthaita/orca-releases';
const BINARY_NAME = process.platform === 'win32' ? 'orca.exe' : 'orca';
const BIN_DIR = path.join(__dirname, 'bin');

function getPlatformInfo() {
    const platform = process.platform;
    const arch = process.arch;

    let target;
    let archive;

    if (platform === 'win32' && arch === 'x64') {
        target = 'x86_64-pc-windows-msvc';
        archive = 'zip';
    } else if (platform === 'darwin' && arch === 'x64') {
        target = 'x86_64-apple-darwin';
        archive = 'tar.gz';
    } else if (platform === 'darwin' && arch === 'arm64') {
        console.warn('Warning: Native arm64 build not available, using x64 (requires Rosetta)');
        target = 'x86_64-apple-darwin';
        archive = 'tar.gz';
    } else if (platform === 'linux' && arch === 'x64') {
        target = 'x86_64-unknown-linux-gnu';
        archive = 'tar.gz';
    } else {
        throw new Error(`Unsupported platform: ${platform} ${arch}`);
    }

    return { target, archive, platform };
}

async function download(url, dest) {
    return new Promise((resolve, reject) => {
        https
            .get(url, { headers: { 'User-Agent': 'npm-orca-installer' } }, (response) => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    download(response.headers.location, dest).then(resolve).catch(reject);
                    return;
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
                    return;
                }

                const file = fs.createWriteStream(dest);
                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    resolve();
                });

                file.on('error', (err) => {
                    fs.unlink(dest, () => {});
                    reject(err);
                });
            })
            .on('error', reject);
    });
}

async function extractTarGz(archivePath, dest) {
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(archivePath);
        const gunzip = zlib.createGunzip();

        const chunks = [];

        streamPipeline(readStream, gunzip)
            .then((stream) => {
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () => {
                    try {
                        execSync(`tar -xzf "${archivePath}" -C "${path.dirname(dest)}"`, {
                            stdio: 'inherit',
                        });
                        resolve();
                    } catch (err) {
                        reject(
                            new Error(
                                'tar extraction failed. Please install tar or manually extract the archive.'
                            )
                        );
                    }
                });
                stream.on('error', reject);
            })
            .catch(reject);
    });
}

function extractZip(archivePath, dest) {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(archivePath);
    zip.extractAllTo(path.dirname(dest), true);
}

async function install() {
    try {
        console.log('Installing Orca CLI...');

        const { target, archive, platform } = getPlatformInfo();
        console.log(`Detected platform: ${platform} (${target})`);

        if (!fs.existsSync(BIN_DIR)) {
            fs.mkdirSync(BIN_DIR, { recursive: true });
        }

        const downloadUrl = `https://github.com/${REPO}/releases/latest/download/orca-${target}.${archive}`;
        const archivePath = path.join(BIN_DIR, `orca-${target}.${archive}`);
        const binaryPath = path.join(BIN_DIR, BINARY_NAME);

        console.log(`Downloading from ${downloadUrl}...`);
        await download(downloadUrl, archivePath);

        console.log('Extracting binary...');
        if (archive === 'tar.gz') {
            await extractTarGz(archivePath, binaryPath);
            const extractedBinary = path.join(BIN_DIR, 'orca');
            if (fs.existsSync(extractedBinary) && extractedBinary !== binaryPath) {
                fs.renameSync(extractedBinary, binaryPath);
            }
        } else if (archive === 'zip') {
            const tempDir = path.join(BIN_DIR, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }

            execSync(
                `powershell -command "Expand-Archive -Force -Path '${archivePath}' -DestinationPath '${tempDir}'"`,
                {
                    stdio: 'inherit',
                }
            );

            const extractedBinary = path.join(tempDir, BINARY_NAME);
            if (fs.existsSync(extractedBinary)) {
                fs.renameSync(extractedBinary, binaryPath);
            }

            fs.rmSync(tempDir, { recursive: true, force: true });
        }

        if (platform !== 'win32') {
            fs.chmodSync(binaryPath, 0o755);
        }

        fs.unlinkSync(archivePath);

        console.log(`✓ Orca CLI installed successfully to ${binaryPath}`);
        console.log('Run "orca --help" to get started.');
    } catch (error) {
        console.error('Installation failed:', error.message);
        console.error('\nPlease install manually from: https://github.com/vanthaita/orca-releases/releases/latest');
        process.exit(1);
    }
}

if (require.main === module) {
    install();
}

module.exports = { install };
