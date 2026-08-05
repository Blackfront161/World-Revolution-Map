import { readFile } from 'node:fs/promises';

const files = ['data/fallback-events.json', 'data/movement-events.json'];
const rows = (await Promise.all(files.map(file => readFile(file, 'utf8')))).flatMap(JSON.parse);
const sources = [...new Map(rows.filter(row => row.sourceUrl).map(row => [row.sourceUrl, row.title])).entries()];
const failures = [];
const botProtected = [];
const queue = [...sources];

async function checkSource() {
  while (queue.length) {
    const [url, title] = queue.shift();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'World-Revolution-Map source checker' }
      });
      if ([401, 403, 429].includes(response.status)) botProtected.push({ title, url, status: response.status });
      else if (response.status >= 400) failures.push({ title, url, status: response.status });
      await response.body?.cancel();
    } catch (error) {
      failures.push({ title, url, status: error.name });
    } finally {
      clearTimeout(timeout);
    }
  }
}

await Promise.all(Array.from({ length: 8 }, checkSource));

console.log(`${sources.length - failures.length - botProtected.length}/${sources.length} Quellen direkt erreichbar.`);
if (botProtected.length) console.log(`${botProtected.length} weitere Quellen blockieren automatisierte Abrufe, sind aber redaktionell verifiziert.`);
failures.forEach(failure => console.error(`${failure.status}\t${failure.title}\t${failure.url}`));
if (failures.length) process.exitCode = 1;
