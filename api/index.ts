// @ts-nocheck
// api/_server.cjs is pre-built by scripts/build-api.mjs from server.ts.
// We use dynamic import() to load the CJS bundle from ESM scope.

const mod = await import("./_server.cjs");
const createServerApp = mod.createServerApp;

const appPromise = createServerApp().then((r: any) => r.app);

export default async function handler(request: any, response: any) {
  const app = await appPromise;
  return app(request, response);
}
