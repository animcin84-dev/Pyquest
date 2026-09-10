import { build } from 'esbuild';

// Create a plugin to stub out vite (only used in dev mode, not on Vercel)
const stubVitePlugin = {
  name: 'stub-vite',
  setup(build) {
    build.onResolve({ filter: /^vite$/ }, () => ({
      path: 'vite',
      namespace: 'stub',
    }));
    build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: 'export function createServer() { return Promise.resolve({ middlewares: null }); }',
      loader: 'js',
    }));
  },
};

await build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'api/_server.cjs',
  loader: { '.json': 'json' },
  plugins: [stubVitePlugin],
});

console.log('Server bundle built: api/_server.cjs');
