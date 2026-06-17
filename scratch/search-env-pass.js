import fs from 'fs';
import path from 'path';

function searchFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('PASSWORD') || content.includes('password') || content.includes('postgresql://')) {
      console.log(`Found keyword in: ${filePath}`);
      // print lines containing the keyword
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes('password') || line.includes('postgresql://')) {
          console.log(`  L${idx + 1}: ${line.trim()}`);
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
        searchFile(fullPath);
      }
    }
  } catch (err) {
    // ignore
  }
}

traverse(process.cwd());
console.log('Search complete.');
