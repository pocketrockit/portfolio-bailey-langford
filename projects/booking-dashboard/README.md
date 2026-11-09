# Booking & Customer Dashboard

A vanilla JavaScript dashboard for a small service business (salon / clinic / studio), built as a portfolio demo by Bailey Langford. It shows the kind of booking portal Bailey builds for local businesses — the same UI pattern, wired to a real backend in production.

## Features

- Live stats: appointments today, upcoming, unique customers, upcoming revenue
- Appointments table with search (customer / service) and status filter
- Change status: complete or cancel an appointment
- Add an appointment via the form (priced services, pending by default)
- Customer list, derived from appointments
- All data persists in the browser's localStorage; a **Reset demo data** button restores the sample set

## Run it

No build step, no dependencies. Open `index.html` in a browser, or serve it locally:

```bash
cd projects/booking-dashboard
python3 -m http.server 8001
# then open http://localhost:8001
```

## Stack

HTML5, CSS3, vanilla JavaScript (ES6+). Responsive table that collapses to cards on mobile.

## How a real version would work

Same front end, with a REST API behind it — Express + PostgreSQL or MongoDB — for multi-user access, email/SMS reminders, payments, and a calendar sync. Sample data here is fictional; no real customers are included.
