const sdk = require('@stackblitz/sdk');
const fs = require('fs');
const path = require('path');

// Read all project files
const files = {};
const baseDir = path.join(__dirname, '..');

function readDir(dir, prefix) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      readDir(fullPath, relPath);
    } else if (entry.isFile() && !entry.name.endsWith('.zip')) {
      files[relPath] = fs.readFileSync(fullPath, 'utf-8');
    }
  }
}
readDir(baseDir, '');

const project = {
  title: 'AI运营助手 Demo',
  description: '中企动力 · 增长智能中心 · AI运营助手产品发布Demo',
  template: 'node',
  files: files,
};

// Open in a new browser tab
sdk.openProject(project, { openFile: 'src/App.jsx', height: 800 });
console.log('Opening StackBlitz project...');
