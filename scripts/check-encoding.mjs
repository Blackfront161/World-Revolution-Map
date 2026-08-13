import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const extensions = new Set(['.json', '.js', '.mjs', '.html', '.css', '.md', '.sql', '.yml', '.yaml']);
const ignored = new Set(['.git', 'node_modules']);
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (extensions.has(extname(entry.name))) files.push(path);
  }
}
await walk('.');

const decoder = new TextDecoder('utf-8', { fatal: true });
const mojibake = new RegExp(['\\uFFFD', '\\u00c3.', '\\u00c2.', '\\u00e2\\u20ac', '\\u00f0\\u0178', '\\u00d0.', '\\u00d1.', '\\u00ce.', '\\u00cf.'].join('|'), 'u');
for (const file of files) {
  const bytes = await readFile(file);
  let text;
  try { text = decoder.decode(bytes); } catch { throw new Error(`${file}: kein gültiges UTF-8.`); }
  if ([...text].some(char => char.charCodeAt(0) < 32 && !['\n', '\r', '\t'].includes(char))) throw new Error(`${file}: unerlaubtes Kontrollzeichen.`);
  if (mojibake.test(text)) throw new Error(`${file}: mögliche Mojibake-Sequenz.`);
  if (extname(file) === '.json') JSON.parse(text);
}
console.log(`${files.length} Textdateien sind gültiges UTF-8 ohne Kontrollzeichen oder bekannte Mojibake-Muster.`);
