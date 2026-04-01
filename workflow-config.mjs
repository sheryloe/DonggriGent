import { parseTomlFile } from './simple-toml.mjs';

export async function loadWorkflows(workflowFilePath) {
  const parsed = await parseTomlFile(workflowFilePath);
  const workflows = parsed.workflow || {};
  return Object.entries(workflows).map(([name, definition]) => ({
    name,
    defaultVendor: String(definition?.default_vendor || 'chatgpt').trim() || 'chatgpt',
    tabKeyPrefix: String(definition?.tab_key_prefix || name).trim() || name,
    steps: (Array.isArray(definition?.steps) ? definition.steps : []).map((step) => ({
      agent: String(step?.agent || '').trim(),
      vendor: String(step?.vendor || definition?.default_vendor || 'chatgpt').trim() || 'chatgpt',
      mode: String(step?.mode || '').trim(),
      input: String(step?.input || '').trim(),
      output: String(step?.output || '').trim()
    }))
  }));
}

export async function loadWorkflowByName(workflowFilePath, name) {
  const workflows = await loadWorkflows(workflowFilePath);
  return workflows.find((workflow) => workflow.name === name) || null;
}
