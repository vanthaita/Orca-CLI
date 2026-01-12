const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');

const packageJson = require('./package.json');
const version = packageJson.version; // e.g., "0.1.26"

// Map platform and arch to the release asset name
function getAssetName() {
    const platform = process.platform;
    const arch = process.arch;

    if (platform === 'win32') {
        return 'orca-win32-x64.zip';
    } else if (platform === 'linux') {
        // Assuming standard x64 linux for now
        return 'orca-linux-x64.tar.gz';
    } else if (platform === 'darwin') {
        if (arch === 'arm64') {
            return 'orca-darwin-arm64.tar.gz';
        } else {
            return 'orca-darwin-x64.tar.gz';
        }
    }
    throw new Error(`Unsupported platform: ${platform}-${arch}`);
}

const assetName = getAssetName();
const downloadUrl = `https://github.com/vanthaita/orca-releases/releases/download/v${version}/${assetName}`;
const binDir = path.join(__dirname, 'bin');
const downloadPath = path.join(binDir, assetName);

// Ensure bin directory exists
if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
}

console.log(`Downloading Orca v${version} from ${downloadUrl}...`);

const file = fs.createWriteStream(downloadPath);

https.get(downloadUrl, (response) => {
    if (response.statusCode !== 200) {
        console.error(`Failed to download: ${response.statusCode} ${response.statusMessage}`);
        process.exit(1);
    }

    response.pipe(file);

    file.on('finish', () => {
        file.close(() => {
            console.log('Download completed.');
            extractAsset();
        });
    });
}).on('error', (err) => {
    fs.unlink(downloadPath, () => { }); // Delete the file async. (But we don't check result)
    console.error(`Error downloading file: ${err.message}`);
    process.exit(1);
});


function extractAsset() {
    console.log('Extracting...');
    try {
        if (assetName.endsWith('.zip')) {
            const zip = new AdmZip(downloadPath);
            zip.extractAllTo(binDir, true);
        } else {
            // For tar.gz on Linux/Mac, use tar command (simpler than adding another dep)
            // Note: This relies on the system having 'tar'. Most Unix systems do.
            execSync(`tar -xzf "${downloadPath}" -C "${binDir}"`);
        }

        console.log('Extraction complete.');

        // Cleanup archive
        fs.unlinkSync(downloadPath);

        if (process.platform !== 'win32') {
            const binaryName = 'orca';
            const binaryPath = path.join(binDir, binaryName);
            if (fs.existsSync(binaryPath)) {
                fs.chmodSync(binaryPath, '755');
            }
        }

        checkConflict();

    } catch (err) {
        console.error(`Error extracting file: ${err.message}`);
        process.exit(1);
    }
}

function checkConflict() {
    try {
        const cmd = process.platform === 'win32' ? 'where orca' : 'which orca';
        const existingPath = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().split('\n')[0].trim();

        if (existingPath && !existingPath.includes('npm')) {
            console.warn('\n\x1b[33m%s\x1b[0m', '-------------------------------------------------------');
            console.warn('\x1b[33m%s\x1b[0m', 'WARNING: Conflicting "orca" installation detected!');
            console.warn(`  - Existing path: ${existingPath}`);
            console.warn(`  - This system installation may override the npm version.`);
            console.warn('\x1b[33m%s\x1b[0m', 'To use the new version, please UNINSTALL the existing one.');
            console.warn('\x1b[33m%s\x1b[0m', '-------------------------------------------------------\n');
        }
    } catch (e) {
        // Command failed (orca not found in PATH), which is good.
    }
}
