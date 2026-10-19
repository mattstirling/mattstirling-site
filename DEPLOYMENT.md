# Deploy through GitHub and Vercel

The site is ready to build for Vercel. The included `vercel.json` sets the Astro framework, install command, build command, and output directory. Publishing still requires a GitHub repository, a connected Vercel project, and access to the domain's DNS settings.

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

In Vercel, select **Add New → Project**, connect GitHub, and import the repository.

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

Select **Deploy** and check the generated Vercel URL. This static site needs no Vercel adapter. Later pushes to `main` publish updates; branches and pull requests receive preview deployments. See [Astro on Vercel](https://vercel.com/docs/frameworks/frontend/astro) and [Vercel’s GitHub integration](https://vercel.com/docs/git/vercel-for-github).

## 3. Add both domains

In the Vercel project's **Settings → Domains**:

1. Add `www.mattstirling.com` and assign it to Production.
2. Add `mattstirling.com`. Edit this domain and set **Redirect to → www.mattstirling.com**, using a permanent redirect.
3. Ensure the direction is apex → www. The canonical URL in the site already uses `https://www.mattstirling.com/`.

The redirect is configured in Vercel; a DNS record alone does not perform an HTTP redirect. See [Vercel’s domain redirect instructions](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting).

## 4. Copy the exact DNS values Vercel shows

Keep your current DNS provider and nameservers. Export or record the existing DNS zone first.

**The project-specific values cannot be supplied until Vercel has created the project and displayed its domain configuration.** No guessed IP address or generic CNAME target is included here. In each domain's Vercel configuration, copy the displayed record type, name, and value exactly into your current DNS provider:

| Hostname | Record normally requested | Where to get the exact value |
| --- | --- | --- |
| `www.mattstirling.com` | CNAME for `www` | Vercel’s configuration for `www.mattstirling.com` |
| `mattstirling.com` | A for the apex (`@` or blank, per your DNS provider) | Vercel’s configuration for `mattstirling.com` |
| Ownership verification, if requested | TXT at the displayed name | Copy the exact name and token Vercel displays |

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
