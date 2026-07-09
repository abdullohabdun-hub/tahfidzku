import app from '../dist/server/server.js';

export default async function handler(req, ctx) {
  // Pass the incoming standard Web Request to TanStack Start's fetch handler
  return app.fetch(req, ctx);
}
