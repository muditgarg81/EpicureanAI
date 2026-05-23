const fs = require('fs');

const logPath = 'C:\\Users\\MUDIT GARG\\.gemini\\antigravity\\brain\\d9f45e84-252f-476d-b41b-59ada030a063\\.system_generated\\logs\\transcript.jsonl';

const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');
for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    if (obj.step_index === 3572) {
      console.log("STEP 3572 chunks:");
      for (const tc of obj.tool_calls) {
        if (tc.name === 'multi_replace_file_content') {
          console.log(JSON.stringify(tc.args.ReplacementChunks, null, 2));
        }
      }
    }
  } catch (e) {}
}
