import { build } from 'esbuild';

await build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'api/_server.cjs',
  loader: { '.json': 'json' },
});

console.log('Server bundle built: api/_server.cjs');
