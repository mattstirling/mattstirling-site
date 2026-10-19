// Official Intercom JavaScript loader + boot/shutdown API, scoped to /fin-test.
// https://developers.intercom.com/installing-intercom/web/installation
export {};

type Settings = { app_id: string; api_base: string };
type Intercom = {
  (command: 'boot' | 'shutdown', settings?: Settings): void;
  q?: IArguments[];
  c?: (args: IArguments) => void;
};

declare global {
  interface Window {
    Intercom?: Intercom;
    __finTestMessenger?: { dispose: () => void };
  }
}

const scriptId = 'fin-test-intercom-loader';
const apiBases = new Set([
  'https://api-iam.intercom.io',
  'https://api-iam.eu.intercom.io',
  'https://api-iam.au.intercom.io',
]);

// Also safe if a client router or development reload evaluates this module again.
window.__finTestMessenger?.dispose();
let active = false;
let suspended = false;

function shutdown() {
  if (!active) return;
  active = false;
  // A slow loader must never replay a queued boot after leaving this page.
  if (window.Intercom?.q) window.Intercom.q.length = 0;
  window.Intercom?.('shutdown');
}

function mount() {
  if (suspended) return;
  const page = document.querySelector<HTMLElement>('[data-fin-test]');
  if (!/^\/fin-test\/?$/.test(location.pathname) || !page) {
    shutdown();
    return;
  }

  const appId = page.dataset.appId;
  const apiBase = page.dataset.apiBase;
  if (active || !appId || !/^[a-z0-9]+$/i.test(appId) || !apiBase || !apiBases.has(apiBase)) return;

  if (typeof window.Intercom !== 'function') {
    const intercom: Intercom = function () { intercom.c!(arguments); };
    intercom.q = [];
    intercom.c = (args) => { intercom.q!.push(args); };
    window.Intercom = intercom;
  }

  active = true;
  // Anonymous visitors only: no identity, JWT, Salesforce data, or custom attributes.
  window.Intercom('boot', { app_id: appId, api_base: apiBase });

  // The real SDK is reused after shutdown. Its queue only exists before it loads.
  if (!window.Intercom.q || document.getElementById(scriptId)) return;
  const script = document.createElement('script');
  script.id = scriptId;
  script.async = true;
  script.src = `https://widget.intercom.io/widget/${encodeURIComponent(appId)}`;
  script.addEventListener('error', () => {
    shutdown();
    script.remove();
    const status = document.getElementById('fin-messenger-status');
    if (status) status.textContent = 'Messenger could not load. Check your connection or content blocker, then reload this page.';
  }, { once: true });
  document.head.append(script);
}

function suspend() {
  suspended = true;
  shutdown();
}

function resume() {
  suspended = false;
  mount();
}

// Current site uses full document navigation. These also cover the back/forward
// cache and Astro ClientRouter if it is introduced later, without loading it now.
window.addEventListener('pagehide', suspend);
window.addEventListener('pageshow', resume);
document.addEventListener('astro:before-swap', suspend);
document.addEventListener('astro:page-load', resume);
window.__finTestMessenger = {
  dispose() {
    suspend();
    window.removeEventListener('pagehide', suspend);
    window.removeEventListener('pageshow', resume);
    document.removeEventListener('astro:before-swap', suspend);
    document.removeEventListener('astro:page-load', resume);
  },
};

mount();
