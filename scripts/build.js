const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy critical frontend assets
const filesToCopy = [
  'index.html',
  'nudgepoint.jsx',
  'styles.css'
];

filesToCopy.forEach(file => {
  const src = path.join(rootDir, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} -> public/${file}`);
  }
});

// Create 404.html (copy of index.html for SPA fallback routing)
const indexPath = path.join(rootDir, 'index.html');
const notFoundPath = path.join(publicDir, '404.html');
if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('Created public/404.html for SPA fallback routing');
}

// Copy all image assets
fs.readdirSync(rootDir).forEach(item => {
  if (/\.(png|jpg|jpeg|svg|ico|webp)$/i.test(item)) {
    fs.copyFileSync(path.join(rootDir, item), path.join(publicDir, item));
  }
});

console.log('Build complete: public/ directory populated successfully.');
