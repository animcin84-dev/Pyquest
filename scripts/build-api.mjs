import { cpSync } from 'fs';

// Copy server.ts into api/ so Vercel's ncc bundler can resolve the import.
// Files starting with _ are ignored by Vercel's auto-detection.
cpSync('server.ts', 'api/_server.ts');

console.log('Copied server.ts -> api/_server.ts');
