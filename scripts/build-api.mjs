import { build } from 'esbuild';

await build({
  entryPoints: ['api/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'api/handler.mjs',
  loader: { '.json': 'json' },
});

console.log('API handler built: api/handler.mjs');
