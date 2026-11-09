# Houston Bistro — Small-Business Website

A responsive website for a fictional Houston neighborhood restaurant, built as a portfolio demo by Bailey Langford. It shows the kind of site Bailey builds for local restaurants, salons, and shops: fast, mobile-friendly, and focused on turning visitors into bookings.

## Features

- Responsive layout (mobile, tablet, desktop) with a sticky header
- Menu with working category filters (All / Starters / Mains / Desserts)
- Opening hours and location section
- Booking form with date validation (no past dates) — bookings are saved in the browser's localStorage and listed on the page, with cancel
- Semantic HTML and accessible form labels

## Run it

No build step, no dependencies. Open `index.html` in a browser, or serve it locally:

```bash
cd projects/houston-bistro-website
python3 -m http.server 8000
# then open http://localhost:8000
```

## Stack

HTML5, CSS3, vanilla JavaScript. No frameworks, no tracking, no backend — a real site would POST bookings to a server instead of localStorage.

## What Bailey would do for a real business

Same structure, with the business's real menu, photos, hours, and a booking flow wired to their email / reservation system, plus HTTPS, speed optimisation, and Google Business Profile setup.
