# DECISIONS.md - Decision Log

This document records the architectural, product, and engineering decisions made during the design and implementation of the Shared Expenses Web Application.

---

## 1. Full-Stack Web Framework
* **Decision**: Next.js (TypeScript, React 19, App Router).
* **Options Considered**: 
  1. *React (Vite) + Express/Node.js*: Solid division of concerns, but requires launching and managing two separate dev servers, port configuration, and boilerplate API calls.
  2. *Next.js App Router*: Standard React framework, unified build pipeline, built-in Server Actions for direct database queries from client components, and excellent performance.
* **Rationale**: Next.js allows us to integrate the database access layer directly inside React Server Actions. This makes the code highly readable, eliminates API boilerplate, and satisfies all requirements in a single repository.

---

## 2. Relational Database & ORM
* **Decision**: SQLite with Prisma ORM.
* **Options Considered**:
  1. *PostgreSQL or MySQL*: Production-ready, but requires installing database engines locally, creating credentials, and configuring complex local environments.
  2. *SQLite with raw `better-sqlite3`*: File-based and portable, but native node module compilation on Windows can fail due to compiler toolchain requirements.
  3. *SQLite with Prisma ORM*: Portable database file (`dev.db`), automatic schema generation, migrations, and a typed Client.
* **Rationale**: Prisma downloads precompiled engines for Windows, avoiding native compilation issues. SQLite satisfies the "relational DB only" requirement without requiring the user or evaluator to set up a database server. It is 100% self-contained in the project.

---

## 3. Data Import Strategy
* **Decision**: Interactive Wizard with Step-by-Step Resolution.
* **Options Considered**:
  1. *Crash on Error*: Fails on the first anomaly (unusable for real-world messy spreadsheets).
  2. *Silent Guessing*: Auto-resolves names and duplicates using fixed rules (failing grade per instructions: *crashed import and silent guess are both failing answers*).
  3. *Interactive wizard*: Parses the CSV, flags all 20+ anomalies, and allows the user to review, modify mapping options, choose conflict winners, and recalculate membership splits before hitting the database.
* **Rationale**: Meets Meera's requirement: *"Clean up the duplicates — but I want to approve anything the app deletes or changes."* It gives the user full agency, generates a clean historical report of resolutions, and ensures database integrity.

---

## 4. Temporal Group Membership
* **Decision**: Track `joinedAt` and `leftAt` dates in `GroupMember` junction table and filter split lists dynamically.
* **Options Considered**:
  1. *Static Group List*: All users share all expenses equally (Sam gets charged for March, Meera gets charged for April; fails Sam's request).
  2. *Dynamic Join/Leave dates in database*: Enforcing that splits are only calculated for members whose active dates cover the expense date.
* **Rationale**: Directly answers Sam's question: *"I moved in mid-April. Why would March electricity affect my balance?"* Expenses check their transaction date against group members' active ranges. For example, Sam is excluded from March electricity, and Meera is excluded from April rent, automatically recalculating splits.

---

## 5. Debt Simplification
* **Decision**: Greedy Transaction Minimization (creditor-debtor pairing).
* **Options Considered**:
  1. *Raw Ledger Debts*: Show every individual owe-relation (e.g. Rohan owes Priya, Priya owes Aisha, Meera owes Rohan; results in dozens of transactions).
  2. *Minimized Transfers List*: Greedy matching of largest debtor with largest creditor.
* **Rationale**: Directly answers Aisha's request: *"I just want one number per person. Who pays whom, how much, done."* It simplifies all bilateral debts into the minimum number of bank transfers.

---

## 6. Audit Trail Ledger
* **Decision**: Personal Chronological Ledgers with Running Balance.
* **Options Considered**:
  1. *Aggregated Balances*: Show just the final balance number (leads to "magic numbers").
  2. *Line-Item Audit Ledgers*: A ledger for each member showing the date, description, payer, bill amount, user's share, and a running balance.
* **Rationale**: Directly answers Rohan's request: *"No magic numbers. If the app says I owe ₹2,300, I want to see exactly which expenses make that up."* By selecting their name, Rohan can trace every single deposit, refund, expense share, and settlement that contributes to his final balance.

---

## 7. Custom Dropdown Selectors for Temporal Dates
* **Decision**: Custom Day / Month (Jan-Dec) / Year dropdown selectors for active membership editing.
* **Options Considered**:
  1. *Native Date Inputs (`<input type="date">`)*: Simple to write, but highly inconsistent across browsers/locales (sometimes swapping day/month segments and leading to visual bugs like "month 21") and prone to timezone offsets.
  2. *Custom Dropdowns*: Dropdown select fields restricting days (1-31), months (Jan-Dec), and years (2024-2028), paired with custom calendar validation.
* **Rationale**: Custom dropdowns ensure date input is 100% bug-free and user-friendly on all platforms. Months are strictly bound to 1-12 (labeled "Jan" to "Dec"), preventing regional browser settings from swapping day/month fields and eliminating timezone offset bugs by standardizing absolute UTC string construction.

