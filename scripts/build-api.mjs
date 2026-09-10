import { build } from 'esbuild';

await build({
  entryPoints: ['api/_index.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'api/server.js',
  loader: { '.json': 'json' },
});

console.log('API handler built: api/server.js');
