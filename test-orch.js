const http = require('http');

(async () => {
  try {
    const payload = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say hello and the time in ISO' }]
    });

    const opts = {
      hostname: '127.0.0.1',   // use IPv4 to avoid ::1/IPv6 resolution issues
      port: 5000,              // <- make sure this matches $env:PORT / .env
      path: '/api/v1/orch/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 10000
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { console.log(JSON.stringify(JSON.parse(data), null, 2)); }
        catch(e) { console.log('RAW:', data); }
      });
    });

    req.on('error', (e) => { console.error('request error', e.message); });
    req.write(payload);
    req.end();
  } catch (err) {
    console.error(err);
  }
})();
