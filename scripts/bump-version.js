const fs = require('fs');
const path = require('path');

const INC_TYPES = ['major', 'minor', 'patch'];

function bumpVersion(version, type) {
    const parts = version.split('.').map(Number);
    if (parts.length !== 3) {
        throw new Error(`Invalid version format: ${version}`);
    }

    switch (type) {
        case 'major':
            parts[0]++;
            parts[1] = 0;
            parts[2] = 0;
            break;
        case 'minor':
            parts[1]++;
            parts[2] = 0;
            break;
        case 'patch':
            parts[2]++;
            break;
        default:
            throw new Error(`Invalid increment type: ${type}`);
    }

    return parts.join('.');
}

function updateFile(filePath, newVersion, isToml = false) {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent;

    if (isToml) {
        // Simple regex replacement for Cargo.toml to preserve comments/formatting
        // Matches: version = "x.y.z"
        newContent = content.replace(/^version\s*=\s*"[^"]+"/m, `version = "${newVersion}"`);
    } else {
        const json = JSON.parse(content);
        json.version = newVersion;
        newContent = JSON.stringify(json, null, 4) + '\n'; // 4 spaces indentation
    }

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath} to version ${newVersion}`);
}

function main() {
    const args = process.argv.slice(2);
    const type = args[0] || 'patch';

    if (!INC_TYPES.includes(type)) {
        console.error(`Invalid version type. Use one of: ${INC_TYPES.join(', ')}`);
        process.exit(1);
    }

    const rootDir = path.resolve(__dirname, '..');
    const cliPackageJsonPath = path.join(rootDir, 'cli', 'package.json');
    const cliCargoTomlPath = path.join(rootDir, 'cli', 'Cargo.toml');

    if (!fs.existsSync(cliPackageJsonPath)) {
        console.error(`File not found: ${cliPackageJsonPath}`);
        process.exit(1);
    }

    // Read current version from package.json (assuming it's the source of truth)
    const packageJson = JSON.parse(fs.readFileSync(cliPackageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;
    const newVersion = bumpVersion(currentVersion, type);

    console.log(`Bumping version from ${currentVersion} to ${newVersion} (${type})`);

    // Update CLI files
    updateFile(cliPackageJsonPath, newVersion);
    updateFile(cliCargoTomlPath, newVersion, true);

    // Future: Add client/server update logic here if needed
}

main();
