const fs = require('fs');

const logPath = 'C:\\Users\\MUDIT GARG\\.gemini\\antigravity\\brain\\d9f45e84-252f-476d-b41b-59ada030a063\\.system_generated\\logs\\transcript.jsonl';

const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');
for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    if (obj.step_index >= 3740 && obj.step_index <= 3760) {
      console.log(`Step ${obj.step_index}: source=${obj.source}, type=${obj.type}, status=${obj.status}`);
      if (obj.content) console.log(`  Content: ${obj.content.substring(0, 200)}`);
      if (obj.tool_calls) console.log(`  Tool Calls: ${JSON.stringify(obj.tool_calls)}`);
    }
  } catch (e) {}
}
