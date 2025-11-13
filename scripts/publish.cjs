#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Logging helpers
const log = (msg) => console.log(`\n🟡 ${msg}`);
const success = (msg) => console.log(`✅ ${msg}`);
const error = (msg) => {
    console.error(`❌ ${msg}`);
    process.exit(1);
};

// Paths
const pkgPath = path.resolve('package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const args = process.argv.slice(2);

// Run shell command
const run = (cmd) => {
    log(`Running: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
};

// Auto-increment patch version
const bumpPatchVersion = (version) => {
    const [major, minor, patch] = version.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
};

// Swap README for NPM
const swapReadmeForNpm = () => {
    const npmReadme = path.resolve('README.npm.md');
    const targetReadme = path.resolve('README.md');

    if (fs.existsSync(npmReadme)) {
        fs.copyFileSync(targetReadme, path.resolve('README.github.md'));
        fs.copyFileSync(npmReadme, targetReadme);
        success('Swapped README.npm.md → README.md for NPM publish');
    } else {
        log('No README.npm.md found. Using default README.md');
    }
};

// Restore original README
const restoreReadme = () => {
    const ghReadme = path.resolve('README.github.md');
    const targetReadme = path.resolve('README.md');

    if (fs.existsSync(ghReadme)) {
        fs.copyFileSync(ghReadme, targetReadme);
        fs.unlinkSync(ghReadme);
        success('Restored original GitHub README.md');
    }
};

// Main flow
const main = () => {
    console.log(`📍 Current Git Branch: ${branch}`);

    if (!fs.existsSync('build/index.js')) {
        error('Build not found. Run `npm run build` first.');
    }

    // Check for version override
    const versionFlagIndex = args.indexOf('--version');
    let newVersion = '';

    if (versionFlagIndex !== -1 && args[versionFlagIndex + 1]) {
        newVersion = args[versionFlagIndex + 1];
        success(`Custom version passed via CLI: ${newVersion}`);
    } else {
        newVersion = bumpPatchVersion(pkg.version);
        success(`Auto-incremented patch version: ${pkg.version} → ${newVersion}`);
    }

    pkg.version = newVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

    swapReadmeForNpm();

    run('npm run build');

    const tag = branch === 'develop' ? '--tag alpha' : '';
    run(`npm publish ${tag}`);

    restoreReadme();

    success(`Published ${pkg.name}@${newVersion} to NPM (${tag || 'latest'})`);
};

main();
