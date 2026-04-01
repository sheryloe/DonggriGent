import path from 'node:path';
import { parseTomlFile } from './simple-toml.mjs';

export async function loadAgentDefinition(filePath) {
  const parsed = await parseTomlFile(filePath);
  return {
    id: path.basename(filePath, '.toml'),
    name: parsed.name || path.basename(filePath, '.toml'),
    description: parsed.description || '',
    model: parsed.model || '',
    modelReasoningEffort: parsed.model_reasoning_effort || '',
    sandboxMode: parsed.sandbox_mode || '',
    developerInstructions: parsed.developer_instructions || parsed.instructions?.text || parsed.instructions || parsed.text || ''
  };
}

export async function loadAgentDefinitions(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.toml'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
  const out = [];
  for (const file of files) {
    out.push(await loadAgentDefinition(path.join(dirPath, file)));
  }
  return out;
}
