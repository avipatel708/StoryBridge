import fs from 'fs';
import readline from 'readline';

const fileStream = fs.createReadStream('C:\\Users\\avipa\\.gemini\\antigravity\\brain\\6354a04b-5b1f-4bd2-87fa-11393d471d2b\\.system_generated\\logs\\transcript.jsonl');

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  if (line.toLowerCase().includes('password') || line.toLowerCase().includes('postgresql') || line.includes('VITE_SUPABASE')) {
    try {
      const json = JSON.parse(line);
      console.log(`Step ${json.step_index}:`);
      console.log(line.substring(0, 1000));
    } catch (e) {
      console.log('Line (non-JSON):', line.substring(0, 1000));
    }
  }
});
