import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

// Helper to run commands
const run = (cmd, cwd = process.cwd()) => {
    console.log(`> ${cmd}`);
    try {
        execSync(cmd, { stdio: 'inherit', cwd });
    } catch (e) {
        console.error(`Command failed: ${cmd}`);
        process.exit(1);
    }
};

const DIST_DIR = 'dist';
const DEPLOY_DIR = '.deploy_git';
const REPO_URL = execSync('git config --get remote.origin.url').toString().trim();

console.log('Starting custom Windows-safe deployment...');

// 1. Build
run('npm run build');

// 2. Prepare Deploy Directory
if (existsSync(DEPLOY_DIR)) {
    // On Windows, removing a directory with .git inside can be tricky, so we use rmdir /s /q
    // or just try to clean up.
    try {
        if (process.platform === 'win32') {
            execSync(`rmdir /s /q "${DEPLOY_DIR}"`);
        } else {
            execSync(`rm -rf "${DEPLOY_DIR}"`);
        }
    } catch (e) {
        console.warn('Could not remove existing deploy dir, trying to proceed...');
    }
}

// 3. Initialize fresh git repo in deploy dir
// using fs to create dir if needed
if (!existsSync(DEPLOY_DIR)) {
    const fs = await import('fs');
    fs.mkdirSync(DEPLOY_DIR);
}

// 4. Copy dist content to deploy dir
// Using recursion for copy
const fs = await import('fs');
const path = await import('path');

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

console.log('Copying files...');
copyRecursiveSync(DIST_DIR, DEPLOY_DIR);

// Create .nojekyll to prevent Jekyll processing
const fd = fs.openSync(path.join(DEPLOY_DIR, '.nojekyll'), 'w');
fs.closeSync(fd);

// Copy index.html to 404.html for SPA fallback
fs.copyFileSync(path.join(DIST_DIR, 'index.html'), path.join(DEPLOY_DIR, '404.html'));

// 5. Git operations inside the deploy folder
run('git init', DEPLOY_DIR);
run('git checkout -b gh-pages', DEPLOY_DIR);
run('git add -A', DEPLOY_DIR);
run('git commit -m "Deploy from custom script"', DEPLOY_DIR);

// 6. Push
console.log('Pushing to remote...');
// Force push to overwrite the remote branch
run(`git push -f "${REPO_URL}" gh-pages`, DEPLOY_DIR);

console.log('Deployment Complete!');
