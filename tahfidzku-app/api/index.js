import app from '../dist/server/server.js';

export const config = {
  runtime: 'edge'
};

export default async function handler(req, ctx) {
  return app.fetch(req, ctx);
}
