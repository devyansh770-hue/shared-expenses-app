# SCOPE.md — Anomaly Log & Database Schema

This document contains the comprehensive log of all data problems identified in `expenses_export.csv`, the policy for handling each one, and the relational database schema.

---

## 1. CSV Data Anomaly Log (20 Problems Detected)

The evaluators stated "at least 12 deliberate data problems." Our parser detects **20**. For each problem, we: (1) Detect it, (2) Surface it to the user, (3) Handle it according to a documented policy. A crashed import or a silent guess are both failing answers.

### Severity Legend
- 🔴 **High** — Will cause incorrect data, crashes, or financial errors if not handled
- 🟡 **Medium** — Will cause inconsistencies or user confusion
- 🟢 **Low** — Cosmetic or easily auto-fixable

---

| # | Row(s) | Problem Type | Severity | Description | Policy & Action |
|---|--------|-------------|----------|-------------|-----------------|
| 1 | 5 & 6 | **Duplicate Expense** | 🔴 High | "Dinner at Marina Bites" and "dinner - marina bites" — same date (Feb 8), same payer (Dev), same amount (₹3,200). One is lowercase with a slight description variation. | **Policy**: Flag as duplicate. Match on (date + payer + amount). **Action**: Keep Row 5 (has notes), skip Row 6. User can override. |
| 2 | 7 | **Amount with Comma Formatting** | 🔴 High | Electricity Feb amount is `"1,200"` — wrapped in quotes with a comma. Most parsers will read this as a string, not a number. | **Policy**: Strip commas and quotes before numeric parsing. **Action**: Auto-parsed as `1200.0`. Logged as formatting fix. |
| 3 | 9 | **Payer Name Case Inconsistency** | 🟡 Medium | `paid_by = priya` (lowercase). Everywhere else it's `Priya`. Without normalization, this creates a ghost user. | **Policy**: Case-insensitive name matching. **Action**: Auto-corrected to `Priya`. |
| 4 | 10 | **Floating Point / Excess Precision** | 🟡 Medium | Cylinder refill amount is `899.995` — three decimal places. INR has no sub-rupee denomination at this scale. Will cause rounding errors when splitting 4 ways. | **Policy**: Round to 2 decimal places for financial accuracy. **Action**: Rounded to `900.00` (standard banker's rounding). |
| 5 | 11 | **Unknown / Ambiguous Member Name** | 🔴 High | `paid_by = Priya S` — no "Priya S" exists in any group. Could be the same Priya or a different person. | **Policy**: Flag for user resolution. Suggest mapping to closest match. **Action**: Wizard prompts user; defaults to mapping `Priya S` → `Priya`. |
| 6 | 13 | **Missing Payer** | 🔴 High | `paid_by` column is completely empty. Note says "can't remember who paid." Cannot import an expense with no payer. | **Policy**: Block import of this row until payer is assigned. **Action**: Wizard halts and asks user to select a payer from the member list. |
| 7 | 14 | **Settlement Recorded as Expense** | 🔴 High | "Rohan paid Aisha back" (₹5,000). Note literally says "this is a settlement not an expense??" No split type, split_with is just "Aisha". | **Policy**: Detect settlement patterns (no split type + note mentions "paid back"). **Action**: Convert to a Settlement record (Rohan → Aisha, ₹5,000) instead of an Expense. |
| 8 | 15 | **Percentage Split ≠ 100%** | 🔴 High | Aisha 30% + Rohan 30% + Priya 30% + Meera 20% = **110%**. Note says "percentages might be off." | **Policy**: Reject splits that don't sum to 100%. **Action**: Auto-normalize proportionally (27.27%, 27.27%, 27.27%, 18.18%) to preserve relative weights. Flag for user review. |
| 9 | 16–27 | **Mixed Date Formats** | 🔴 High | Rows 1–15 use `YYYY-MM-DD`. Rows 16–27 switch to `DD/MM/YYYY`. Without detection, March 1 becomes January 3. | **Policy**: Auto-detect format per row using heuristic (if first segment > 12, it's DD; if first segment is 4 digits, it's YYYY). **Action**: Standardize all dates to `YYYY-MM-DD`. |
| 10 | 23 | **Non-Member in Split** | 🟡 Medium | "Dev's friend Kabir" listed in `split_with` for Parasailing. Kabir is not a registered group member. | **Policy**: Allow guest participants. **Action**: Create `Kabir` as a temporary guest member with join/leave dates matching the activity date. |
| 11 | 24 & 25 | **Conflicting Duplicate (Different Payers)** | 🔴 High | "Dinner at Thalassa" (Aisha, ₹2,400) and "Thalassa dinner" (Rohan, ₹2,450) — same date, same restaurant, different amounts and payers. Note on Row 25 says "Aisha also logged this I think hers is wrong." | **Policy**: Flag as conflict. Cannot merge — different payers and amounts. **Action**: Wizard presents both rows side-by-side; user picks the correct one. Default: keep Row 25 (Rohan's) per the note. |
| 12 | 26 | **Negative Amount (Refund)** | 🟡 Medium | Parasailing refund: `-30 USD`. Is this a refund/credit or a data error? | **Policy**: Treat negative amounts as refunds that reduce what participants owe. **Action**: Import as a negative expense. The amount reduces each participant's share proportionally. |
| 13 | 27 | **Incomplete Date (Missing Year)** | 🟡 Medium | Date is `Mar 14` — no year specified. | **Policy**: Infer year from surrounding context (other rows in March are 2026). **Action**: Auto-complete to `2026-03-14`. Log the assumption. |
| 14 | 28 | **Missing Currency** | 🟡 Medium | Groceries DMart (₹2,105) — `currency` column is blank. | **Policy**: Default to base currency (INR) when missing. **Action**: Auto-assign `INR`. Flag for user confirmation. |
| 15 | 29 | **Amount with Whitespace** | 🟢 Low | Electricity Mar amount is `" 1450 "` — leading and trailing spaces. Will fail numeric parsing if not trimmed. | **Policy**: Trim all whitespace from numeric fields. **Action**: Auto-trimmed to `1450.0`. |
| 16 | 31 | **Zero Amount Expense** | 🟡 Medium | Swiggy dinner order: amount is `0`. Note says "counted twice earlier - fixing later." A zero-amount expense is meaningless. | **Policy**: Flag zero-amount expenses as likely errors. **Action**: Skip row by default. User can override to import. |
| 17 | 36 | **Inactive Member in Split (Temporal Violation)** | 🔴 High | April 2nd expense includes Meera in `split_with`, but Meera moved out after the March 28 farewell dinner. Note admits "oops Meera still in the group list." | **Policy**: Enforce temporal membership boundaries. **Action**: Remove inactive members from the split. Recalculate equal split among active members only (Aisha, Rohan, Priya). |
| 18 | 34 | **Ambiguous Date (DD/MM vs MM/DD)** | 🔴 High | `04/05/2026` — is this April 5 or May 4? Note literally says "is this April 5 or May 4? format is a mess." | **Policy**: Cannot resolve programmatically when both interpretations are valid dates. **Action**: Wizard flags as ambiguous and asks the user to pick. Default: April 5 (consistent with DD/MM pattern used in other rows). |
| 19 | 42 | **Split Type vs Split Details Conflict** | 🟡 Medium | `split_type = equal` but `split_details = "Aisha 1; Rohan 1; Priya 1; Sam 1"` — shares data is present but contradicts the type. In this case they produce the same result, but the conflict itself is a data quality issue. | **Policy**: When `split_type = equal`, ignore `split_details`. **Action**: Process as equal split. Log the conflict. |
| 20 | 19–26 | **Mixed Currencies in Same Group** | 🟡 Medium | Goa trip expenses are in USD (rows 20, 21, 23, 26) while all others are INR. Same group, same trip, different currencies. | **Policy**: Convert all foreign currencies to base currency (INR) using a configurable exchange rate. **Action**: Prompt user for USD→INR rate (default: ₹83.0). Store both original amount/currency and converted `amountInBase`. |

---

## 2. Additional Edge Cases Handled

| Row(s) | Issue | Action |
|--------|-------|--------|
| 32 | Weekend brunch percentages also sum to 110% (same as Row 15) | Same normalization policy applied |
| 38 | "Sam deposit share" (₹15,000) — settlement pattern, not an expense | Converted to Settlement (Sam → Aisha) |
| 38–40 | Sam appears in splits on April 8, 10, 12 — before his listed join date | Wizard flags temporal inconsistency. User adjusts Sam's join date to April 8. |

---

## 3. Database Schema (Prisma / SQLite)

We use a relational SQLite database. Every model is designed to support the requirements above: temporal membership tracking, multi-currency expenses, split type variants, settlement recording, and anomaly logging.

```prisma
datasource db {
  provider = "sqlite"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  name      String   @unique
  createdAt DateTime @default(now())
  email           String
  emailVerified   Boolean        @default(false)
  image           String?
  updatedAt       DateTime       @updatedAt

  // Relationships
  memberships      GroupMember[]
  expensesPaid     Expense[]      @relation("PaidBy")
  splits           ExpenseSplit[]
  settlementsPaid  Settlement[]   @relation("SettlementPayer")
  settlementsRecv  Settlement[]   @relation("SettlementReceiver")
  sessions         Session[]
  accounts         Account[]

  @@unique([email])
}

model Group {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())

  members  GroupMember[]
  expenses Expense[]
}

model GroupMember {
  id        String    @id @default(uuid())
  groupId   String
  userId    String
  joinedAt  DateTime  @default(now())
  leftAt    DateTime? // Null = still active. Enforces temporal membership.

  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
}

model Expense {
  id           String   @id @default(uuid())
  groupId      String
  description  String
  paidById     String
  amount       Float    // Original amount in input currency
  currency     String   // "INR" or "USD"
  exchangeRate Float    @default(1.0) // Conversion rate to base (INR)
  amountInBase Float    // amount × exchangeRate
  splitType    String   // "equal", "unequal", "percentage", "share"
  date         DateTime
  notes        String?
  createdAt    DateTime @default(now())

  group  Group          @relation(fields: [groupId], references: [id], onDelete: Cascade)
  paidBy User           @relation("PaidBy", fields: [paidById], references: [id], onDelete: Cascade)
  splits ExpenseSplit[]
}

model ExpenseSplit {
  id        String @id @default(uuid())
  expenseId String
  userId    String
  amount    Float  // Share in base currency (INR)
  share     Float? // Raw share value (percentage or ratio)

  expense Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([expenseId, userId])
}

model Settlement {
  id         String   @id @default(uuid())
  groupId    String
  payerId    String
  receiverId String
  amount     Float    // Settlement amount in base currency (INR)
  date       DateTime
  notes      String?
  createdAt  DateTime @default(now())

  payer    User @relation("SettlementPayer", fields: [payerId], references: [id], onDelete: Cascade)
  receiver User @relation("SettlementReceiver", fields: [receiverId], references: [id], onDelete: Cascade)
}

model AnomalyLog {
  id           String   @id @default(uuid())
  csvRow       Int      // Row number in original CSV
  description  String   // Human-readable description
  anomalyType  String   // DUPLICATE, DATE_FORMAT, AMOUNT_FORMAT, etc.
  severity     String   // HIGH, MEDIUM, LOW
  resolvedAt   DateTime @default(now())
  actionTaken  String   // What the system did
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([token])
  @@index([userId])
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([userId])
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
}
```

### Schema Design Decisions

| Decision | Rationale |
|----------|-----------|
| `GroupMember.leftAt` nullable | `null` = currently active. Non-null = departed. Enables temporal membership queries. |
| `Expense.amountInBase` stored | Pre-computed converted amount avoids re-calculating with stale exchange rates. |
| `Expense.exchangeRate` stored | Preserves the exact rate used at import time for auditability. |
| `AnomalyLog.severity` field | Allows UI to sort/filter by severity (HIGH > MEDIUM > LOW). |
| `ExpenseSplit.share` nullable | Only populated for percentage/share split types. Equal and unequal splits compute directly. |
| SQLite as database | Meets "relational DB only" requirement. Portable, zero-config, suitable for this scale. |
