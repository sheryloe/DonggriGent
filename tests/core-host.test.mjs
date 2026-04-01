import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createCoreHost } from '../core-host.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('core-host: query.run and query.stop delegate through shell callbacks', async () => {
  const seen = { run: null, stop: null, status: 0 };
  const host = createCoreHost({
    stateDir: '/tmp/nonexistent-state',
    runQuery: async (payload) => {
      seen.run = payload;
      return { ok: true, text: 'core-runner' };
    },
    stopQuery: async (payload) => {
      seen.stop = payload;
      return { ok: true, requested: true };
    },
    getRuntimeStatus: async () => {
      seen.status += 1;
      return { activeQueries: [], lastOutcomes: [] };
    }
  });

  const run = await host.request('query.run', { key: 'repo', vendorId: 'claude', tabId: 'tab-1', prompt: 'Refactor this.' });
  assert.equal(run.session.key, 'repo');
  assert.equal(run.session.vendorId, 'claude');
  assert.equal(run.result.text, 'core-runner');
  assert.equal(seen.run?.session?.tabId, 'tab-1');
  assert.equal(seen.run?.prompt, 'Refactor this.');

  const status = await host.request('status.get', {});
  assert.equal(status.runtime?.activeQueries?.length, 0);
  assert.equal(seen.status, 1);

  const stopped = await host.request('query.stop', { key: 'repo' });
  assert.equal(stopped.session?.key, 'repo');
  assert.equal(stopped.result?.requested, true);
  assert.equal(seen.stop?.session?.vendorId, 'claude');
});

test('core-host: workflow.run reads project Codex agents in awesome-codex-subagents format', async () => {
  const steps = [];
  const host = createCoreHost({
    stateDir: '/tmp/nonexistent-state',
    agentsDir: path.join(__dirname, '..', '.codex', 'agents'),
    workflowsPath: path.join(__dirname, '..', '.kgentool', 'workflows.toml'),
    executeWorkflowStep: async ({ agent, step, tabKey, prompt }) => {
      steps.push({ agentId: agent?.id, mode: step.mode, tabKey, prompt });
      return { ok: true, text: `${agent?.id}:${step.mode}` };
    }
  });

  const result = await host.request('workflow.run', { workflowName: 'cpp_refactor', prompt: 'KGentool C++ migration' });
  assert.equal(result.workflow, 'cpp_refactor');
  assert.equal(result.steps.length, 3);
  assert.equal(steps[0]?.agentId, 'kgentool-supervisor');
  assert.match(steps[0]?.prompt || '', /KGentool workflow supervision/);
  assert.equal(steps[1]?.tabKey, 'cpp_refactor:cpp-pro-kg:chatgpt');
  assert.equal(result.outputs.review, 'reviewer-kg:review');
});
