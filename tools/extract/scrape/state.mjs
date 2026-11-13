// A scrape run lives in private/raw/<YYYY-MM-DD>/. state.json tracks every planned page; page files
// are written to pages/.tmp-<slug>/ and renamed to pages/<slug>/ in one step, so an interrupted run
// never leaves a half-written page that looks finished.
import { mkdir, readFile, writeFile, rename, rm, readdir, stat } from 'node:fs/promises';
import { join, resolve, relative, isAbsolute, sep } from 'node:path';

function insidePrivate(privateDir, target) {
  const rel = relative(resolve(privateDir), resolve(target));
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel) && !rel.split(sep).includes('..');
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

export async function writeJsonAtomic(file, data) {
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2) + '\n');
  await rename(tmp, file);
}

export async function openRun({ privateDir, date, resume }) {
  const dir = join(privateDir, 'raw', String(date));
  if (!insidePrivate(privateDir, dir) || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
    throw new Error('scraper writes only to private/ (raw/<YYYY-MM-DD>)');
  }
  const stateFile = join(dir, 'state.json');
  const pagesDir = join(dir, 'pages');
  let state;
  if (resume) {
    if (!(await exists(stateFile))) throw new Error(`no run to resume at raw/${date}`);
    state = JSON.parse(await readFile(stateFile, 'utf8'));
    for (const name of await readdir(pagesDir)) {
      if (name.startsWith('.tmp-')) await rm(join(pagesDir, name), { recursive: true, force: true });
    }
  } else {
    if (await exists(stateFile)) throw new Error(`run exists; use --resume (raw/${date})`);
    await mkdir(join(dir, 'meta'), { recursive: true });
    state = { runDate: String(date), robotsSha256: null, sitemapSha256: null, pages: {} };
    await writeJsonAtomic(stateFile, state);
  }
  await mkdir(pagesDir, { recursive: true });

  return {
    dir,
    state,
    save: () => writeJsonAtomic(stateFile, state),
    async writePageAtomic(slug, files) {
      const tmp = join(pagesDir, `.tmp-${slug}`);
      const final = join(pagesDir, slug);
      await rm(tmp, { recursive: true, force: true });
      await mkdir(tmp, { recursive: true });
      try {
        for (const [name, content] of Object.entries(files)) {
          if (typeof content !== 'string') throw new TypeError(`page file ${name} must be a string`);
          await writeFile(join(tmp, name), content);
        }
        await rm(final, { recursive: true, force: true });
        await rename(tmp, final);
      } catch (e) {
        await rm(tmp, { recursive: true, force: true });
        throw e;
      }
    },
  };
}
