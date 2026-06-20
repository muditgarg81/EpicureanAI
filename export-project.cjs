const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const outputFile = path.join(__dirname, 'project_export.txt');

const includeExtensions = ['.js', '.jsx', '.css', '.html', '.json'];
const excludeFolders = ['node_modules', '.git', 'dist', 'build', 'android', 'ios', 'public'];
const specificFiles = ['package.json', 'vite.config.js', 'capacitor.config.json', 'tailwind.config.js', 'index.html'];

let outputData = '# Project Code Export\n\n';

function readDirRecursive(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (!excludeFolders.includes(item)) {
                readDirRecursive(fullPath);
            }
        } else {
            const ext = path.extname(fullPath);
            if (includeExtensions.includes(ext) || item.endsWith('.config.js')) {
                appendFileContent(fullPath);
            }
        }
    }
}

function appendFileContent(filePath) {
    try {
        const relativePath = path.relative(__dirname, filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        outputData += `\n\n--- FILE: ${relativePath} ---\n\n`;
        outputData += content;
    } catch (e) {
        console.error(`Error reading ${filePath}`, e);
    }
}

// Add specific root files
specificFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        appendFileContent(fullPath);
    }
});

// Add src folder files
readDirRecursive(srcDir);

fs.writeFileSync(outputFile, outputData);
console.log(`Successfully exported project to ${outputFile}`);
