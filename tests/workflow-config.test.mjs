import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadWorkflowByName, loadWorkflows } from '../workflow-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('workflow-config: loads bundled KGentool workflows', async () => {
  const filePath = path.join(__dirname, '..', '.kgentool', 'workflows.toml');
  const workflows = await loadWorkflows(filePath);
  const names = workflows.map((item) => item.name);
  assert.ok(names.includes('cpp_refactor'));
  assert.ok(names.includes('vendor_hardening'));
  assert.ok(names.includes('mcp_extension'));
  assert.ok(names.includes('cpp_refactor_ko'));
  assert.ok(names.includes('vendor_hardening_ko'));
  assert.ok(names.includes('mcp_extension_ko'));
  assert.ok(workflows.every((item) => item.steps.length === 3));
});

test('workflow-config: loads a single workflow by name', async () => {
  const filePath = path.join(__dirname, '..', '.kgentool', 'workflows.toml');
  const workflow = await loadWorkflowByName(filePath, 'cpp_refactor');
  assert.equal(workflow?.name, 'cpp_refactor');
  assert.equal(workflow?.steps?.[0]?.agent, 'kgentool-supervisor');
  assert.equal(workflow?.steps?.[2]?.agent, 'reviewer-kg');
});

