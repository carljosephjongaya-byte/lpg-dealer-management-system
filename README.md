# LPG Dealer Management System

A static, browser-based capstone demo for managing LPG cylinder inventory, customer tank deposits,
customer loans, rider dispatch, remittances, and reconciliation. It runs on GitHub Pages or any
local static server with no backend, build step, API key, or database server.

## System Overview

- **Dual-state inventory:** Tracks 2 brands across 2.7kg, 11kg, 22kg, and 50kg variants,
  with separate full-cylinder and empty-shell counts, transaction ledgers, and low-stock alerts.
- **Customer tank deposit ledger:** Tracks refundable balances, deposits/refunds, cylinder loans,
  serial/tag numbers, returned tanks, and refill purchase history.
- **Rider dispatch:** Supports order assignment, a one-active-delivery rider rule, delivery status
  transitions, cash/empty turn-in, and COD remittance reconciliation.
- **Reporting:** Provides dashboard KPIs and charts, date-range totals, rider variance highlights,
  CSV export, print styling, and an audit trail.

## Run locally

ES modules require an HTTP origin. From the project directory:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/`. Do not open `index.html` using `file://`.

## Deploy to GitHub Pages

1. Create a GitHub repository and push this project to its default branch.
2. Open **Settings → Pages**.
3. Set **Source** to **Deploy from a branch**.
4. Select the default branch and `/ (root)`, then save.
5. Open the provided GitHub Pages URL.

`localStorage` is origin-specific, so demo records will be separate on localhost and GitHub Pages.

## Demo login credentials

| Role | Username | Password |
|---|---|---|
| Admin / Store Owner | `admin` | `admin123` |
| Cashier / Inventory Staff | `cashier` | `cash123` |
| Rider | `rider1` | `rider123` |
| Rider | `rider2` | `rider123` |

## Feature walkthrough

1. Sign in as Admin or Cashier.
2. Open **Inventory** to add variants or record restocks, sales, rider returns, and tank loans.
3. Open **Customers** to receive/refund deposits and record cylinder loans or returns.
4. Open **Orders & Dispatch** to create, assign, cancel, dispatch, and deliver orders.
5. Sign in as a rider to view only assigned deliveries and complete cash/empty turn-in.
6. Open **Riders** to manage rider availability and remittance records.
7. Open **Reports** to filter totals, reconcile remittance variance, view audit history,
   export CSV, or print.

## Storage

The app initializes realistic demo data once using the `lpg_seed_version` key. Application data,
session state, and audit records are stored in `localStorage` under the collection keys defined
by `js/storage.js`. Clearing site storage resets the demo.
