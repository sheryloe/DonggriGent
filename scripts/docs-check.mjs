#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsRoot = path.resolve(__dirname, '..', 'docs');

const SKIP_PREFIXES = [
  'http:',
  'https:',
  '//',
  'mailto:',
  'tel:',
  'data:',
  'javascript:'
];

function stripHashAndQuery(value) {
  const s = String(value || '');
  return s.split('#')[0].split('?')[0];
}

function isSkippable(href) {
  const s = String(href || '').trim();
  if (!s) return true;
  if (s === '#') return true;
  return SKIP_PREFIXES.some((p) => s.toLowerCase().startsWith(p));
}

function resolveTarget(htmlPath, href) {
  const raw = stripHashAndQuery(href).trim();
  if (!raw) return null;
  if (raw.startsWith('/')) {
    return path.resolve(docsRoot, raw.replace(/^\/+/, ''));
  }
  const baseDir = path.dirname(htmlPath);
  return path.resolve(baseDir, raw);
}

async function walk(dir, out) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(abs, out);
    else if (entry.isFile() && abs.toLowerCase().endsWith('.html')) out.push(abs);
  }
}

function extractLinks(html) {
  const links = [];
  const re = /\b(?:href|src)\s*=\s*"([^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) links.push(m[1]);
  return links;
}

async function main() {
  const htmlFiles = [];
  await walk(docsRoot, htmlFiles);

  const failures = [];

  for (const htmlPath of htmlFiles) {
    const html = await fs.readFile(htmlPath, 'utf8');
    const links = extractLinks(html);
    for (const href of links) {
      if (isSkippable(href)) continue;
      const target = resolveTarget(htmlPath, href);
      if (!target) continue;
      if (!target.startsWith(docsRoot)) continue;
      const checkPath = target.endsWith(path.sep) ? path.join(target, 'index.html') : target;
      try {
        await fs.stat(checkPath);
      } catch {
        failures.push({ htmlPath, href, target: checkPath });
      }
    }
  }

  if (failures.length) {
    // eslint-disable-next-line no-console
    console.error(`Broken links: ${failures.length}`);
    for (const f of failures.slice(0, 50)) {
      // eslint-disable-next-line no-console
      console.error(`- ${path.relative(docsRoot, f.htmlPath)} -> ${f.href} (missing: ${path.relative(docsRoot, f.target)})`);
    }
    process.exitCode = 1;
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`OK: ${htmlFiles.length} HTML files, no broken relative href/src found.`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});

