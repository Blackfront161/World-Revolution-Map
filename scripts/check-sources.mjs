import { readFile } from 'node:fs/promises';

const catalog = JSON.parse(await readFile('data/event-catalog.json', 'utf8'));
const files = catalog.map(file => `data/${file}`);
const rows = (await Promise.all(files.map(file => readFile(file, 'utf8')))).flatMap(JSON.parse).filter(row => !row.archived);
const overrides = JSON.parse(await readFile('data/event-editorial-overrides.json', 'utf8'));
const overrideRows = Object.entries(overrides.events || {}).map(([id, row]) => ({ ...row, title: id }));
const biographyCatalog = JSON.parse(await readFile('data/biography-catalog.json', 'utf8'));
const biographyRows = (await Promise.all(biographyCatalog.files.map(entry => readFile(`data/${entry.file}`, 'utf8')))).flatMap(JSON.parse);
const biographySources = biographyRows.flatMap(row => (row.sources ?? row.sourceRefs ?? []).map(source => ({
  sourceUrl: source.url,
  title: `${row.personName ?? row.name ?? row.id}: ${source.title ?? source.publisher ?? 'Biografiequelle'}`
})));
const sources = [...new Map([...rows, ...overrideRows, ...biographySources].filter(row => row.sourceUrl).map(row => [row.sourceUrl, row.title])).entries()];
const failures = [];
const botProtected = [];
const unresolved = [];
const queue = [...sources];

async function checkSource() {
  while (queue.length) {
    const [url, title] = queue.shift();
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: { 'User-Agent': 'World-Revolution-Map source checker' }
        });
        const retryableStatus = response.status === 408 || response.status === 425 || response.status >= 500;
        const retryable = retryableStatus && attempt < 3;
        if (!retryable) {
          // 405 bedeutet hier nicht „Quelle fehlt“, sondern dass der Anbieter
          // automatisierte GET-Abrufe anders behandelt als normale Navigation.
          if ([401, 403, 405, 429].includes(response.status)) botProtected.push({ title, url, status: response.status });
          else if (retryableStatus) unresolved.push({ title, url, status: response.status });
          else if (response.status >= 400) failures.push({ title, url, status: response.status });
        }
        await response.body?.cancel();
        if (!retryable) break;
      } catch (error) {
        if (attempt === 3) unresolved.push({ title, url, status: error.name });
        else continue;
      } finally {
        clearTimeout(timeout);
      }
    }
  }
}

await Promise.all(Array.from({ length: 8 }, checkSource));

console.log(`${sources.length - failures.length - botProtected.length - unresolved.length}/${sources.length} Quellen direkt erreichbar.`);
if (botProtected.length) console.log(`${botProtected.length} weitere Quellen blockieren automatisierte Abrufe mit 401, 403, 405 oder 429.`);
if (unresolved.length) console.log(`${unresolved.length} Quellen blieben nach drei Versuchen wegen Netzwerk- oder Serverfehlern unentscheidbar.`);
failures.forEach(failure => console.error(`${failure.status}\t${failure.title}\t${failure.url}`));
unresolved.forEach(entry => console.warn(`${entry.status}\tUNENTSCHIEDEN\t${entry.title}\t${entry.url}`));
if (failures.length) process.exitCode = 1;
