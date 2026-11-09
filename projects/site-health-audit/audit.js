#!/usr/bin/env node
/**
 * Website speed & health audit — portfolio demo by Bailey Langford.
 *
 * Checks a URL with zero dependencies (Node.js built-ins only):
 *   - HTTPS in use, HTTP status, redirects followed (up to 5)
 *   - Load time (time to first byte and total)
 *   - Response size and content type
 *   - Security headers present (HSTS, X-Content-Type-Options, X-Frame-Options, CSP)
 *   - Broken links: fetches the page HTML, extracts same-origin links (up to --max-links),
 *     and HEAD-checks each one, reporting broken ones
 *   - A simple 0–100 score with concrete fixes
 *
 * Usage:
 *   node audit.js https://example.com
 *   node audit.js https://example.com --max-links 10 --json report.json
 *   node audit.js https://example.com --no-links     # skip the link check
 *
 * Node.js 18+ required. No npm install needed.
 */
'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');

function parseArgs(argv) {
  const opts = { url: null, maxLinks: 20, checkLinks: true, jsonOut: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--max-links') opts.maxLinks = Math.max(0, parseInt(argv[++i], 10) || 0);
    else if (a === '--no-links') opts.checkLinks = false;
    else if (a === '--json') opts.jsonOut = argv[++i];
    else if (!a.startsWith('--') && !opts.url) opts.url = a;
    else { console.error(`Unknown argument: ${a}`); process.exit(2); }
  }
  if (!opts.url) {
    console.error('Usage: node audit.js <url> [--max-links N] [--no-links] [--json report.json]');
    process.exit(2);
  }
  if (!/^https?:\/\//i.test(opts.url)) opts.url = 'https://' + opts.url;
  return opts;
}

function fetchOnce(url, { method = 'GET', timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https://') ? https : http;
    const started = Date.now();
    const req = lib.request(url, { method, timeout: timeoutMs, headers: { 'User-Agent': 'Bailey-Langford-Site-Audit/1.0' } }, (res) => {
      let ttfb = Date.now() - started;
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve({
          url, status: res.statusCode, headers: res.headers, body,
          ttfbMs: ttfb, totalMs: Date.now() - started, sizeBytes: body.length,
        });
      });
    });
    req.on('timeout', () => { req.destroy(new Error('Request timed out after ' + timeoutMs + 'ms')); });
    req.on('error', reject);
    req.end();
  });
}

async function fetchFollowingRedirects(url, maxRedirects = 5) {
  let current = url;
  const chain = [];
  for (let i = 0; i <= maxRedirects; i++) {
    const res = await fetchOnce(current);
    chain.push({ url: current, status: res.status });
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      current = new URL(res.headers.location, current).toString();
      continue;
    }
    return { final: res, chain, finalUrl: current };
  }
  throw new Error('Too many redirects (>' + maxRedirects + ')');
}

function extractLinks(html, baseUrl) {
  const found = new Set();
  const re = /<a[^>]+href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const abs = new URL(m[1], baseUrl);
      if (abs.origin !== new URL(baseUrl).origin) continue; // same-origin only
      if (abs.hash) abs.hash = '';
      if (abs.protocol === 'http:' || abs.protocol === 'https:') found.add(abs.toString());
    } catch { /* ignore malformed hrefs */ }
  }
  return [...found];
}

