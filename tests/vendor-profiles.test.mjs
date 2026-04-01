import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import { listVendorsFromProfiles, loadVendorProfiles, profileByVendorId } from '../vendor-profiles.mjs';
import { testTmpPath } from './test-env.mjs';

test('vendor-profiles: loads supported KGentool vendors', async () => {
  const profiles = await loadVendorProfiles({ stateDir: '/tmp/nonexistent-state' });
  const vendors = listVendorsFromProfiles(profiles);
  assert.equal(vendors.length, 6);
  assert.ok(vendors.some((item) => item.id === 'chatgpt'));
  assert.ok(vendors.some((item) => item.id === 'aistudio'));
});

test('vendor-profiles: resolves profiles by vendor id', async () => {
  const profiles = await loadVendorProfiles({ stateDir: '/tmp/nonexistent-state' });
  const profile = profileByVendorId(profiles, 'claude');
  assert.equal(profile?.id, 'claude');
  assert.match(profile?.startUrl || '', /^https:\/\/claude\.ai/);
});

test('vendor-profiles: supports toml profiles and base profile inheritance', async () => {
  const dir = await fs.mkdtemp(testTmpPath('kgentool-vendor-profiles-'));
  await fs.writeFile(
    path.join(dir, 'base.toml'),
    [
      'status = "supported"',
      '',
      '[selectors]',
      'promptTextarea = "textarea.base"',
      'sendButton = "button.base"'
    ].join('\n'),
    'utf8'
  );
  await fs.writeFile(
    path.join(dir, 'chatgpt.toml'),
    [
      'id = "chatgpt"',
      'name = "ChatGPT"',
      'start_url = "https://chatgpt.com/"',
      '',
      '[selectors]',
      'sendButton = "button.send"'
    ].join('\n'),
    'utf8'
  );

  const profiles = await loadVendorProfiles({ dir, stateDir: '/tmp/nonexistent-state' });
  assert.equal(profiles.length, 1);
  assert.equal(profiles[0].selectors.promptTextarea, 'textarea.base');
  assert.equal(profiles[0].selectors.sendButton, 'button.send');
});
