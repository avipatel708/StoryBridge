const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('C:\\Users\\avipa\\.gemini\\antigravity\\brain\\6354a04b-5b1f-4bd2-87fa-11393d471d2b\\.system_generated\\logs\\transcript.jsonl');

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const json = JSON.parse(line);
    if (json.step_index >= 595) {
      console.log(`Step ${json.step_index} (${json.source} - ${json.type}):`);
      if (json.content) {
        console.log(`  Content: ${json.content.substring(0, 200)}...`);
      }
      if (json.tool_calls) {
        console.log(`  Tool Calls: ${JSON.stringify(json.tool_calls)}`);
      }
    }
  } catch (err) {
    // ignore parse errors
  }
});
