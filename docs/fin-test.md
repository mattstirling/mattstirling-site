# Temporary Fin AI integration test

The static Astro route is `/fin-test`, hosted by the existing Vercel project. It uses Intercom's [official JavaScript loader and anonymous visitor installation](https://developers.intercom.com/installing-intercom/web/installation), without adding a dependency or a client router. Only this page imports the Messenger module. The personal homepage remains unchanged.

## Configure the customer's workspace

Set both public build-time variables in `.env.local` for local testing and in **Vercel → mattstirling-site → Settings → Environment Variables** for deployment:

| Variable | Required value |
| --- | --- |
| `PUBLIC_INTERCOM_APP_ID` | The customer's real workspace ID (`app_id`), obtained from their Messenger installation settings or workspace URL. |
| `PUBLIC_INTERCOM_REGION` | `us`, `eu`, or `au`, matching that workspace's data hosting region. |

The region maps to Intercom's official `https://api-iam.intercom.io`, `https://api-iam.eu.intercom.io`, or `https://api-iam.au.intercom.io` endpoint respectively. These are the only two settings passed to `boot`: `app_id` and `api_base`.

`.env.example` intentionally has no workspace ID or default region. Add its two keys to your existing `.env.local`; do not overwrite other local variables. Leave both empty to show the page without loading Intercom. Incomplete or malformed configuration fails the build instead of silently choosing a workspace or region.

The customer-supplied workspace and US region were configured in `.env.local` and Vercel **Production** and **Preview** on 19 October 2026. The application still reads these settings from the environment; no workspace ID is hardcoded in the page or loader.

`PUBLIC_` values are visible in the generated HTML/browser. Do not put API tokens, Salesforce credentials, customer JWTs, user IDs, names, or email identities in these variables. The website neither connects directly to Salesforce nor configures Intercom/Fin. Fin behavior and the Salesforce Sandbox connection remain in the customer's existing workspace configuration.

Local Salesforce CLI folders (`.sf/` and `.sfdx/`) are excluded from both Git and Vercel uploads. They are not part of this website integration.

The workspace owner must already have Messenger web traffic enabled, allow anonymous visitors, and allow the test domain if using trusted domains. Launcher visibility, bottom-right placement, Fin availability, and visitor targeting also depend on that workspace's settings. This website does not change those settings or override the standard launcher. Configure the Vercel fallback host separately in the customer's allowed domains if it is used for testing.

## Run and deploy

1. Add the real ID and region to `.env.local`.
2. Run `npm run build`, then `npm run preview` and open the printed address at `/fin-test`.
3. Set the same two variables in Vercel for **Production** (and **Preview** if needed).
4. Push the changes to `main`; the existing GitHub integration deploys automatically. If only environment settings changed, use **Redeploy** in Vercel. Static output requires a new build to pick up environment changes.
5. Visit `https://www.mattstirling.com/fin-test`. The alternative host is `https://mattstirling-site.vercel.app/fin-test`.

## Indexing and access

The test page has `noindex, nofollow, noarchive` metadata and matching Vercel `X-Robots-Tag` headers. It is absent from the homepage/navigation. This repository does not generate a sitemap, so the test route has no sitemap entry. If a sitemap integration is introduced later, explicitly filter `/fin-test` out. Do not block this route in `robots.txt`, because crawlers need to fetch it to see `noindex`.

Vercel's existing authentication protects preview/deployment URLs, but **not the production domains**. That protection is retained. There is no existing server-side authentication or production path protection in this static site. Consequently `/fin-test` is publicly accessible to anyone with its URL; `noindex` is not access control. No client-side password has been added. Use an authenticated Vercel preview if testing requires restricted access, with the corresponding host permitted by the customer's Messenger configuration.

## Lifecycle and checks

The page uses normal full-page navigation. On leaving, `Intercom('shutdown')` ends the Messenger session; back/forward cache restoration mounts it again. Astro navigation lifecycle handlers also shut it down before a page swap and boot only when `/fin-test` is active. A queued boot is cleared when leaving during a slow download. The pending loader reference survives head replacement and module re-evaluation, preventing a second download when returning before the first finishes. Repeated events do not duplicate the SDK or boot calls. On a client-side transition, an already fetched SDK can remain in memory, shut down; a fresh homepage loads no Messenger code or network requests.

Run the offline lifecycle checks with `node scripts/check-fin-messenger.mjs` (Node 24). They use a fake DOM and local SDK stub; no test workspace ID is sent to Intercom, and these checks do not prove a real Messenger works.

After supplying a valid workspace configuration, verify in a fresh browser:

- `/fin-test` responds successfully with both headings and no horizontal overflow on desktop and mobile.
- One standard Messenger launcher appears at bottom-right; open and close its chat panel.
- There is only one `widget.intercom.io/widget/…` script/request and no unexpected console or network errors.
- Returning home removes Messenger; re-entering and browser back/forward work without duplicate instances.
- Loading `/` directly makes no Intercom requests and shows all fifteen original favourites.
- The deployed route has `noindex` in both metadata and the `X-Robots-Tag` response header.

Opening and closing Messenger does not validate Fin responses or Salesforce records. Those require separate actual tests with the customer's workspace and Sandbox. No such validation is implied by this integration.

### Recorded validation — 19 October 2026

- Production build passed; generated homepage HTML is byte-for-byte identical to the version before this change.
- Offline lifecycle checks passed, including delayed script loading after leaving the test page, removal of a pending script during a head swap, module re-evaluation, failure/retry, and duplicate event handling.
- Chrome checked the configured production build through local Astro preview at 1440, 390, and 320px widths using the customer's real workspace. The real standard launcher appeared at bottom-right, chat opened by clicking the launcher and closed using its Close control, and the page and chat panel fit each viewport.
- Exactly one widget script, one SDK frame, and one launcher appeared per document, including after repeated lifecycle events. There were no console errors or HTTP errors. Home-link navigation removed Messenger; browser Back restored exactly one instance.
- The homepage had fifteen favourites, no test-page navigation link, no scripts, and no Intercom network requests. The earlier unconfigured test page also made no Intercom requests.
- The browser ran headlessly with the installed Chrome version's normal user-agent string because Intercom intentionally ignores `HeadlessChrome`. The test used Intercom's real SDK and API, without a Messenger stub.
- [Desktop launcher](screenshots/fin-test-desktop.png), [desktop chat](screenshots/fin-test-desktop-chat.png), [mobile launcher](screenshots/fin-test-mobile.png), [mobile chat](screenshots/fin-test-mobile-chat.png), and [browser check results](screenshots/fin-test-checks.json) record the configured state.
- Before configuration, the deployed route returned HTTP 200 and `X-Robots-Tag: noindex, nofollow, noarchive` on the Vercel fallback host and custom domain. This machine's DNS still held an old custom-domain address; checks against the current Vercel address kept TLS verification enabled.
- **Not tested:** Fin AI responses or Salesforce records. No chat messages were sent, and no Intercom workspace settings or Salesforce configuration were changed by these checks.

## Remove after testing

Delete `src/pages/fin-test.astro`, `src/scripts/fin-messenger.ts`, `scripts/check-fin-messenger.mjs`, and this guide. Remove both `/fin-test` header entries from `vercel.json`, the Intercom variables from local/Vercel environments, the `.env.example` keys, and the README reference. The optional layout metadata props can remain; they have no effect on the homepage. Commit and push to deploy. Confirm `/fin-test` returns 404 and the homepage still makes no Intercom requests. This does not delete any conversations stored in the customer's Intercom workspace.
