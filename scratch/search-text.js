import fs from 'fs';
import path from 'path';

const keyword = 'row';

function searchFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.toLowerCase().includes(keyword)) {
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(keyword)) {
          console.log(`Found in ${filePath}:L${idx + 1}: ${line.trim().substring(0, 150)}`);
        }
      });
    }
  } catch (err) {
    // ignore
  }
}

function traverse(dir) {
  if (dir.includes('node_modules') || dir.includes('.git') || dir.includes('.next') || dir.includes('dist')) return;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else {
        const ext = path.extname(file);
        if (['.ts', '.tsx', '.js', '.mjs', '.sql', '.html', '.json'].includes(ext)) {
          searchFile(fullPath);
        }
      }
    }
  } catch (err) {
    // ignore
  }
}

traverse(process.cwd());
console.log('Search complete.');
