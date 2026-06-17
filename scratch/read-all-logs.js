import fs from 'fs';

const logPath = 'C:\\Users\\avipa\\.gemini\\antigravity\\brain\\6354a04b-5b1f-4bd2-87fa-11393d471d2b\\.system_generated\\tasks\\task-975.log';
try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log('Total lines:', lines.length);
  // Print last 150 lines
  console.log(lines.slice(-150).join('\n'));
} catch (err) {
  console.error('Error reading log:', err.message);
}
