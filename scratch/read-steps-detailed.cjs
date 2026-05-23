const fs = require('fs');

const logPath = 'C:\\Users\\MUDIT GARG\\.gemini\\antigravity\\brain\\d9f45e84-252f-476d-b41b-59ada030a063\\.system_generated\\logs\\transcript.jsonl';

const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');
const sublist = [];
for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    if (obj.step_index >= 3740 && obj.step_index < 3760) {
      sublist.push(obj);
    }
  } catch (e) {}
}

for (const step of sublist) {
  console.log(`Step ${step.step_index} (${step.source} - ${step.type}):`);
  if (step.content) console.log(step.content);
  if (step.tool_calls) console.log(JSON.stringify(step.tool_calls));
  console.log("-----------------------------------------");
}
