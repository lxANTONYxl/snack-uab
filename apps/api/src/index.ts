import { serveStatic } from 'hono/bun';
import { app } from './app';
app.use('*', serveStatic({ root: './apps/web/dist' }));
app.get('*', serveStatic({ path: './apps/web/dist/index.html' }));
const port = Number(process.env.PORT || 3001);
console.log(`Snack UAB API: http://127.0.0.1:${port}`);
export default { port, hostname: '127.0.0.1', fetch: app.fetch };
