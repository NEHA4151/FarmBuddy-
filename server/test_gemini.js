import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testModel(modelName) {
  console.log(`\nTesting model: ${modelName}...`);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
  
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: "Hello, reply with only the word 'OK'." }]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log(`Response text:`, text);
  } catch (err) {
    console.error(`Error for ${modelName}:`, err.message);
  }
}

async function runTests() {
  await testModel('gemini-3-pro-preview');
  await testModel('gemini-3-pro-image');
}

runTests();
