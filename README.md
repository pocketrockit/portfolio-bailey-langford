# Bailey Langford — Developer Portfolio

Freelance software developer for small businesses, based in Houston, Texas.
8 years of experience (2018–present) building fast, responsive websites, custom web applications, workflow automation, and website maintenance.

- **Email:** pocketterockette@proton.me
- **Phone:** +1 346-906-5731
- **Fiverr:** https://www.fiverr.com/pocketrockete
- **Location:** Houston, Texas, USA

## The portfolio site

`index.html` (with `styles.css` and `script.js`) is a static site — no build step, no framework. It is ready for GitHub Pages: enable Pages on the repository with the root as the source, and the site is live.

Open it locally with:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Services

| Service | From |
| --- | --- |
| Bug fixes & quick website changes | $20–$99, 1–3 days |
| Larger custom work (websites, dashboards, apps) | $100–$500 |
| Monthly website maintenance retainers | $200–$500 / month |
| Workflow automation | Quoted per workflow |

See the site's Services section, or the Fiverr profile above, for the current offers.

## Skills

JavaScript (ES6+), HTML5, CSS3, Python, TypeScript · React, Node.js, Express, Tailwind CSS, Next.js, Vue · PostgreSQL, MongoDB, RESTful APIs, system architecture · Git, Linux/Unix, Vercel, Netlify, Postman, web performance tuning.

## Projects

All four are real, working demos in `projects/` — no placeholders, no lorem ipsum. Each has its own README with run instructions.

| Project | What it is | Run it |
| --- | --- | --- |
| [Houston Bistro](projects/houston-bistro-website/) | Responsive small-business (restaurant) website with menu filters and a booking form saved in the browser | Open `index.html`, or `python3 -m http.server 8000` |
| [Booking Dashboard](projects/booking-dashboard/) | Vanilla JS appointments/customers dashboard with search, filters, status changes, and live stats | Open `index.html`, or `python3 -m http.server 8001` |
| [Workflow Automation](projects/workflow-automation/) | Python script turning an orders CSV into per-customer invoices + a sales summary, with a webhook dry-run | `python3 automate_invoices.py` |
| [Site Health Audit](projects/site-health-audit/) | Zero-dependency Node.js CLI checking HTTPS, status, load time, security headers, and broken links | `node audit.js https://example.com` |

## Repo layout

```
.
├── index.html / styles.css / script.js   # portfolio site
├── README.md
└── projects/
    ├── houston-bistro-website/
    ├── booking-dashboard/
    ├── workflow-automation/
    └── site-health-audit/
```

## Notes

- No clients, employers, or testimonials are invented anywhere in this portfolio — all facts come from Bailey's resume. Project businesses and customer names in the demos are fictional sample data, clearly labelled as such.
- The contact form on the site opens the visitor's email app addressed to Bailey; nothing is sent or stored by the site.
