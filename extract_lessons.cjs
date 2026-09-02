const fs = require('fs');
const content = fs.readFileSync('src/constants/lessons.ts', 'utf8');
const results = [...content.matchAll(/id:\s*'([^']+)',\s*\n\s*title:\s*'([^']+)',\s*\n\s*description:\s*'([^']+)',\s*\n\s*icon:\s*'[^']+',\s*\n\s*level:\s*'([^']+)'/g)]
  .map(m => `${m[4]} | ${m[1]} | ${m[2]}`);
console.log(results.join('\n'));
