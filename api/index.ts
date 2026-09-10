/* eslint-disable @typescript-eslint/no-require-imports */
// @ts-nocheck
// The actual server code lives in server.ts at the project root.
// During build, scripts/build-api.mjs bundles it into api/_server.cjs.
// This wrapper proxies all /api/* requests to the Express app.

const { createServerApp } = require("./_server.cjs");

const appPromise = createServerApp().then(({ app }: any) => app);

export default async function handler(request: any, response: any) {
  const app = await appPromise;
  return app(request, response);
}
