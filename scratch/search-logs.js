import fs from 'fs';
import readline from 'readline';

const logPath = 'C:\\Users\\avipa\\.gemini\\antigravity\\brain\\6354a04b-5b1f-4bd2-87fa-11393d471d2b\\.system_generated\\logs\\transcript.jsonl';

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const json = JSON.parse(line);
    const content = json.content || '';
    if (content.toLowerCase().includes('failed to fetch') || content.toLowerCase().includes('cors') || content.toLowerCase().includes('typeerror')) {
      console.log(`Step ${json.step_index}:`);
      console.log(content.substring(0, 500));
    }
  } catch (err) {
    // ignore
  }
});
