import fs from 'fs';
import path from 'path';

function traverse(dir) {
  if (dir.includes('node_modules') || dir.includes('.git') || dir.includes('dist')) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('.map(')) {
        // Find .map( and extract the following code block up to the key attribute
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('.map(')) {
            console.log(`${file}:${idx + 1}: ${line.trim()}`);
            // look ahead for next 5 lines for key=
            for (let i = 1; i <= 6; i++) {
              if (lines[idx + i] && lines[idx + i].includes('key=')) {
                console.log(`  L${idx + i + 1}: ${lines[idx + i].trim()}`);
              }
            }
          }
        });
      }
    }
  }
}

traverse(path.join(process.cwd(), 'src'));
