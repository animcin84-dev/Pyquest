import { build } from 'esbuild';

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
  banner: {
    js: `var __import_meta_url = typeof document === 'undefined' ? require('url').pathToFileURL(__filename).href : (document.currentScript && document.currentScript.src || new URL('api/_server.cjs', document.baseURI).href);`,
  },
  define: {
    'import.meta.url': '__import_meta_url',
  },
});

console.log('Server bundle built: api/_server.cjs');
