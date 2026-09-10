// @ts-nocheck
// The actual server code lives in server.ts at the project root.
// During build, scripts/build-api.mjs copies it to api/_server.ts.
// Files starting with _ are ignored by Vercel's auto-detection.

import { createServerApp } from "./_server";

const appPromise = createServerApp().then(({ app }) => app);

export default async function handler(request: unknown, response: unknown) {
  const app = await appPromise;
  return app(request as never, response as never);
}
