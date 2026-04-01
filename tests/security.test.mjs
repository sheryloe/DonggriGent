import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { isPathWithin, assertWithin } from '../orchestrator/security.mjs';

test('security: isPathWithin respects allowed roots', () => {
  const root = path.resolve('/tmp/agentify-root');
  const ok = path.join(root, 'a', 'b.txt');
  const bad = path.resolve('/tmp/agentify-root-2/x.txt');
  assert.equal(isPathWithin({ filePath: ok, allowedRoots: [root] }), true);
  assert.equal(isPathWithin({ filePath: bad, allowedRoots: [root] }), false);
});

test('security: assertWithin throws', () => {
  const root = path.resolve('/tmp/agentify-root');
  assert.throws(() => assertWithin({ filePath: '/etc/passwd', allowedRoots: [root] }), /path_not_allowed/);
});

test('security: cross-drive absolute path is not treated as inside root on Windows', () => {
  if (process.platform !== 'win32') return;
  const root = 'C:\\agentify-root';
  const otherDrive = 'D:\\outside\\file.txt';
  assert.equal(isPathWithin({ filePath: otherDrive, allowedRoots: [root] }), false);
});

