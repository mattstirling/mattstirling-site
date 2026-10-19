// Run against a production preview: node scripts/capture-screenshots.mjs
// Optional: SITE_URL, CHROME_PATH, CDP_PORT environment variables.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const siteUrl = process.env.SITE_URL || 'http://localhost:4322/';
const port = Number(process.env.CDP_PORT || 9222);
const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chrome = candidates.find(existsSync);
if (!chrome) throw new Error('Set CHROME_PATH to your Chrome or Edge executable.');
assert.ok((await fetch(siteUrl)).ok, 'Start the production preview first.');
let portInUse = false;
try {
  await fetch('http://127.0.0.1:' + port + '/json', { signal: AbortSignal.timeout(1000) });
  portInUse = true;
} catch {}
assert.equal(portInUse, false, 'Choose an unused CDP_PORT; an existing browser will not be used.');
await mkdir('.qa', { recursive: true });
await mkdir('docs/screenshots', { recursive: true });
const profile = await mkdtemp(resolve('.qa', 'capture-'));
const browser = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=' + port, '--user-data-dir=' + profile, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let socket;
try {
  let targets;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { targets = await (await fetch('http://127.0.0.1:' + port + '/json')).json(); break; }
    catch { await new Promise(r => setTimeout(r, 250)); }
  }
  if (!targets) throw new Error('Chrome could not start. Run this script in a local terminal with browser access.');
  const target = targets.find(t => t.type === 'page' && t.url === 'about:blank');
  assert.ok(target, 'A fresh browser page is required; choose an unused CDP_PORT.');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, fail) => { socket.onopen = done; socket.onerror = fail; });
  const pending = new Map();
  let sequence = 0;
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) return;
    const task = pending.get(message.id);
    if (!task) return;
    pending.delete(message.id);
    message.error ? task.reject(new Error(JSON.stringify(message.error))) : task.resolve(message.result);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(method + ' timed out')); }, 15000);
    pending.set(id, {
      resolve: result => { clearTimeout(timer); resolve(result); },
      reject: error => { clearTimeout(timer); reject(error); },
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await send('Page.enable');
  const results = [];
  for (const [width, height, name] of [[1440, 900, 'desktop'], [390, 844, 'mobile'], [320, 740, null], [768, 1024, null]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 701 });
    await send('Page.navigate', { url: siteUrl });
    for (let attempt = 0; attempt < 50; attempt++) {
      if (await evaluate('document.readyState === "complete" && !!document.querySelector(".collections")')) break;
      await new Promise(r => setTimeout(r, 100));
    }
    await evaluate('document.fonts.ready');
    const metrics = await evaluate(`(() => {
      const sections = [...document.querySelectorAll('.collection')];
      const nav = [...document.querySelectorAll('.site-nav a')];
      return {
        width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
        items: [...document.querySelectorAll('.item-title')].map(e => e.textContent),
        h1s: document.querySelectorAll('h1').length,
        top: sections.map(e => Math.round(e.getBoundingClientRect().top)),
        navVisible: nav.length === 3 && nav.every(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.right <= innerWidth; }),
        scripts: document.scripts.length,
      };
    })()`);
    assert.equal(metrics.overflow, false, 'Horizontal overflow at ' + width);
    assert.equal(metrics.items.length, 15);
    assert.equal(metrics.h1s, 1);
    assert.equal(metrics.scripts, 0, 'Use production preview, not the dev server.');
    assert.ok(metrics.navVisible);
    if (width > 700) assert.equal(new Set(metrics.top).size, 1, 'Collections should share a row.');
    else assert.ok(metrics.top[0] < metrics.top[1] && metrics.top[1] < metrics.top[2]);
    for (const id of ['films', 'books', 'cities']) {
      await evaluate('document.querySelector(' + JSON.stringify('.site-nav a[href="#' + id + '"]') + ').click()');
      assert.equal(await evaluate('location.hash'), '#' + id);
      assert.ok(await evaluate(`(() => { const r = document.getElementById(${JSON.stringify(id)}).getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; })()`));
    }
    await evaluate('document.querySelector(".site-footer a").click(); document.activeElement.blur(); history.replaceState(null, "", location.pathname); scrollTo(0, 0);');
    if (name) {
      const { cssContentSize } = await send('Page.getLayoutMetrics');
      const screenshot = await send('Page.captureScreenshot', {
        format: 'png', captureBeyondViewport: true,
        clip: { x: 0, y: 0, width, height: Math.max(height, cssContentSize.height), scale: 1 },
      });
      await writeFile('docs/screenshots/' + name + '.png', Buffer.from(screenshot.data, 'base64'));
    }
    results.push({ width, height, overflow: false, items: metrics.items.length, navigation: 'passed', layout: width > 700 ? 'three columns' : 'stacked' });
  }
  // A fresh navigation resets sequential keyboard focus.
  await send('Page.navigate', { url: siteUrl });
  await new Promise(r => setTimeout(r, 250));
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  assert.ok(await evaluate('document.activeElement.classList.contains("skip-link")'));
  assert.ok(await evaluate('getComputedStyle(document.activeElement).outlineStyle !== "none"'));
  await writeFile('docs/screenshots/checks.json', JSON.stringify({ results, keyboardFocus: 'passed' }, null, 2) + '\n');
  console.log('Saved desktop/mobile screenshots; layout, navigation, content, overflow and keyboard checks passed.');
  await send('Browser.close');
} finally {
  socket?.close();
  if (browser.exitCode === null) browser.kill();
}
