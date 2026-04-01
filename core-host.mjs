import path from 'node:path';
import { loadAgentDefinitions } from './agent-definitions.mjs';
import { listArtifacts } from './artifact-store.mjs';
import { deleteBundle, getBundle, listBundles, saveBundle } from './bundle-store.mjs';
import { defaultSettings, readSettings, writeSettings } from './state.mjs';
import { loadWorkflowByName, loadWorkflows } from './workflow-config.mjs';

function stableTabKey({ workflow, agent, vendor }) {
  return `${workflow}:${agent}:${vendor}`;
}

export function createCoreHost({
  stateDir,
  agentsDir,
  workflowsPath,
  watchFolders,
  openWatchFolder,
  scanWatchFolder,
  executeWorkflowStep,
  runQuery,
  stopQuery,
  getRuntimeStatus
} = {}) {
  const sessions = new Map();

  return {
    async request(name, payload = {}) {
      if (name === 'session.ensure') {
        const key = String(payload.key || '').trim();
        const vendorId = String(payload.vendorId || 'chatgpt').trim() || 'chatgpt';
        const session = {
          key,
          vendorId,
          tabId: String(payload.tabId || '').trim() || null,
          updatedAt: new Date().toISOString()
        };
        if (key) sessions.set(key, session);
        return { session };
      }

      if (name === 'status.get') {
        const runtime = (await getRuntimeStatus?.(payload)) || null;
        return { sessions: Array.from(sessions.values()), runtime };
      }

      if (name === 'query.run') {
        const key = String(payload.key || '').trim();
        const vendorId = String(payload.vendorId || 'chatgpt').trim() || 'chatgpt';
        const session = {
          key,
          vendorId,
          tabId: String(payload.tabId || '').trim() || null,
          updatedAt: new Date().toISOString()
        };
        if (key) sessions.set(key, session);
        const result = (await runQuery?.({ ...payload, session })) || { ok: false, text: '' };
        return { session, result };
      }

      if (name === 'query.stop') {
        const key = String(payload.key || '').trim();
        const session = (key && sessions.get(key)) || null;
        const result = (await stopQuery?.({ ...payload, session })) || { ok: true, requested: false };
        return { session, result };
      }

      if (name === 'config.read') {
        return { settings: await readSettings(stateDir) };
      }

      if (name === 'config.write') {
        const next = { ...defaultSettings(), ...(await readSettings(stateDir)), ...(payload.settings || {}) };
        return { settings: await writeSettings(next, stateDir) };
      }

      if (name === 'bundles.list') return { bundles: await listBundles(stateDir) };
      if (name === 'bundles.get') return { bundle: await getBundle(stateDir, payload.name) };
      if (name === 'bundles.save') return { bundle: await saveBundle(stateDir, payload) };
      if (name === 'bundles.delete') return { deleted: await deleteBundle(stateDir, payload.name) };

      if (name === 'artifacts.list') {
        return { artifacts: await listArtifacts({ stateDir, tabId: payload.tabId || null, limit: payload.limit || 50 }) };
      }

      if (name === 'watch_folders.list') {
        return { folders: (await watchFolders?.listFolders?.()) || [] };
      }

      if (name === 'watch_folders.add') {
        return { folder: await watchFolders?.addFolder?.({ name: payload.name, folderPath: payload.folderPath }) };
      }

      if (name === 'watch_folders.delete') {
        return { deleted: await watchFolders?.removeFolder?.({ name: payload.name }) };
      }

      if (name === 'watch_folders.open') {
        const folder = await watchFolders?.getFolderByName?.(payload.name);
        if (!folder) throw new Error('watch_folder_not_found');
        await openWatchFolder?.({ name: folder.name, folderPath: folder.path });
        return { folder };
      }

      if (name === 'watch_folders.scan') {
        return { ...(await scanWatchFolder?.()) };
      }

      if (name === 'workflow.list') {
        return { workflows: await loadWorkflows(workflowsPath) };
      }

      if (name === 'workflow.run') {
        const workflow = await loadWorkflowByName(workflowsPath, payload.workflowName);
        if (!workflow) throw new Error('workflow_not_found');
        const agents = await loadAgentDefinitions(agentsDir);
        const agentMap = new Map(agents.map((agent) => [agent.id, agent]));
        const outputs = {};
        const steps = [];
        for (const step of workflow.steps) {
          const agent = agentMap.get(step.agent) || null;
          const vendor = step.vendor || workflow.defaultVendor || 'chatgpt';
          const tabKey = stableTabKey({ workflow: workflow.tabKeyPrefix || workflow.name, agent: step.agent, vendor });
          const inputText =
            step.input && outputs[step.input]
              ? outputs[step.input]
              : String(payload.prompt || '').trim();
          const prompt = [
            agent?.developerInstructions ? `[${agent.name}]\n${agent.developerInstructions}` : '',
            inputText
          ]
            .filter(Boolean)
            .join('\n\n');
          let result = null;
          if (typeof executeWorkflowStep === 'function') {
            result = await executeWorkflowStep({
              workflow,
              step,
              agent,
              vendorId: vendor,
              tabKey,
              prompt
            });
          }
          if (step.output) outputs[step.output] = result?.text || '';
          steps.push({
            agent: step.agent,
            vendor,
            mode: step.mode,
            tabKey,
            ok: result?.ok !== false,
            text: result?.text || ''
          });
        }
        return { workflow: workflow.name, steps, outputs };
      }

      throw new Error(`unsupported_core_command:${name}`);
    }
  };
}
