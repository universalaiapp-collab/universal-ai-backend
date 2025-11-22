// scripts/curlTest.js
const http = require('http');

const data = JSON.stringify({ prompt: "quick test" });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/orch',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  },
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers));
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('BODY:', body);
  });
});

req.on('timeout', () => { console.error('request timed out'); req.abort(); });
req.on('error', (e) => { console.error('request error', e.message); });
req.write(data);
req.end();
