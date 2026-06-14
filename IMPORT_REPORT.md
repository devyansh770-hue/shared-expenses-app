# SplitSphere — CSV Import Report

This report lists all the anomalies detected and resolutions applied by the SplitSphere ingestion engine for `expenses export.csv`.

## Ingestion Metrics
* **Total Rows Parsed:** 42
* **Imported Expenses:** 42
* **Imported Settlements:** 1
* **Anomalies Detected:** 39
* **Skipped Rows:** 4

## Detected Anomalies & Action Report

| # | Row | Type | Severity | Description | Action Taken / Resolution |
|---|-----|------|----------|-------------|---------------------------|
| 1 | Row 7 | `AMOUNT_FORMAT` | **HIGH** | Amount "1,200" contains comma formatting. | Stripped commas: parsed as 1200 |
| 2 | Row 9 | `NAME_VARIATION` | **MEDIUM** | Payer name "priya" mapped to "Priya". | Normalized to "Priya" |
| 3 | Row 10 | `PRECISION` | **MEDIUM** | Amount 899.995 has 3 decimal places. Rounded to 900. | Rounded to 900 |
| 4 | Row 11 | `NAME_VARIATION` | **HIGH** | Payer name "Priya S" mapped to "Priya". | Normalized to "Priya" |
| 5 | Row 13 | `MISSING_PAYER` | **HIGH** | Payer is empty. Cannot import expense without a payer. | Row skipped — no payer assigned |
| 6 | Row 14 | `SETTLEMENT` | **HIGH** | "Rohan paid Aisha back" is a settlement, not an expense. Converted to payment record. | Converted to Settlement: Rohan → Aisha |
| 7 | Row 15 | `SPLIT_MISMATCH` | **HIGH** | Percentage split sums to 110% instead of 100%. | Auto-normalized proportionally to 100% |
| 8 | Row 16 | `AMBIGUOUS_DATE` | **HIGH** | Date "01/03/2026" is ambiguous — could be 01/03 (DD/MM) or 03/01 (MM/DD). Note says "is this April 5 or May 4?" | Interpreted as DD/MM/YYYY → 2026-03-01. User should verify. |
| 9 | Row 17 | `AMBIGUOUS_DATE` | **HIGH** | Date "03/03/2026" is ambiguous — could be 03/03 (DD/MM) or 03/03 (MM/DD). Note says "is this April 5 or May 4?" | Interpreted as DD/MM/YYYY → 2026-03-03. User should verify. |
| 10 | Row 18 | `AMBIGUOUS_DATE` | **HIGH** | Date "05/03/2026" is ambiguous — could be 05/03 (DD/MM) or 03/05 (MM/DD). Note says "is this April 5 or May 4?" | Interpreted as DD/MM/YYYY → 2026-03-05. User should verify. |
| 11 | Row 19 | `AMBIGUOUS_DATE` | **HIGH** | Date "08/03/2026" is ambiguous — could be 08/03 (DD/MM) or 03/08 (MM/DD). Note says "is this April 5 or May 4?" | Interpreted as DD/MM/YYYY → 2026-03-08. User should verify. |
| 12 | Row 20 | `AMBIGUOUS_DATE` | **HIGH** | Date "09/03/2026" is ambiguous — could be 09/03 (DD/MM) or 03/09 (MM/DD). Note says "is this April 5 or May 4?" | Interpreted as DD/MM/YYYY → 2026-03-09. User should verify. |
| 13 | Row 20 | `MULTI_CURRENCY` | **MEDIUM** | Amount is in USD. Converting at ₹83/USD. | Converted: $540 × 83 = ₹44820 |
| 14 | Row 21 | `AMBIGUOUS_DATE` | **HIGH** | Date "10/03/2026" is ambiguous — could be 10/03 (DD/MM) or 03/10 (MM/DD). Note says "is this April 5 or May 4?" | Interpreted as DD/MM/YYYY → 2026-03-10. User should verify. |
| 15 | Row 21 | `MULTI_CURRENCY` | **MEDIUM** | Amount is in USD. Converting at ₹83/USD. | Converted: $84 × 83 = ₹6972 |
| 16 | Row 22 | `AMBIGUOUS_DATE` | **HIGH** | Date "10/03/2026" is ambiguous — could be 10/03 (DD/MM) or 03/10 (MM/DD). Note says "is this April 5 or May 4?" | Interpreted as DD/MM/YYYY → 2026-03-10. User should verify. |
| 17 | Row 23 | `AMBIGUOUS_DATE` | **HIGH** | Date "11/03/2026" is ambiguous — could be 11/03 (DD/MM) or 03/11 (MM/DD). Note says "is this April 5 or May 4?" | Interpreted as DD/MM/YYYY → 2026-03-11. User should verify. |
| 18 | Row 23 | `MULTI_CURRENCY` | **MEDIUM** | Amount is in USD. Converting at ₹83/USD. | Converted: $150 × 83 = ₹12450 |
| 19 | Row 23 | `UNREGISTERED_MEMBER` | **MEDIUM** | "Dev's friend Kabir" is not a registered group member. | Added as temporary guest member |
| 20 | Row 24 | `AMBIGUOUS_DATE` | **HIGH** | Date "11/03/2026" is ambiguous — could be 11/03 (DD/MM) or 03/11 (MM/DD). Note says "is this April 5 or May 4?" | Interpreted as DD/MM/YYYY → 2026-03-11. User should verify. |
| 21 | Row 25 | `CONFLICT` | **HIGH** | Row 25 conflicts with Row 24 — same date and venue but different payer/amount. Keeping Row 25 per notes. | Kept Row 25, skipped Row 24 |
| 22 | Row 25 | `AMBIGUOUS_DATE` | **HIGH** | Date "11/03/2026" is ambiguous — could be 11/03 (DD/MM) or 03/11 (MM/DD). Note says "is this April 5 or May 4?" | Interpreted as DD/MM/YYYY → 2026-03-11. User should verify. |
| 23 | Row 26 | `AMBIGUOUS_DATE` | **HIGH** | Date "12/03/2026" is ambiguous — could be 12/03 (DD/MM) or 03/12 (MM/DD). Note says "is this April 5 or May 4?" | Interpreted as DD/MM/YYYY → 2026-03-12. User should verify. |
| 24 | Row 26 | `NEGATIVE_AMOUNT` | **MEDIUM** | Amount is negative (-30). Treated as a refund/credit. | Imported as refund — reduces participants' share |
| 25 | Row 26 | `MULTI_CURRENCY` | **MEDIUM** | Amount is in USD. Converting at ₹83/USD. | Converted: $-30 × 83 = ₹-2490 |
| 26 | Row 27 | `INCOMPLETE_DATE` | **MEDIUM** | Date "Mar 14" is missing the year. Assumed 2026 from context. | Auto-completed to 2026-03-14 |
| 27 | Row 27 | `NAME_VARIATION` | **MEDIUM** | Payer name "rohan" mapped to "Rohan". | Normalized to "Rohan" |
| 28 | Row 28 | `DATE_FORMAT` | **HIGH** | Date format "15/03/2026" is DD/MM/YYYY (not ISO). Converted to 2026-03-15. | Auto-converted to 2026-03-15 |
| 29 | Row 28 | `MISSING_CURRENCY` | **MEDIUM** | Currency is empty. Defaulted to INR. | Auto-assigned INR |
| 30 | Row 29 | `DATE_FORMAT` | **HIGH** | Date format "18/03/2026" is DD/MM/YYYY (not ISO). Converted to 2026-03-18. | Auto-converted to 2026-03-18 |
| 31 | Row 30 | `DATE_FORMAT` | **HIGH** | Date format "20/03/2026" is DD/MM/YYYY (not ISO). Converted to 2026-03-20. | Auto-converted to 2026-03-20 |
| 32 | Row 31 | `DATE_FORMAT` | **HIGH** | Date format "22/03/2026" is DD/MM/YYYY (not ISO). Converted to 2026-03-22. | Auto-converted to 2026-03-22 |
| 33 | Row 31 | `ZERO_AMOUNT` | **MEDIUM** | Amount is 0. A zero-amount expense is meaningless. | Row will be skipped by default |
| 34 | Row 32 | `DATE_FORMAT` | **HIGH** | Date format "25/03/2026" is DD/MM/YYYY (not ISO). Converted to 2026-03-25. | Auto-converted to 2026-03-25 |
| 35 | Row 32 | `SPLIT_MISMATCH` | **HIGH** | Percentage split sums to 110% instead of 100%. | Auto-normalized proportionally to 100% |
| 36 | Row 33 | `DATE_FORMAT` | **HIGH** | Date format "28/03/2026" is DD/MM/YYYY (not ISO). Converted to 2026-03-28. | Auto-converted to 2026-03-28 |
| 37 | Row 34 | `AMBIGUOUS_DATE` | **HIGH** | Date "04/05/2026" is ambiguous — could be 04/05 (DD/MM) or 05/04 (MM/DD). Note says "is this April 5 or May 4?" | Interpreted as DD/MM/YYYY → 2026-05-04. User should verify. |
| 38 | Row 36 | `TEMPORAL_MEMBERSHIP` | **HIGH** | Meera not active on 2026-04-02. Removed from split. | Excluded inactive members. Split recalculated among active members. |
| 39 | Row 42 | `SPLIT_CONFLICT` | **MEDIUM** | Split type is "equal" but split_details are provided. Details ignored. | Processed as equal split. Split details ignored. |
