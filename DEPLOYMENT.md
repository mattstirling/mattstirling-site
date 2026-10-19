# Deploy through GitHub and Vercel

The site is deployed at **https://mattstirling-site.vercel.app/**. Source: [mattstirling/mattstirling-site](https://github.com/mattstirling/mattstirling-site). Vercel project: [mattstirling-site](https://vercel.com/mattstirling-3688/mattstirling-site).

Both custom domains are attached to the project. Vercel is configured to redirect `mattstirling.com` to `www.mattstirling.com` with HTTP 308. The GitHub repository is connected to Vercel, with `main` as the production branch. Custom-domain DNS setup is in progress; the current nameservers still return the previous hosting address.

Both addresses will work: `www.mattstirling.com` serves the site and `mattstirling.com` redirects to it. No domain transfer or nameserver change is required.

## 1. Push this project to GitHub

The Git repository is **inside `website_v1`**, and its remote is [mattstirling/mattstirling-site](https://github.com/mattstirling/mattstirling-site). Run commands from that folder. To publish future edits:

```sh
git status
git add .
git commit -m "Update personal website"
git push origin main
```

Review the staged files before committing. The ignore file excludes `node_modules/`, `dist/`, local browser profiles, and local environment files. Keep `package-lock.json` committed. If an `origin` remote already exists, inspect `git remote -v` and use the intended repository rather than adding another remote.

GitHub documents this workflow in [Adding locally hosted code](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github).

## 2. Import into Vercel

The Vercel project and GitHub integration are already connected. Push changes to `main` to deploy automatically. The connection is shown in the project's **Settings → Git**. To recreate it, connect GitHub in [Vercel account authentication](https://vercel.com/account/authentication), install the [Vercel GitHub app](https://github.com/apps/vercel) with access to this repository, then run `npx vercel git connect https://github.com/mattstirling/mattstirling-site.git` from an authenticated local checkout.

For a fresh Vercel project, select **Add New → Project**, connect GitHub, and import the repository with these settings:

| Setting | Value |
| --- | --- |
| Framework preset | Astro |
| Root directory | `./` when you push the existing `website_v1` repository |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node.js version | 24.x |
| Production branch | `main` |
| Environment variables | None |

If you instead put the entire parent folder into a different repository, set the root directory to `website_v1`.

Select **Deploy** and check the generated Vercel URL. This static site needs no Vercel adapter. Once the Git integration is connected, pushes to `main` publish updates; branches and pull requests receive preview deployments. A direct deployment is also possible with `npx vercel deploy --prod`. See [Astro on Vercel](https://vercel.com/docs/frameworks/frontend/astro) and [Vercel’s GitHub integration](https://vercel.com/docs/git/vercel-for-github).

## 3. Add both domains

In the Vercel project's **Settings → Domains**:

1. Add `www.mattstirling.com` and assign it to Production.
2. Add `mattstirling.com`. Edit this domain and set **Redirect to → www.mattstirling.com**, using a permanent redirect.
3. Ensure the direction is apex → www. The canonical URL in the site already uses `https://www.mattstirling.com/`.

The redirect is configured in Vercel; a DNS record alone does not perform an HTTP redirect. See [Vercel’s domain redirect instructions](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting).

## 4. Copy the exact DNS values Vercel shows

The domain is managed in the **HostGator account**, as confirmed in its domain dashboard. The current nameservers are **`ns8313.hostgator.com` and `ns8314.hostgator.com`**. HostGator's domain DNS editor initially contained no records, and its hosting cPanel has no zone for this domain. A `www` CNAME has been added in the domain editor, but the active nameservers still return the old hosting address. DNS setup must be completed and verified before treating the custom domain as live.

These are the exact recommended records returned by `vercel domains verify` for this project on 19 October 2026:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `216.198.79.1` |
| A | `@` | `64.29.17.1` |
| CNAME | `www` | `3ae52bca4abfd79d.vercel-dns-017.com.` |

Vercel recommends both apex A records. In cPanel, a full hostname may be required: use `mattstirling.com.` for the apex and `www.mattstirling.com.` for `www`. Keep the provider's default TTL. No ownership TXT record is currently requested. The old website A value is `108.167.190.81`; replace the website records after checking mail dependencies below.

In [HostGator's portal](https://www.hostgator.com/my-account/login), open **Domains → mattstirling.com → DNS**, or **cPanel → Zone Editor → Manage**. Export the zone, then edit the website records. See [HostGator's DNS guide](https://www.hostgator.com/help/article/manage-dns-records-with-hostgatorenom). If deploying much later, recheck the exact values in [Vercel's domain settings](https://vercel.com/mattstirling-3688/mattstirling-site/settings/domains) before applying them.

Preserve existing **MX, SPF, DKIM, DMARC, mail/autodiscover records, and other verification TXT records**. Add a requested verification TXT record separately; do not replace unrelated TXT records.

Change only website records that conflict at `www` or the apex. If an existing apex address also serves mail (for example, MX points to the apex or SPF uses `a`), arrange an independent mail hostname with the mail provider before changing that address. Avoid an apex CNAME that would conflict with MX/TXT records. See [Vercel’s current domain configuration guide](https://vercel.com/docs/domains/working-with-domains/add-a-domain).

## 5. Verify the live result

Wait for Vercel to show valid DNS configuration and an active HTTPS certificate for both domains. Then confirm:

- `https://www.mattstirling.com/` loads the site over HTTPS.
- `https://mattstirling.com/` redirects to `https://www.mattstirling.com/`.
- Both HTTP variants end at the HTTPS www address.
- All three navigation links jump to their sections; all fifteen items are present.
- Email still sends and receives correctly.

For a header check, use `curl -I https://mattstirling.com/` (or `curl.exe` in Windows PowerShell) and inspect the permanent redirect and `Location` header.
