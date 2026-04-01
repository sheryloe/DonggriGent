import fs from 'node:fs/promises';

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function stripInlineComment(raw) {
  const text = String(raw || '');
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (ch === '#' && !inString) return text.slice(0, i).trimEnd();
  }
  return text.trimEnd();
}

function splitCommaSeparated(raw) {
  const out = [];
  let buffer = '';
  let inString = false;
  let escaped = false;
  let depth = 0;
  for (const ch of String(raw || '')) {
    if (escaped) {
      buffer += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\' && inString) {
      buffer += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      buffer += ch;
      inString = !inString;
      continue;
    }
    if (!inString && (ch === '[' || ch === '{')) {
      depth += 1;
      buffer += ch;
      continue;
    }
    if (!inString && (ch === ']' || ch === '}')) {
      depth = Math.max(0, depth - 1);
      buffer += ch;
      continue;
    }
    if (ch === ',' && !inString && depth === 0) {
      out.push(buffer.trim());
      buffer = '';
      continue;
    }
    buffer += ch;
  }
  if (buffer.trim()) out.push(buffer.trim());
  return out;
}

function parsePrimitive(raw) {
  const text = stripInlineComment(String(raw || '').trim());
  if (!text) return '';
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (/^[+-]?\d+(\.\d+)?$/.test(text)) return Number(text);
  if (text.startsWith('"') && text.endsWith('"')) {
    try {
      return JSON.parse(text);
    } catch {
      return text.slice(1, -1);
    }
  }
  if (text.startsWith("'") && text.endsWith("'")) return text.slice(1, -1);
  if (text.startsWith('[') && text.endsWith(']')) {
    const inner = text.slice(1, -1).trim();
    if (!inner) return [];
    return splitCommaSeparated(inner).map((item) => parsePrimitive(item));
  }
  return text;
}

function parseMultilineString(rawValue, lines, lineIndex) {
  const first = String(rawValue || '');
  const suffix = first.slice(3);
  if (suffix.endsWith('"""')) {
    return { value: suffix.slice(0, -3).trim(), lineIndex };
  }
  const parts = [];
  if (suffix) parts.push(suffix);
  let idx = lineIndex + 1;
  while (idx < lines.length) {
    const line = lines[idx];
    const closeAt = line.indexOf('"""');
    if (closeAt >= 0) {
      parts.push(line.slice(0, closeAt));
      return { value: parts.join('\n').trim(), lineIndex: idx };
    }
    parts.push(line);
    idx += 1;
  }
  return { value: parts.join('\n').trim(), lineIndex: lines.length - 1 };
}

function ensureObjectPath(root, pathParts) {
  let cursor = root;
  for (const part of pathParts) {
    if (!isObject(cursor[part])) cursor[part] = {};
    cursor = cursor[part];
  }
  return cursor;
}

function ensureArrayTable(root, pathParts) {
  const parent = ensureObjectPath(root, pathParts.slice(0, -1));
  const last = pathParts[pathParts.length - 1];
  if (!Array.isArray(parent[last])) parent[last] = [];
  const item = {};
  parent[last].push(item);
  return item;
}

function setValue(target, keyPath, value) {
  const parts = String(keyPath || '')
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return;
  const parent = ensureObjectPath(target, parts.slice(0, -1));
  parent[parts[parts.length - 1]] = value;
}

export function parseToml(text) {
  const lines = String(text || '').split(/\r?\n/);
  const root = {};
  let current = root;

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = String(lines[i] || '');
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const arrayTableHeader = line.match(/^\[\[([A-Za-z0-9_.-]+)\]\]$/);
    if (arrayTableHeader) {
      current = ensureArrayTable(root, arrayTableHeader[1].split('.'));
      continue;
    }

    const tableHeader = line.match(/^\[([A-Za-z0-9_.-]+)\]$/);
    if (tableHeader) {
      current = ensureObjectPath(root, tableHeader[1].split('.'));
      continue;
    }

    const match = rawLine.match(/^\s*([A-Za-z0-9_.-]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (String(rawValue || '').startsWith('"""')) {
      const parsed = parseMultilineString(rawValue, lines, i);
      setValue(current, key, parsed.value);
      i = parsed.lineIndex;
      continue;
    }
    setValue(current, key, parsePrimitive(rawValue));
  }

  return root;
}

export async function parseTomlFile(filePath) {
  return parseToml(await fs.readFile(filePath, 'utf8'));
}
