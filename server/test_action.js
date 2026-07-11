import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function testActionable() {
  console.log("Testing actionable command: 'Add irrigation entry of 500 liters for batch FB-2026-001'...");
  const res = await fetch('http://localhost:3000/api/ai/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'voice',
      transcript: "Add irrigation entry of 500 liters for batch FB-2026-001"
    })
  });
  
  console.log(`Status: ${res.status}`);
  const data = await res.json();
  console.log("Response data:", JSON.stringify(data, null, 2));
}

testActionable();
