// test-orch.js
const fetch = require('node-fetch'); // or use global fetch in Node 18+
(async ()=> {
  const res = await fetch('http://localhost:4000/api/v1/orch/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Say hello and the time in ISO' }]})
  });
  const j = await res.json();
  console.log(JSON.stringify(j, null, 2));
})();