async function checkLink(url) {
  try {
    const res = await fetchOnce(url, { method: 'HEAD', timeoutMs: 8000 });
    if (res.status === 405 || res.status === 501) { // HEAD not allowed — fall back to GET
      const get = await fetchOnce(url, { method: 'GET', timeoutMs: 8000 });
      return { url, status: get.status, ok: get.status < 400 };
    }
    return { url, status: res.status, ok: res.status < 400 };
  } catch (e) {
    return { url, status: null, ok: false, error: e.message };
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const report = { url: opts.url, checkedAt: new Date().toISOString(), checks: {}, issues: [], score: 0 };

  console.log(`Auditing ${opts.url} …`);
  let page;
  try {
    const result = await fetchFollowingRedirects(opts.url);
    page = result.final;
    report.finalUrl = result.finalUrl;
    report.redirects = result.chain.length - 1;
    report.checks.https = { ok: result.finalUrl.startsWith('https://'), detail: result.finalUrl.startsWith('https://') ? 'Site uses HTTPS' : 'Site is served over plain HTTP' };
    report.checks.status = { ok: page.status === 200, detail: `HTTP ${page.status}` };
    report.checks.loadTime = { ok: page.totalMs < 2000, ttfbMs: page.ttfbMs, totalMs: page.totalMs, detail: `Total ${page.totalMs}ms (TTFB ${page.ttfbMs}ms)` };
    report.checks.size = { ok: page.sizeBytes < 1024 * 1024, sizeBytes: page.sizeBytes, detail: `${(page.sizeBytes / 1024).toFixed(1)} KB` };
    report.checks.contentType = { ok: true, detail: page.headers['content-type'] || '(none)' };
  } catch (e) {
    report.checks.reachable = { ok: false, detail: e.message };
    report.issues.push('Site could not be reached: ' + e.message);
    report.score = 0;
    return finish(report, opts);
  }

  const headers = page.headers;
  const securityHeaders = {
    'strict-transport-security': 'HSTS',
    'x-content-type-options': 'X-Content-Type-Options',
    'x-frame-options': 'X-Frame-Options',
    'content-security-policy': 'Content-Security-Policy',
  };
  const present = Object.keys(securityHeaders).filter((h) => headers[h]);
  report.checks.securityHeaders = {
    ok: present.length >= 2,
    present: present.map((h) => securityHeaders[h]),
    missing: Object.keys(securityHeaders).filter((h) => !headers[h]).map((h) => securityHeaders[h]),
    detail: `${present.length}/4 security headers present`,
  };

  if (opts.checkLinks && (page.headers['content-type'] || '').includes('text/html')) {
    const links = extractLinks(page.body.toString('utf8'), report.finalUrl).slice(0, opts.maxLinks);
    report.checks.links = { checked: links.length, broken: [] };
    const results = await Promise.all(links.map(checkLink));
    for (const r of results) {
      if (!r.ok) report.checks.links.broken.push({ url: r.url, status: r.status, error: r.error || null });
    }
    report.checks.links.ok = report.checks.links.broken.length === 0;
    report.checks.links.detail = `${links.length} link(s) checked, ${report.checks.links.broken.length} broken`;
  } else {
    report.checks.links = { ok: null, checked: 0, broken: [], detail: 'Link check skipped' };
  }

  // Score: 100 minus deductions, with an issue list a developer can act on.
  let score = 100;
  const deduct = (points, issue) => { score -= points; report.issues.push(issue); };
  if (!report.checks.https.ok) deduct(25, 'No HTTPS — browsers warn visitors; add an SSL certificate.');
  if (!report.checks.status.ok) deduct(25, `Site did not return HTTP 200 (got ${page.status}).`);
  if (page.totalMs >= 4000) deduct(20, `Very slow: ${page.totalMs}ms total load — optimise images, caching, and server response.`);
  else if (page.totalMs >= 2000) deduct(10, `Slow: ${page.totalMs}ms total load — aim for under 2s.`);
  if (page.sizeBytes >= 1024 * 1024) deduct(10, `Heavy page: ${(page.sizeBytes / 1024).toFixed(0)} KB — compress/optimise images and assets.`);
  if (report.checks.securityHeaders.present.length < 2) deduct(5, `Missing security headers: ${report.checks.securityHeaders.missing.join(', ')}.`);
  if (report.checks.links.broken.length) deduct(10, `${report.checks.links.broken.length} broken link(s) found.`);
  if (report.redirects > 1) deduct(5, `${report.redirects} redirects before the final page — reduce redirect chains.`);
  report.score = Math.max(0, score);

  return finish(report, opts);
}

function finish(report, opts) {
  console.log('\n— Site health report —');
  console.log(`URL:        ${report.finalUrl || report.url}`);
  console.log(`Score:      ${report.score}/100`);
  for (const [name, c] of Object.entries(report.checks)) {
    const mark = c.ok === null ? '–' : c.ok ? '✓' : '✗';
    console.log(`  ${mark} ${name}: ${c.detail || ''}`);
  }
  if (report.checks.links && report.checks.links.broken.length) {
    for (const b of report.checks.links.broken) console.log(`    broken: ${b.url} (HTTP ${b.status ?? b.error})`);
  }
  if (report.issues.length) {
    console.log('\nIssues to fix:');
    report.issues.forEach((i) => console.log('  - ' + i));
  } else {
    console.log('\nNo issues found.');
  }
  if (opts.jsonOut) {
    fs.writeFileSync(opts.jsonOut, JSON.stringify(report, null, 2));
    console.log(`\nFull JSON report written to ${opts.jsonOut}`);
  }
}

main().catch((e) => { console.error('Audit failed:', e.message); process.exit(1); });
