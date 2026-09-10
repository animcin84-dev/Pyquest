// @ts-nocheck
// The actual server code lives in server.ts at the project root.
// During build, scripts/build-api.mjs bundles it into api/_server.cjs.
// api/package.json has "type": "commonjs" so require() works here.

const { createServerApp } = require("./_server.cjs");

const appPromise = createServerApp().then((r: any) => r.app);

export default async function handler(request: any, response: any) {
  const app = await appPromise;
  return app(request, response);
}
