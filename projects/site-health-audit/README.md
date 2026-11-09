# Website Speed & Health Audit

A zero-dependency Node.js CLI that audits a website the way Bailey Langford audits a client's site before quoting maintenance work — built as a portfolio demo.

## What it checks

- HTTPS in use (not plain HTTP)
- HTTP status of the final page, following up to 5 redirects
- Load time — total and time-to-first-byte
- Page size and content type
- Security headers present (HSTS, X-Content-Type-Options, X-Frame-Options, Content-Security-Policy)
- Broken links: extracts same-origin links from the page (up to `--max-links`, default 20) and HEAD-checks each one
- A 0–100 score, with a concrete "Issues to fix" list

## Run it

Node.js 18+, no `npm install` needed:

```bash
cd projects/site-health-audit
node audit.js https://example.com
node audit.js https://example.com --max-links 10 --json report.json
node audit.js https://example.com --no-links   # skip the link check
```

Example output for `https://example.com` (a fast, minimal page): score 95/100, with the only deduction being missing security headers — which is expected for that demo page.

## Stack

Node.js 18+, built-in `http` / `https` / `fs` only — no third-party packages.

## How a real version would work

Same checks, run on a schedule (e.g. weekly) against a client's site, with the JSON report emailed to the client and a history kept so speed regressions are caught early. That's the monthly maintenance retainer in practice.
