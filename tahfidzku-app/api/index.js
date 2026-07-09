import app from '../dist/server/server.js';
import { createServerAdapter } from '@whatwg-node/server';

export default createServerAdapter((request) => {
  return app.fetch(request);
});
