export {};
const children = [
  Bun.spawn(['bun', '--watch', 'apps/api/src/index.ts'], { stdout: 'inherit', stderr: 'inherit' }),
  Bun.spawn(['bun', 'run', '--bun', 'vite', '--config', 'apps/web/vite.config.ts'], {
    stdout: 'inherit',
    stderr: 'inherit',
  }),
];
function stop() {
  children.forEach((child) => child.kill());
}
process.on('SIGINT', () => {
  stop();
  process.exit(0);
});
process.on('SIGTERM', () => {
  stop();
  process.exit(0);
});
await Promise.race(children.map((child) => child.exited));
stop();
