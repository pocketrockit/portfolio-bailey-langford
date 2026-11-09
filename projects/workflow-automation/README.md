# Workflow Automation — Invoice Generator

A Python script that turns a CSV of orders into per-customer invoices, built as a portfolio demo by Bailey Langford. It shows the kind of automation Bailey builds for small businesses: take a repetitive manual task (invoicing, data entry, syncing tools) and make it a one-command job.

## What it does

- Reads `sample_orders.csv` (or any CSV with the same columns)
- Validates every row — bad quantities, prices, or emails are reported in `skipped_rows.csv`, never silently dropped
- Groups orders by customer and writes one invoice per customer (`INV-YYYYMM-001.txt`, …) into the output folder
- Writes `summary.json` with order counts, per-invoice totals, and the grand total
- With `--dry-run-webhook`, prints the webhook payload that would be sent to an accounting / email system per invoice — in a real deployment that POST would go to the client's CRM, QuickBooks, or email tool

## Run it

Python 3.9+, no third-party dependencies:

```bash
cd projects/workflow-automation
python3 automate_invoices.py
# output in output/ — invoices, summary.json, skipped_rows.csv

# With your own file, and to see the webhook payloads:
python3 automate_invoices.py --input my_orders.csv --output invoices --dry-run-webhook
```

Expected output with the sample file: 4 invoices, $1,205.00 total, 6 orders invoiced, 1 skipped (ORD-1006 — invalid email, quantity 0, non-numeric price).

## Input format

CSV columns: `order_id, customer_name, customer_email, item, quantity, unit_price, order_date`

## Stack

Python 3, standard library only (`csv`, `json`, `argparse`, `pathlib`).

## How a real version would work

Same script, scheduled (cron / a small server) and wired to the client's real data source — a spreadsheet, a shop's API, or a booking system — with invoices emailed automatically and payments reconciled. Sample data here is fictional.
