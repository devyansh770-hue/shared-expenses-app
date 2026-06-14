# SCOPE.md - Anomaly Log & Database Schema

This document contains a comprehensive log of the data problems identified in `expenses_export.csv` and how they are handled, followed by the relational database schema structure.

---

## 1. CSV Data Anomaly Log
Our custom parser and import wizard detected the following issues in the spreadsheet. Silent guessing is avoided; instead, we surface every anomaly and allow interactive resolution.

| Row | Description of Issue | Detected Anomaly Type | Policy & Action Taken |
| :--- | :--- | :--- | :--- |
| **5 & 6** | Dev's "Dinner at Marina Bites" logged twice on 2026-02-08 for ₹3,200. | `DUPLICATE` | **Policy**: Exact duplicates should be merged to avoid double-charging. **Action**: Wizard flags duplicate; user approves importing Row 5 and ignoring Row 6. |
| **7** | Electricity Feb amount formatted as `"1,200"` (with comma and quotes). | `AMOUNT_FORMAT` | **Policy**: Clean formatting anomalies to allow numeric operations. **Action**: Auto-parsed as float `1200.0`. |
| **9** | Payer `priya` spelled in lowercase. | `CASE_INCONSISTENCY` | **Policy**: Maintain data consistency. **Action**: Automatically corrected to `Priya` to match system user casing. |
| **10** | Cylinder refill amount logged as `899.995` (excessive precision). | `HIGH_PRECISION_AMOUNT`| **Policy**: Financial transactions require standard decimal scaling. **Action**: Auto-rounded to 2 decimal places: `899.99` (with rounding error adjustment). |
| **11** | Payer name logged as `Priya S` instead of `Priya`. | `NAME_VARIATION` | **Policy**: Map name variations to unified user IDs. **Action**: Wizard suggests mapping `Priya S` to `Priya`. |
| **13** | Cleaning supplies (₹780) has empty `paid_by` column. | `MISSING_PAYER` | **Policy**: Direct user to specify missing required fields. **Action**: Wizard halts and asks user to assign payer. Defaulted to `Aisha` based on notes. |
| **14** | "Rohan paid Aisha back" (₹5000) logged as an expense. | `SETTLEMENT` | **Policy**: Separate shared expenses from debt settlements. **Action**: Wizard intercepts empty split type and description, converting this to a direct debt settlement ledger entry. |
| **15** | Pizza Friday percentages split: 30%, 30%, 30%, 20% (sums to 110%). | `SPLIT_MISMATCH` | **Policy**: Proportions must sum to 100%. **Action**: Automatically normalized percentages to 27.27%, 27.27%, 27.27%, 18.18% to preserve relative weight. |
| **16** | March Rent date formatted as `01/03/2026` (DD/MM/YYYY) and ambiguous. | `DATE_FORMAT`, `AMBIGUOUS_DATE` | **Policy**: Standardize all dates to YYYY-MM-DD. **Action**: Auto-converted to `2026-03-01`. |
| **20, 21, 23** | Goa trip bookings ($540, $84, $150) logged in USD currency. | `MULTI_CURRENCY` | **Policy**: Multi-currency inputs must be converted using a specified exchange rate. **Action**: User inputs rate (default ₹83.0/USD). Converted to INR. |
| **23** | "Dev's friend Kabir" included in Parasailing split. | `UNREGISTERED_MEMBER` | **Policy**: Accommodate guest users. **Action**: Added `Kabir` as a temporary guest member with join/leave dates matching the Goa trip. |
| **24 & 25** | Aisha logged "Dinner at Thalassa" (₹2400) and Rohan logged "Thalassa dinner" (₹2450) on same day. | `CONFLICT` | **Policy**: Surface conflicting duplicates for user decision. **Action**: Wizard prompts user to choose. User chooses Rohan's Row 25 (Aisha's Row 24 deleted) based on notes. |
| **26** | Parasailing refund logged as negative USD amount (`-30`). | `NEGATIVE_AMOUNT` | **Policy**: Treat negative expenses as credits/refunds. **Action**: Converted to base INR refund, decreasing the balance of split members and debiting Dev's credit. |
| **27** | Airport cab date `Mar 14` missing year and name lowercase `rohan `. | `DATE_FORMAT`, `CASE_INCONSISTENCY` | **Policy**: Clean name spaces and auto-complete dates. **Action**: Trimmed `rohan ` to `Rohan` and auto-completed date to `2026-03-14`. |
| **28** | Groceries DMart (₹2105) has empty currency column. | `MISSING_CURRENCY` | **Policy**: Fallback to base currency. **Action**: Wizard auto-assigned `INR`. |
| **29** | Electricity Mar amount has spaces `" 1450 "`. | `AMOUNT_FORMAT` | **Policy**: Strip whitespace. **Action**: Parsed as `1450.0`. |
| **31** | Swiggy dinner order amount logged as `0`. | `ZERO_AMOUNT` | **Policy**: Permit zero amount entries but flag them. **Action**: Parsed as zero expense. |
| **32** | Weekend brunch percentages sum to 110%. | `SPLIT_MISMATCH` | **Policy**: Normalize percentage sums. **Action**: Auto-normalized splits. |
| **34** | Cleaning service date `04/05/2026` is ambiguous. | `AMBIGUOUS_DATE` | **Policy**: Let user select ambiguous dates. **Action**: User selects April 5th (excludes Sam who moved in mid-April) matching flat timeline. |
| **36** | Groceries BigBasket on April 2nd includes Meera in the split. | `TEMPORAL_MEMBERSHIP` | **Policy**: Enforce temporal boundaries (Meera left March 31). **Action**: Wizard excludes Meera. Split recalculated equally among active members (Aisha, Rohan, Priya). |
| **38** | "Sam deposit share" (₹15000) logged as equal split with Aisha. | `SETTLEMENT` | **Policy**: Direct settlement conversion. **Action**: Converted to direct settlement from Sam to Aisha. |
| **38, 39, 40** | Sam participated in splits on April 8, 10, 12 before join date (April 15). | `TEMPORAL_MEMBERSHIP` | **Policy**: Enforce membership timelines. **Action**: Wizard adjusts Sam's official move-in date back to April 8th to reconcile housewarming drinks. |
| **42** | Split type says "equal" but "split_details" specifies shares. | `SPLIT_MISMATCH` | **Policy**: Ignore redundant split details in equal splits. **Action**: Shared equally. |

