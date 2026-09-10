import { createServerApp } from "../server.ts";

// Vercel invokes this handler for every /api/* request (see vercel.json).
// Keeping the Express app behind one serverless function lets the local
// Socket.IO development server remain unchanged while production REST routes
// use the same validation and trusted Firebase Admin operations.
const appPromise = createServerApp().then(({ app }) => app);

export default async function handler(request: unknown, response: unknown) {
  const app = await appPromise;
  return app(request as never, response as never);
}
