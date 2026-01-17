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

const REPO = 'vanthaita/Orca-CLI';
const BINARY_NAME = process.platform === 'win32' ? 'orca.exe' : 'orca';
// BIN_DIR is detected dynamically in install()

// Platform and architecture mapping
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
        target = 'aarch64-apple-darwin';
        archive = 'tar.gz';
    } else if (platform === 'linux' && arch === 'x64') {
        target = 'x86_64-unknown-linux-gnu';
        archive = 'tar.gz';
    } else if (platform === 'linux' && arch === 'arm64') {
        target = 'aarch64-unknown-linux-gnu';
        archive = 'tar.gz';
    } else {
        throw new Error(`Unsupported platform: ${platform} ${arch}`);
    }

    return { target, archive, platform };
}

// Download file from URL
async function download(url, dest) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'npm-orca-installer' } }, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect
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
                fs.unlink(dest, () => { });
                reject(err);
            });
        }).on('error', reject);
    });
}

// Extract tar.gz archive
async function extractTarGz(archivePath, dest) {
    return new Promise((resolve, reject) => {
        try {
            execSync(`tar -xzf "${archivePath}" -C "${path.dirname(dest)}"`, {
                stdio: 'inherit'
            });

            if (fs.existsSync(dest)) {
                resolve();
                return;
            }

            // If the archive contains a nested path, search for the binary and move it to dest.
            const dir = path.dirname(dest);
            const expectedName = path.basename(dest);

            const stack = [dir];
            while (stack.length > 0) {
                const current = stack.pop();
                const entries = fs.readdirSync(current, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(current, entry.name);
                    if (entry.isDirectory()) {
                        stack.push(fullPath);
                        continue;
                    }
                    if (entry.isFile() && entry.name === expectedName) {
                        fs.renameSync(fullPath, dest);
                        resolve();
                        return;
                    }
                }
            }

            reject(new Error(`Binary ${expectedName} not found after extracting ${path.basename(archivePath)}`));
        } catch (err) {
            reject(new Error('tar extraction failed. Please install tar or manually extract the archive.'));
        }
    });
}

// Extract zip archive (Windows)
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

        // Determine BIN_DIR
        // If running from scripts/ (dev), we want ../cli/bin
        // If running from package root (prod), we want ./bin
        const devBinDir = path.join(__dirname, '..', 'cli', 'bin');
        const prodBinDir = path.join(__dirname, 'bin');

        // We use prod structure if we can't find the dev structure, or if we are clearly in the package (package.json exists in __dirname)
        const isProd = fs.existsSync(path.join(__dirname, 'package.json'));
        const BIN_DIR = isProd ? prodBinDir : devBinDir;

        console.log(`Using binary directory: ${BIN_DIR}`);

        // Create bin directory if it doesn't exist
        if (!fs.existsSync(BIN_DIR)) {
            fs.mkdirSync(BIN_DIR, { recursive: true });
        }

        // Determine Version to download
        let version = 'latest';
        try {
            const pkgPath = isProd ? path.join(__dirname, 'package.json') : path.join(__dirname, '..', 'cli', 'package.json');
            if (fs.existsSync(pkgPath)) {
                const pkg = require(pkgPath);
                version = pkg.version;
            }
        } catch (e) {
            console.warn('Could not determine version from package.json, falling back to latest.');
        }

        console.log(`Target version: ${version}`);

        // Construct Download URL
        // Latest: https://github.com/vanthaita/Orca-CLI/releases/latest/download/orca-target.archive
        // Tagged: https://github.com/vanthaita/Orca-CLI/releases/download/v1.2.3/orca-target.archive

        let downloadBase;
        if (version === 'latest') {
            downloadBase = `https://github.com/${REPO}/releases/latest/download`;
        } else {
            const tag = version.startsWith('v') ? version : `v${version}`;
            downloadBase = `https://github.com/${REPO}/releases/download/${tag}`;
        }

        const downloadUrl = `${downloadBase}/orca-${target}.${archive}`;
        const archivePath = path.join(BIN_DIR, `orca-${target}.${archive}`);
        const binaryPath = path.join(BIN_DIR, BINARY_NAME);

        console.log(`Downloading from ${downloadUrl}...`);
        try {
            await download(downloadUrl, archivePath);
        } catch (err) {
            if (version !== 'latest') {
                console.warn(`Failed to download specific version ${version}, falling back to latest...`);
                // Fallback to latest if specific version fails (e.g. if release isn't published yet when testing)
                const latestUrl = `https://github.com/${REPO}/releases/latest/download/orca-${target}.${archive}`;
                await download(latestUrl, archivePath);
            } else {
                throw err;
            }
        }

        console.log('Extracting binary...');
        if (archive === 'tar.gz') {
            await extractTarGz(archivePath, binaryPath);
            // Move binary to correct location if extracted with directory structure
            // In our case, tar might extract to current dir or path/to/bin. 
            // We need to find 'orca' executable.

            // Should reliably be at BIN_DIR/orca if tar command worked as expected with tar -C
            // But let's verify
            const possibleBinary = path.join(BIN_DIR, 'orca');
            if (fs.existsSync(possibleBinary) && possibleBinary !== binaryPath) {
                fs.renameSync(possibleBinary, binaryPath);
            }

        } else if (archive === 'zip') {
            // For Windows/Zip
            const tempDir = path.join(BIN_DIR, 'temp_extract');
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
            fs.mkdirSync(tempDir);

            try {
                execSync(`powershell -command "Expand-Archive -Force -Path '${archivePath}' -DestinationPath '${tempDir}'"`, {
                    stdio: 'inherit'
                });
            } catch (e) {
                // Fallback or retry?
                throw new Error('PowerShell Expand-Archive failed');
            }

            // Find binary in temp (could be nested)
            // But usually it's at root of zip.
            const extractedBinary = path.join(tempDir, BINARY_NAME);

            if (fs.existsSync(extractedBinary)) {
                if (fs.existsSync(binaryPath)) fs.unlinkSync(binaryPath);
                fs.renameSync(extractedBinary, binaryPath);
            } else {
                // Search recursively?
                // For now, assume flat zip
                throw new Error(`Binary ${BINARY_NAME} not found in zip`);
            }

            // Cleanup temp dir
            fs.rmSync(tempDir, { recursive: true, force: true });
        }

        // Make binary executable (Unix-like systems)
        if (platform !== 'win32') {
            if (fs.existsSync(binaryPath)) {
                fs.chmodSync(binaryPath, 0o755);
            } else {
                throw new Error(`Binary path ${binaryPath} does not exist after extraction`);
            }
        }

        // Cleanup archive
        if (fs.existsSync(archivePath)) {
            fs.unlinkSync(archivePath);
        }

        console.log(`✓ Orca CLI installed successfully to ${binaryPath}`);
        console.log('Run "orca --help" to get started.');
    } catch (error) {
        console.error('Installation failed:', error.message);
        console.error('\nPlease install manually from: https://github.com/vanthaita/Orca-CLI/releases/latest');
        process.exit(1);
    }
}

// Run installation
if (require.main === module) {
    install();
}

module.exports = { install };
