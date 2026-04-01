import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadAgentDefinition, loadAgentDefinitions } from '../agent-definitions.mjs';
import { testTmpPath } from './test-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('agent-definitions: loads project-local Codex agents', async () => {
  const dirPath = path.join(__dirname, '..', '.codex', 'agents');
  const definitions = await loadAgentDefinitions(dirPath);
  assert.ok(definitions.length >= 6);
  assert.ok(definitions.some((item) => item.id === 'kgentool-supervisor'));
  assert.ok(definitions.some((item) => item.id === 'cpp-pro-kg'));
  assert.ok(definitions.some((item) => item.id === 'kgentool-supervisor-ko'));
  assert.ok(definitions.some((item) => item.id === 'cpp-pro-kg-ko'));
  assert.ok(definitions.every((item) => typeof item.developerInstructions === 'string' && item.developerInstructions.length > 0));
});

test('agent-definitions: supports awesome-codex-subagents [instructions].text layout', async () => {
  const dirPath = await fs.mkdtemp(testTmpPath('kgentool-agent-def-'));
  const filePath = path.join(dirPath, 'sample-agent.toml');
  await fs.writeFile(
    filePath,
    [
      'name = "sample-agent"',
      'description = "Sample agent"',
      'model = "gpt-5.3-codex-spark"',
      'model_reasoning_effort = "medium"',
      'sandbox_mode = "read-only"',
      '',
      '[instructions]',
      'text = """',
      'Line one.',
      'Line two.',
      '"""'
    ].join('\n'),
    'utf8'
  );

  const definition = await loadAgentDefinition(filePath);
  assert.equal(definition.id, 'sample-agent');
  assert.match(definition.developerInstructions, /Line one\./);
  assert.match(definition.developerInstructions, /Line two\./);
});
