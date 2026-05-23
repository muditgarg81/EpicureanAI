const fs = require('fs');

const logPath = 'C:\\Users\\MUDIT GARG\\.gemini\\antigravity\\brain\\d9f45e84-252f-476d-b41b-59ada030a063\\.system_generated\\logs\\transcript.jsonl';

const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');
for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
      for (const tc of obj.tool_calls) {
        if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content' || tc.name === 'write_to_file') {
          console.log(`Step ${obj.step_index} (${tc.name}): TargetFile = ${tc.args.TargetFile || tc.args.TargetFile}`);
          if (tc.args.Instruction) console.log(`  Instruction: ${tc.args.Instruction}`);
          if (tc.args.Description) console.log(`  Description: ${tc.args.Description}`);
        }
      }
    }
  } catch (e) {}
}