---

## 2. Database Schema (Prisma / SQLite)
We utilize a local relational SQLite database schema. Below is the generated schema definition:

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

  // Relationships
  memberships      GroupMember[]
  expensesPaid     Expense[]      @relation("PaidBy")
  splits           ExpenseSplit[]
  settlementsPaid  Settlement[]   @relation("SettlementPayer")
  settlementsRecv  Settlement[]   @relation("SettlementReceiver")
}

model Group {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())

  // Relationships
  members  GroupMember[]
  expenses Expense[]
}

model GroupMember {
  id        String    @id @default(uuid())
  groupId   String
  userId    String
  joinedAt  DateTime  @default(now())
  leftAt    DateTime? // Null means still active. Used to check temporal membership.

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
  currency     String   // e.g. "INR" or "USD"
  exchangeRate Float    @default(1.0) // Rate of currency relative to base (INR)
  amountInBase Float    // Amount in INR
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
  amount    Float  // The share amount this user owes in base currency (INR)
  share     Float? // The raw share (percentage or share count) if applicable

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

  payer    User  @relation("SettlementPayer", fields: [payerId], references: [id], onDelete: Cascade)
  receiver User  @relation("SettlementReceiver", fields: [receiverId], references: [id], onDelete: Cascade)
}

model AnomalyLog {
  id           String   @id @default(uuid())
  csvRow       Int
  description  String
  anomalyType  String   // "DUPLICATE", "DATE_FORMAT", "CURRENCY", "SPLIT_MISMATCH", "TEMPORAL_MEMBERSHIP", "SETTLEMENT", "MISSING_PAYER", "CASE_INCONSISTENCY"
  resolvedAt   DateTime @default(now())
  actionTaken  String
}
```
