const http = require("http");
const data = JSON.stringify({messages:[{role:"user",content:"Hello test"}]});
const opts = { hostname: "127.0.0.1", port: 4000, path: "/api/v1/chat", method: "POST", headers: {"Content-Type":"application/json","x-user-id":"test-user","Content-Length": Buffer.byteLength(data)}};
const req = http.request(opts, res => { let out=""; res.on("data",c=>out+=c); res.on("end",()=>{ console.log("STATUS",res.statusCode); console.log("BODY",out); });});
req.on("error",e=>console.error(e)); req.write(data); req.end();
