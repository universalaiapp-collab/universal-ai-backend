// scripts/postbuild-check.js
const fs = require('fs');
['dist/index.js','dist/logger.js'].forEach(f=>{
  if (!fs.existsSync(f)) { console.error('missing',f); process.exit(1); }
});
console.log('postbuild: ok');
