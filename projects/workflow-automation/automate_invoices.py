#!/usr/bin/env python3
"""
Invoice automation for a small business — portfolio demo by Bailey Langford.

Reads a CSV of orders and:
  1. Validates each row (missing fields, bad quantities/prices are reported, not silently dropped).
  2. Groups orders by customer and generates one invoice per customer as a
     plain-text file in the output directory (invoice number, line items, totals).
  3. Writes a sales summary (summary.json) and a CSV of any skipped rows.
  4. Optionally prints the webhook payload that would be sent to the business's
     accounting / email system (use --dry-run-webhook to see it without sending).

Usage:
    python3 automate_invoices.py
    python3 automate_invoices.py --input sample_orders.csv --output output
    python3 automate_invoices.py --input my_orders.csv --output invoices --dry-run-webhook

Input CSV columns: order_id, customer_name, customer_email, item, quantity, unit_price, order_date
No third-party dependencies — Python 3.9+ standard library only.
"""

import argparse
import csv
import json
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

REQUIRED_COLUMNS = ["order_id", "customer_name", "customer_email", "item", "quantity", "unit_price", "order_date"]


def parse_args():
    parser = argparse.ArgumentParser(description="Generate invoices from an orders CSV.")
    parser.add_argument("--input", default="sample_orders.csv", help="Orders CSV file (default: sample_orders.csv)")
    parser.add_argument("--output", default="output", help="Directory for invoices and summary (default: output)")
    parser.add_argument("--dry-run-webhook", action="store_true",
                        help="Print the webhook payload that would be sent per invoice, without sending anything")
    return parser.parse_args()


def read_orders(path):
    """Read and validate the orders CSV. Returns (valid_orders, skipped_rows)."""
    valid, skipped = [], []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        missing = [c for c in REQUIRED_COLUMNS if c not in (reader.fieldnames or [])]
        if missing:
            print(f"ERROR: input is missing columns: {', '.join(missing)}", file=sys.stderr)
            sys.exit(2)
        for row in reader:
            problems = []
            if not row["order_id"].strip():
                problems.append("missing order_id")
            if not row["customer_name"].strip():
                problems.append("missing customer_name")
            if "@" not in row["customer_email"]:
                problems.append("invalid customer_email")
            try:
                quantity = int(row["quantity"])
                if quantity <= 0:
                    problems.append("quantity must be > 0")
            except ValueError:
                problems.append("quantity is not a whole number")
                quantity = 0
            try:
                unit_price = float(row["unit_price"])
                if unit_price < 0:
                    problems.append("unit_price must be >= 0")
            except ValueError:
                problems.append("unit_price is not a number")
                unit_price = 0.0
            if problems:
                skipped.append({"row": row, "problems": problems})
                continue
            valid.append({
                "order_id": row["order_id"].strip(),
                "customer_name": row["customer_name"].strip(),
                "customer_email": row["customer_email"].strip(),
                "item": row["item"].strip(),
                "quantity": quantity,
                "unit_price": unit_price,
                "order_date": row["order_date"].strip(),
            })
    return valid, skipped


def invoice_text(customer, orders, invoice_no):
    """Render one invoice as plain text."""
    lines = [
        f"INVOICE {invoice_no}",
        f"Date: {date.today().isoformat()}",
        f"Bill to: {customer['name']} <{customer['email']}>",
        "",
        f"{'Order':<10} {'Item':<28} {'Qty':>4} {'Unit':>9} {'Line total':>12}",
        "-" * 68,
    ]
    total = 0.0
    for o in orders:
        line_total = o["quantity"] * o["unit_price"]
        total += line_total
        lines.append(f"{o['order_id']:<10} {o['item']:<28} {o['quantity']:>4} ${o['unit_price']:>8.2f} ${line_total:>11.2f}")
    lines += ["-" * 68, f"{'TOTAL':>55} ${total:>11.2f}", "", "Thank you for your business! Payment due within 14 days."]
    return "\n".join(lines) + "\n", total


def main():
    args = parse_args()
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"ERROR: input file not found: {input_path}", file=sys.stderr)
        sys.exit(2)

    orders, skipped = read_orders(input_path)
    by_customer = defaultdict(list)
    for o in orders:
        by_customer[(o["customer_name"], o["customer_email"])].append(o)

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    grand_total = 0.0
    invoices = []
    for i, ((name, email), customer_orders) in enumerate(sorted(by_customer.items()), start=1):
        invoice_no = f"INV-{date.today().strftime('%Y%m')}-{i:03d}"
        text, total = invoice_text({"name": name, "email": email}, customer_orders, invoice_no)
        (output_dir / f"{invoice_no}.txt").write_text(text, encoding="utf-8")
        grand_total += total
        invoices.append({"invoice": invoice_no, "customer": name, "email": email,
                         "orders": len(customer_orders), "total": round(total, 2)})
        if args.dry_run_webhook:
            payload = {"event": "invoice.created", "invoice": invoice_no, "customer_email": email,
                       "total": round(total, 2), "order_count": len(customer_orders)}
            print(f"[webhook dry-run] POST https://example.com/webhook/invoices -> {json.dumps(payload)}")

    summary = {
        "input_file": str(input_path),
        "orders_read": len(orders) + len(skipped),
        "orders_invoiced": len(orders),
        "orders_skipped": len(skipped),
        "invoices_generated": len(invoices),
        "grand_total": round(grand_total, 2),
        "invoices": invoices,
    }
    (output_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    if skipped:
        with open(output_dir / "skipped_rows.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(REQUIRED_COLUMNS + ["problems"])
            for s in skipped:
                writer.writerow([s["row"].get(c, "") for c in REQUIRED_COLUMNS] + ["; ".join(s["problems"])])

    print(f"Done: {len(invoices)} invoice(s), ${grand_total:.2f} total, "
          f"{len(orders)} order(s) invoiced, {len(skipped)} skipped.")
    print(f"Output in: {output_dir}/  (invoices, summary.json"
          f"{', skipped_rows.csv' if skipped else ''})")
    if skipped:
        for s in skipped:
            print(f"  skipped order {s['row'].get('order_id') or '(no id)'}: {'; '.join(s['problems'])}")


if __name__ == "__main__":
    main()
