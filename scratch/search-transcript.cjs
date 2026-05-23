const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\MUDIT GARG\\.gemini\\antigravity\\brain\\d9f45e84-252f-476d-b41b-59ada030a063\\.system_generated\\logs\\transcript.jsonl';

const fileStream = fs.createReadStream(logPath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

const userInputs = [];
rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT') {
      userInputs.push({ step: obj.step_index, content: obj.content });
    }
  } catch (e) {}
});

rl.on('close', () => {
  console.log("All User inputs in the conversation history:");
  userInputs.forEach(ui => {
    console.log(`Step ${ui.step}: ${ui.content}`);
  });
});
