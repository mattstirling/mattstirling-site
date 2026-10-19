// Offline lifecycle tests. No real workspace IDs or requests to Intercom.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

const source = stripTypeScriptTypes(readFileSync('src/scripts/fin-messenger.ts', 'utf8'))
  .replace('export {};', '');

function fixture({ path = '/fin-test', configured = true } = {}) {
  const window = new EventTarget();
  const document = new EventTarget();
  const location = { pathname: path };
  const scripts = new Map();
  const downloads = [];
  const status = { textContent: '' };
  const page = { dataset: configured ? {
    appId: 'offlinefixture', apiBase: 'https://api-iam.eu.intercom.io',
  } : {} };
  document.querySelector = () => location.pathname === '/fin-test' ? page : null;
  document.getElementById = id => id === 'fin-messenger-status' ? status : scripts.get(id);
  document.createElement = () => {
    const script = new EventTarget();
    script.remove = () => scripts.delete(script.id);
    return script;
  };
  document.head = { append: script => { scripts.set(script.id, script); downloads.push(script); } };
  const context = vm.createContext({ window, document, location });
  const run = () => vm.runInContext(`(() => { ${source} })()`, context);
  const queued = () => Array.from(window.Intercom?.q ?? [], args => Array.from(args));
  run();
  return { window, document, location, scripts, downloads, status, queued, run };
}

for (const options of [{ path: '/' }, { configured: false }]) {
  const f = fixture(options);
  assert.equal(f.scripts.size, 0);
  assert.equal(f.window.Intercom, undefined);
}

const f = fixture();
assert.equal(f.scripts.size, 1);
assert.equal(f.queued().length, 1);
assert.equal(f.queued()[0][0], 'boot');
assert.deepEqual(Object.keys(f.queued()[0][1]).sort(), ['api_base', 'app_id']);
assert.equal(f.queued()[0][1].api_base, 'https://api-iam.eu.intercom.io');
f.window.dispatchEvent(new Event('pageshow'));
f.document.dispatchEvent(new Event('astro:page-load'));
assert.equal(f.queued().length, 1, 'Duplicate lifecycle events must not duplicate boot.');

// Leave while the official loader is still downloading; its boot queue is cleared.
f.document.dispatchEvent(new Event('astro:before-swap'));
f.location.pathname = '/';
f.document.dispatchEvent(new Event('astro:page-load'));
assert.deepEqual(f.queued().map(args => args[0]), ['shutdown']);

// Simulate the SDK finishing after navigation. It must receive no boot on home.
const sdkCalls = f.queued();
f.window.Intercom = (...args) => sdkCalls.push(args);
f.window.dispatchEvent(new Event('pageshow'));
assert.equal(sdkCalls.filter(args => args[0] === 'boot').length, 0);
f.location.pathname = '/fin-test';
f.document.dispatchEvent(new Event('astro:page-load'));
assert.equal(sdkCalls.filter(args => args[0] === 'boot').length, 1);
assert.equal(f.scripts.size, 1, 'The loaded SDK must be reused.');

f.window.dispatchEvent(new Event('pagehide'));
assert.equal(sdkCalls.at(-1)[0], 'shutdown');
f.window.dispatchEvent(new Event('pageshow'));
assert.equal(sdkCalls.at(-1)[0], 'boot', 'Restore from back/forward cache.');
f.run();
assert.equal(f.scripts.size, 1, 'Re-evaluating the module must not add another loader.');
const callsAfterReload = sdkCalls.length;
f.document.dispatchEvent(new Event('astro:page-load'));
assert.equal(sdkCalls.length, callsAfterReload, 'Old event listeners must be removed.');

const failed = fixture();
failed.scripts.values().next().value.dispatchEvent(new Event('error'));
assert.equal(failed.scripts.size, 0);
assert.match(failed.status.textContent, /could not load/);
assert.deepEqual(failed.queued().map(args => args[0]), ['shutdown']);

// Astro swaps head elements. A detached loader can still be downloading when
// someone returns to /fin-test; never start a second copy of that request.
const detached = fixture();
const pendingLoader = detached.downloads[0];
detached.document.dispatchEvent(new Event('astro:before-swap'));
detached.scripts.clear();
detached.location.pathname = '/';
detached.document.dispatchEvent(new Event('astro:page-load'));
assert.equal(detached.queued().some(args => args[0] === 'boot'), false);
detached.location.pathname = '/fin-test';
detached.document.dispatchEvent(new Event('astro:page-load'));
detached.run();
assert.equal(detached.downloads.length, 1, 'A pending detached loader must survive navigation and module reload.');
assert.equal(detached.queued().filter(args => args[0] === 'boot').length, 1);
pendingLoader.dispatchEvent(new Event('error'));
assert.equal(detached.queued().some(args => args[0] === 'boot'), false, 'The current controller must handle a pending loader failure.');
assert.match(detached.status.textContent, /could not load/);
detached.window.dispatchEvent(new Event('pageshow'));
assert.equal(detached.downloads.length, 2, 'A failed download must be retryable.');

console.log('Passed: page isolation, absent config, anonymous settings, duplicate events, slow load after navigation, SDK reuse, back/forward cache, module cleanup, detached pending loader, and load failure/retry.');
