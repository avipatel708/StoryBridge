import fs from 'fs';
import readline from 'readline';

const fileStream = fs.createReadStream('C:\\Users\\avipa\\.gemini\\antigravity\\brain\\6354a04b-5b1f-4bd2-87fa-11393d471d2b\\.system_generated\\logs\\transcript.jsonl');

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  if (line.includes('SUPABASE_DB_PASSWORD=') && !line.includes('your_database_password')) {
    console.log('Found password line:', line.substring(0, 1000));
  }
});
