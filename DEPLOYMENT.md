# Deploy through GitHub and Vercel

The site is deployed at **https://mattstirling-site.vercel.app/**. Source: [mattstirling/mattstirling-site](https://github.com/mattstirling/mattstirling-site). Vercel project: [mattstirling-site](https://vercel.com/mattstirling-3688/mattstirling-site).

Both custom domains are attached to the project. Vercel is configured to redirect `mattstirling.com` to `www.mattstirling.com` with HTTP 308. The GitHub repository is connected to Vercel, with `main` as the production branch; a push has been verified to create a successful production deployment automatically.

The domain's nameservers were changed to Vercel on 19 October 2026. HostGator and the .com registry confirm the new values, and Vercel reports valid DNS for both domains. HTTPS certificates are issued. The Vercel edge serves the homepage with HTTP 200 and redirects the apex to `www` with HTTP 308. Some public DNS caches still retain the old address while propagation completes. Domain registration remains managed through HostGator.

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
| Environment variables | None for the homepage; optional `PUBLIC_INTERCOM_APP_ID` and `PUBLIC_INTERCOM_REGION` for the temporary [Fin test page](docs/fin-test.md) |

If you instead put the entire parent folder into a different repository, set the root directory to `website_v1`.

Select **Deploy** and check the generated Vercel URL. This static site needs no Vercel adapter. Once the Git integration is connected, pushes to `main` publish updates; branches and pull requests receive preview deployments. A direct deployment is also possible with `npx vercel deploy --prod`. See [Astro on Vercel](https://vercel.com/docs/frameworks/frontend/astro) and [Vercel’s GitHub integration](https://vercel.com/docs/git/vercel-for-github).

## 3. Add both domains

In the Vercel project's **Settings → Domains**:

1. Add `www.mattstirling.com` and assign it to Production.
2. Add `mattstirling.com`. Edit this domain and set **Redirect to → www.mattstirling.com**, using a permanent redirect.
3. Ensure the direction is apex → www. The canonical URL in the site already uses `https://www.mattstirling.com/`.

The redirect is configured in Vercel; a DNS record alone does not perform an HTTP redirect. See [Vercel’s domain redirect instructions](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting).

## 4. Connect the domain through Vercel DNS

The domain is managed in the **HostGator account**, as confirmed in its domain dashboard. DNS is now hosted by **Vercel**. The account owner confirmed that this domain is used only for the website, with no email or other services to migrate.

In [HostGator's portal](https://www.hostgator.com/my-account/login), open **Domains → mattstirling.com → Nameservers → Change Nameservers**. The values below are already saved; they are the exact intended nameservers returned by `vercel domains inspect mattstirling.com`:

| Setting | Value |
| --- | --- |
| Nameserver 1 | `ns1.vercel-dns.com` |
| Nameserver 2 | `ns2.vercel-dns.com` |

Vercel manages the apex ALIAS automatically. The following explicit record is also configured in Vercel DNS, using the exact target recommended for this project:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `www` | `3ae52bca4abfd79d.vercel-dns-017.com.` |

Future DNS edits belong in **Vercel's Domains dashboard**, not HostGator's DNS editor. If email is added later, put the email provider's MX, SPF, DKIM, DMARC, and verification records in Vercel DNS and preserve them during subsequent website changes.

HostGator advises allowing up to 24–48 hours for nameserver changes to propagate. Check the status in [Vercel's domain settings](https://vercel.com/mattstirling-3688/mattstirling-site/settings/domains). See [Vercel's nameserver guide](https://vercel.com/docs/domains/working-with-nameservers).

## 5. Verify the live result

Vercel's valid DNS status, HTTPS certificate, homepage, and redirect have been verified. Because some recursive DNS caches still held the previous address, the HTTP checks used `curl --resolve` with an address returned by Vercel's authoritative DNS; TLS certificate verification remained enabled. Once local DNS caches refresh, these ordinary checks should pass without overriding DNS:

- `https://www.mattstirling.com/` loads the site over HTTPS.
- `https://mattstirling.com/` redirects to `https://www.mattstirling.com/`.
- Both HTTP variants end at the HTTPS www address.
- All three navigation links jump to their sections; all fifteen items are present.
- If email is added in future, confirm it still sends and receives after DNS changes.

For a header check, use `curl -I https://mattstirling.com/` (or `curl.exe` in Windows PowerShell) and inspect the permanent redirect and `Location` header.
