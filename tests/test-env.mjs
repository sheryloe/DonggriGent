import net from 'node:net';
import path from 'node:path';

export const TEST_TMPDIR = String(process.env.TEST_TMPDIR || process.env.TMPDIR || '/tmp').trim() || '/tmp';

export function testTmpPath(prefix) {
  return path.join(TEST_TMPDIR, prefix);
}

let bindLoopbackPromise = null;

export async function canBindLoopback() {
  if (!bindLoopbackPromise) {
    bindLoopbackPromise = new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.listen(0, '127.0.0.1', () => {
        server.close(() => resolve(true));
      });
    });
  }
  return await bindLoopbackPromise;
}
