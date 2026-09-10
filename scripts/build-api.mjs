import { build } from 'esbuild';

await build({
  entryPoints: ['api/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'api/handler.js',
  loader: { '.json': 'json' },
});

console.log('API handler built: api/handler.js');
