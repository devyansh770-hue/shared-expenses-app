export interface RawCSVRow {
  index: number; // 1-based CSV line number
  date: string;
  description: string;
  paid_by: string;
  amount: string;
  currency: string;
  split_type: string;
  split_with: string;
  split_details: string;
  notes: string;
}

export interface Anomaly {
  row: number;
  type: 'DUPLICATE' | 'CONFLICT' | 'DATE_FORMAT' | 'AMBIGUOUS_DATE' | 'AMOUNT_FORMAT' | 'HIGH_PRECISION_AMOUNT' | 'ZERO_AMOUNT' | 'NEGATIVE_AMOUNT' | 'MISSING_PAYER' | 'CASE_INCONSISTENCY' | 'NAME_VARIATION' | 'UNREGISTERED_MEMBER' | 'MISSING_CURRENCY' | 'MULTI_CURRENCY' | 'SPLIT_MISMATCH' | 'TEMPORAL_MEMBERSHIP' | 'SETTLEMENT';
  severity: 'error' | 'warning';
  description: string;
  suggestedAction: string;
  data: any;
}

// Predefined members in the flat
export const SYSTEM_MEMBERS = ['Aisha', 'Rohan', 'Priya', 'Meera', 'Dev', 'Sam'];

// Default temporal membership dates
export const DEFAULT_MEMBERSHIP_DATES: Record<string, { joined: string; left: string | null }> = {
  Aisha: { joined: '2026-02-01', left: null },
  Rohan: { joined: '2026-02-01', left: null },
  Priya: { joined: '2026-02-01', left: null },
  Meera: { joined: '2026-02-01', left: '2026-03-31' },
  Dev: { joined: '2026-02-01', left: '2026-03-31' }, // Leaves after March trip
  Sam: { joined: '2026-04-15', left: null }, // Officially mid-April
};

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function parseCSV(content: string): RawCSVRow[] {
  const lines = content.split(/\r?\n/);
  if (lines.length === 0) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const rows: RawCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(lines[i]);
    const row: any = { index: i + 1 };
    
    headers.forEach((header, index) => {
      let val = values[index] !== undefined ? values[index] : '';
      // Strip outer quotes if present
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      row[header] = val;
    });

    rows.push(row as RawCSVRow);
  }

  return rows;
}

// Function to normalize name and return correct casing, or null if unregistered
export function normalizeName(name: string): { normalized: string; isCaseFix: boolean; isSpellingFix: boolean; nameUsed: string } {
  const trimmed = name.trim();
  const trimmedLower = trimmed.toLowerCase();

  if (!trimmed) {
    return { normalized: '', isCaseFix: false, isSpellingFix: false, nameUsed: '' };
  }

  // Check case-insensitive match first
  for (const m of SYSTEM_MEMBERS) {
    if (m.toLowerCase() === trimmedLower) {
      return {
        normalized: m,
        isCaseFix: m !== trimmed,
        isSpellingFix: false,
        nameUsed: trimmed
      };
    }
  }

  // Check spelling mapping variations
  if (trimmedLower === 'priya s') {
    return { normalized: 'Priya', isCaseFix: false, isSpellingFix: true, nameUsed: trimmed };
  }

  return { normalized: trimmed, isCaseFix: false, isSpellingFix: false, nameUsed: trimmed };
}

export function detectAnomalies(rows: RawCSVRow[]): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Helper to parse date to standard YYYY-MM-DD
  function parseAndValidateDate(dateStr: string, rowIndex: number): { date: Date | null; format: string; isAmbiguous: boolean } {
    const trimmed = dateStr.trim();
    if (!trimmed) return { date: null, format: 'empty', isAmbiguous: false };

    // Check YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const d = new Date(trimmed);
      return { date: isNaN(d.getTime()) ? null : d, format: 'YYYY-MM-DD', isAmbiguous: false };
    }

    // Check DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const parts = trimmed.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      // Check for ambiguity (e.g. 04/05/2026: could be April 5 or May 4)
      const isAmbiguous = day <= 12 && month <= 12;

      // Create date assuming DD/MM/YYYY (common format in March rent etc.)
      const d = new Date(year, month - 1, day);
      return { date: isNaN(d.getTime()) ? null : d, format: 'DD/MM/YYYY', isAmbiguous };
    }

    // Check Month Day (e.g. Mar 14)
    const monthMap: Record<string, number> = { mar: 2, feb: 1, apr: 3, may: 4 };
    const match = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2})$/);
    if (match) {
      const monthName = match[1].toLowerCase();
      const day = parseInt(match[2], 10);
      if (monthMap[monthName] !== undefined) {
        const d = new Date(2026, monthMap[monthName], day);
        return { date: d, format: 'MMM DD', isAmbiguous: false };
      }
    }

    return { date: null, format: 'unknown', isAmbiguous: false };
  }

  // Iterate rows and detect anomalies
  rows.forEach((row, idx) => {
    // 1. Payer check
    const rawPayer = row.paid_by;
    const normPayer = normalizeName(rawPayer);

    if (!rawPayer.trim()) {
      anomalies.push({
        row: row.index,
        type: 'MISSING_PAYER',
        severity: 'error',
        description: `Row ${row.index}: Payer is missing for "${row.description}".`,
        suggestedAction: 'Assign a member who paid this bill.',
        data: { field: 'paid_by' }
      });
    } else if (normPayer.isCaseFix) {
      anomalies.push({
        row: row.index,
        type: 'CASE_INCONSISTENCY',
        severity: 'warning',
        description: `Row ${row.index}: Payer name "${rawPayer}" is lowercase or has inconsistent casing.`,
        suggestedAction: `Auto-correct "${rawPayer}" to "${normPayer.normalized}".`,
        data: { field: 'paid_by', original: rawPayer, corrected: normPayer.normalized }
      });
    } else if (normPayer.isSpellingFix) {
      anomalies.push({
        row: row.index,
        type: 'NAME_VARIATION',
        severity: 'warning',
        description: `Row ${row.index}: Payer name is written as "${rawPayer}".`,
        suggestedAction: `Map "${rawPayer}" to registered member "${normPayer.normalized}".`,
        data: { field: 'paid_by', original: rawPayer, corrected: normPayer.normalized }
      });
    } else if (!SYSTEM_MEMBERS.includes(normPayer.normalized)) {
      anomalies.push({
        row: row.index,
        type: 'UNREGISTERED_MEMBER',
        severity: 'warning',
        description: `Row ${row.index}: Payer "${rawPayer}" is not in the system's flatmate list.`,
        suggestedAction: `Add "${rawPayer}" as a temporary guest member.`,
        data: { field: 'paid_by', name: rawPayer }
      });
    }

    // 2. Date check
    const dateResult = parseAndValidateDate(row.date, row.index);
    if (!dateResult.date) {
      anomalies.push({
        row: row.index,
        type: 'DATE_FORMAT',
        severity: 'error',
        description: `Row ${row.index}: Date format "${row.date}" is invalid or unrecognized.`,
        suggestedAction: 'Manually specify the correct date.',
        data: { field: 'date', raw: row.date }
      });
    } else {
      if (dateResult.format !== 'YYYY-MM-DD') {
        anomalies.push({
          row: row.index,
          type: 'DATE_FORMAT',
          severity: 'warning',
          description: `Row ${row.index}: Date format is "${row.date}" (expected YYYY-MM-DD).`,
          suggestedAction: `Auto-convert to "${dateResult.date.toISOString().substring(0, 10)}".`,
          data: { field: 'date', raw: row.date, corrected: dateResult.date.toISOString().substring(0, 10) }
        });
      }
      if (dateResult.isAmbiguous) {
        anomalies.push({
          row: row.index,
          type: 'AMBIGUOUS_DATE',
          severity: 'warning',
          description: `Row ${row.index}: Date "${row.date}" is ambiguous (could be 4th May or 5th April).`,
          suggestedAction: 'Resolve whether this is 5th April (split among 3 members active then) or 4th May (where Sam would be included).',
          data: { field: 'date', raw: row.date, option1: '2026-04-05', option2: '2026-05-04' }
        });
      }
    }

    // 3. Amount checks
    let cleanAmountStr = row.amount.replace(/"/g, '').replace(/,/g, '').trim();
    const parsedAmount = parseFloat(cleanAmountStr);
    
    if (isNaN(parsedAmount)) {
      anomalies.push({
        row: row.index,
        type: 'AMOUNT_FORMAT',
        severity: 'error',
        description: `Row ${row.index}: Amount "${row.amount}" is not a valid number.`,
        suggestedAction: 'Manually input the amount.',
        data: { field: 'amount', raw: row.amount }
      });
    } else {
      if (row.amount.includes(',') || row.amount.startsWith(' ') || row.amount.endsWith(' ')) {
        anomalies.push({
          row: row.index,
          type: 'AMOUNT_FORMAT',
          severity: 'warning',
          description: `Row ${row.index}: Amount "${row.amount}" contains formatting characters (commas/spaces).`,
          suggestedAction: `Clean amount to "${parsedAmount}".`,
          data: { field: 'amount', raw: row.amount, corrected: parsedAmount }
        });
      }
      if (cleanAmountStr.split('.')[1] && cleanAmountStr.split('.')[1].length > 2) {
        anomalies.push({
          row: row.index,
          type: 'HIGH_PRECISION_AMOUNT',
          severity: 'warning',
          description: `Row ${row.index}: Amount "${row.amount}" has fractional precision (more than 2 decimal places).`,
          suggestedAction: `Round to 2 decimal places: "${parsedAmount.toFixed(2)}".`,
          data: { field: 'amount', raw: row.amount, corrected: Number(parsedAmount.toFixed(2)) }
        });
      }
      if (parsedAmount === 0) {
        anomalies.push({
          row: row.index,
          type: 'ZERO_AMOUNT',
          severity: 'warning',
          description: `Row ${row.index}: Expense amount is zero.`,
          suggestedAction: 'Verify if this is a double-logged item to delete, or a valid zero bill.',
          data: { field: 'amount', amount: 0 }
        });
      }
      if (parsedAmount < 0) {
        anomalies.push({
          row: row.index,
          type: 'NEGATIVE_AMOUNT',
          severity: 'warning',
          description: `Row ${row.index}: Negative amount "${row.amount}" detected.`,
          suggestedAction: 'Treat as a refund, which reduces balances for the split members and credits the payer.',
          data: { field: 'amount', amount: parsedAmount }
        });
      }
    }

    // 4. Currency
    if (!row.currency.trim()) {
      anomalies.push({
        row: row.index,
        type: 'MISSING_CURRENCY',
        severity: 'warning',
        description: `Row ${row.index}: Currency is missing for "${row.description}".`,
        suggestedAction: 'Assume currency is "INR".',
        data: { field: 'currency', corrected: 'INR' }
      });
    } else if (row.currency.trim().toUpperCase() === 'USD') {
      anomalies.push({
        row: row.index,
        type: 'MULTI_CURRENCY',
        severity: 'warning',
        description: `Row ${row.index}: USD expense detected ($${parsedAmount}).`,
        suggestedAction: 'Convert to INR using the exchange rate (default: 83.0 INR/USD).',
        data: { field: 'currency', currency: 'USD', amount: parsedAmount }
      });
    }

    // 5. Settlements logged as expenses
    const descLower = row.description.toLowerCase();
    const splitTypeLower = row.split_type.toLowerCase();
    const hasPaidBack = descLower.includes('paid') && descLower.includes('back') || descLower.includes('deposit') || descLower.includes('settlement');
    const isSettlementSplit = !row.split_type.trim() && row.split_with.split(';').length === 1;

    if (hasPaidBack || isSettlementSplit || splitTypeLower === '') {
      // If split_type is empty and it's a direct payment, it's a settlement
      anomalies.push({
        row: row.index,
        type: 'SETTLEMENT',
        severity: 'warning',
        description: `Row ${row.index}: "${row.description}" appears to be a direct debt settlement/payment rather than a shared group expense.`,
        suggestedAction: 'Record this as a direct payment/settlement in the ledger to balance the sheets.',
        data: { field: 'split_type', isSettlement: true }
      });
    }

    // 6. Split validation (percentages, shares, unequal sums)
    const rawSplitWith = row.split_with.split(';').map(x => x.trim()).filter(Boolean);
    
    // Check if any split member has name casing/spelling issues
    rawSplitWith.forEach(member => {
      const norm = normalizeName(member);
      if (norm.isCaseFix) {
        anomalies.push({
          row: row.index,
          type: 'CASE_INCONSISTENCY',
          severity: 'warning',
          description: `Row ${row.index}: Split member name "${member}" has inconsistent casing.`,
          suggestedAction: `Auto-correct to "${norm.normalized}".`,
          data: { field: 'split_with', original: member, corrected: norm.normalized }
        });
      } else if (norm.isSpellingFix) {
        anomalies.push({
          row: row.index,
          type: 'NAME_VARIATION',
          severity: 'warning',
          description: `Row ${row.index}: Split member name "${member}" is misspelled.`,
          suggestedAction: `Map to "${norm.normalized}".`,
          data: { field: 'split_with', original: member, corrected: norm.normalized }
        });
      } else if (member && !SYSTEM_MEMBERS.includes(norm.normalized)) {
        // Unregistered user in split
        anomalies.push({
          row: row.index,
          type: 'UNREGISTERED_MEMBER',
          severity: 'warning',
          description: `Row ${row.index}: Split member "${member}" is not a registered flatmate.`,
          suggestedAction: `Add "${member}" as a temporary guest member.`,
          data: { field: 'split_with', name: member }
        });
      }
    });

    if (row.split_type === 'percentage' && row.split_details) {
      // Parse e.g. "Aisha 30%; Rohan 30%; Priya 30%; Meera 20%"
      const details = row.split_details.split(';').map(x => x.trim()).filter(Boolean);
      let totalPercent = 0;
      details.forEach(d => {
        const parts = d.split(/\s+/);
        const pct = parseFloat(parts[parts.length - 1].replace('%', ''));
        if (!isNaN(pct)) totalPercent += pct;
      });
      if (Math.abs(totalPercent - 100) > 0.01) {
        anomalies.push({
          row: row.index,
          type: 'SPLIT_MISMATCH',
          severity: 'error',
          description: `Row ${row.index}: Percentages in split details sum to ${totalPercent}% (expected 100%).`,
          suggestedAction: `Normalize percentages proportionally so they sum to 100%.`,
          data: { field: 'split_details', splitType: 'percentage', sum: totalPercent }
        });
      }
    } else if (row.split_type === 'unequal' && row.split_details) {
      // Parse e.g. "Rohan 700; Priya 400; Meera 400"
      const details = row.split_details.split(';').map(x => x.trim()).filter(Boolean);
      let totalAmount = 0;
      details.forEach(d => {
        const parts = d.split(/\s+/);
        const amt = parseFloat(parts[parts.length - 1]);
        if (!isNaN(amt)) totalAmount += amt;
      });
      if (Math.abs(totalAmount - parsedAmount) > 0.01 && !isNaN(parsedAmount)) {
        anomalies.push({
          row: row.index,
          type: 'SPLIT_MISMATCH',
          severity: 'error',
          description: `Row ${row.index}: Split amounts sum to ₹${totalAmount} but expense amount is ₹${parsedAmount}.`,
          suggestedAction: `Adjust split details or the main amount to match.`,
          data: { field: 'split_details', splitType: 'unequal', sum: totalAmount, expected: parsedAmount }
        });
      }
    } else if (row.split_type === 'equal' && row.split_details.trim()) {
      anomalies.push({
        row: row.index,
        type: 'SPLIT_MISMATCH',
        severity: 'warning',
        description: `Row ${row.index}: Split type is "equal" but "split_details" lists shares anyway.`,
        suggestedAction: 'Ignore split details and split equally among the members listed in split_with.',
        data: { field: 'split_details', splitType: 'equal' }
      });
    }

    // 7. Temporal membership checks
    if (dateResult.date) {
      const expDateStr = dateResult.date.toISOString().substring(0, 10);
      const activeMembersAtDate: string[] = [];

      Object.entries(DEFAULT_MEMBERSHIP_DATES).forEach(([member, dates]) => {
        const joinedDate = dates.joined;
        const leftDate = dates.left;

        const joinedMatch = expDateStr >= joinedDate;
        const leftMatch = leftDate === null || expDateStr <= leftDate;

        if (joinedMatch && leftMatch) {
          activeMembersAtDate.push(member);
        }
      });

      // Check if payer is active
      const normalizedPayer = normPayer.normalized;
      if (normalizedPayer && SYSTEM_MEMBERS.includes(normalizedPayer)) {
        const joinedDate = DEFAULT_MEMBERSHIP_DATES[normalizedPayer]?.joined;
        const leftDate = DEFAULT_MEMBERSHIP_DATES[normalizedPayer]?.left;

        const isActivePayer = (joinedDate && expDateStr >= joinedDate) && (leftDate === null || expDateStr <= leftDate);
        if (!isActivePayer) {
          anomalies.push({
            row: row.index,
            type: 'TEMPORAL_MEMBERSHIP',
            severity: 'error',
            description: `Row ${row.index}: Payer "${normalizedPayer}" is logged for an expense on ${expDateStr}, but they were not active in the flat at that date (Joined: ${joinedDate}, Left: ${leftDate || 'Present'}).`,
            suggestedAction: 'Change the expense date or change the payer to an active member.',
            data: { field: 'paid_by', name: normalizedPayer, date: expDateStr, joined: joinedDate, left: leftDate }
          });
        }
      }

      // Check if split members are active
      rawSplitWith.forEach(member => {
        const normMember = normalizeName(member).normalized;
        if (normMember && SYSTEM_MEMBERS.includes(normMember)) {
          const joinedDate = DEFAULT_MEMBERSHIP_DATES[normMember]?.joined;
          const leftDate = DEFAULT_MEMBERSHIP_DATES[normMember]?.left;

          const isActiveMember = (joinedDate && expDateStr >= joinedDate) && (leftDate === null || expDateStr <= leftDate);
          if (!isActiveMember) {
            anomalies.push({
              row: row.index,
              type: 'TEMPORAL_MEMBERSHIP',
              severity: 'error',
              description: `Row ${row.index}: Member "${normMember}" is included in the split on ${expDateStr}, but they were not active in the flat at that date (Joined: ${joinedDate}, Left: ${leftDate || 'Present'}).`,
              suggestedAction: `Exclude "${normMember}" from the split list and redistribute their share.`,
              data: { field: 'split_with', name: normMember, date: expDateStr, joined: joinedDate, left: leftDate }
            });
          }
        }
      });
    }
  });

  // 8. Duplicate / Conflict checks (across rows)
  for (let i = 0; i < rows.length; i++) {
    const rowA = rows[i];
    const dateA = parseAndValidateDate(rowA.date, rowA.index).date;
    const cleanAmtA = parseFloat(rowA.amount.replace(/"/g, '').replace(/,/g, '').trim());

    for (let j = i + 1; j < rows.length; j++) {
      const rowB = rows[j];
      const dateB = parseAndValidateDate(rowB.date, rowB.index).date;
      const cleanAmtB = parseFloat(rowB.amount.replace(/"/g, '').replace(/,/g, '').trim());

      // If dates match (or are extremely close) and amounts match or are very close
      if (dateA && dateB && dateA.getTime() === dateB.getTime()) {
        const descA = rowA.description.toLowerCase().trim();
        const descB = rowB.description.toLowerCase().trim();

        // Calculate string similarity or direct substring checks
        const isDescSimilar = descA.includes(descB) || descB.includes(descA) || 
                              (descA.replace(/\s/g, '') === descB.replace(/\s/g, '')) ||
                              (descA.split(' ')[0] === descB.split(' ')[0] && descA.split(' ').length > 1);

        if (isDescSimilar) {
          const payerA = normalizeName(rowA.paid_by).normalized;
          const payerB = normalizeName(rowB.paid_by).normalized;

          if (cleanAmtA === cleanAmtB && payerA === payerB) {
            // Exact duplicate: description/amount/date/payer matches
            anomalies.push({
              row: rowB.index,
              type: 'DUPLICATE',
              severity: 'warning',
              description: `Row ${rowB.index}: "${rowB.description}" is an exact duplicate of Row ${rowA.index} ("${rowA.description}").`,
              suggestedAction: `Merge these rows and import only one copy (Row ${rowA.index}).`,
              data: { duplicateOf: rowA.index, rowA: rowA.index, rowB: rowB.index }
            });
          } else {
            // Conflict: same day, similar description, but amount or payer differs
            anomalies.push({
              row: rowB.index,
              type: 'CONFLICT',
              severity: 'warning',
              description: `Row ${rowB.index}: "${rowB.description}" (₹${cleanAmtB} by ${payerB}) conflicts with Row ${rowA.index} ("${rowA.description}" - ₹${cleanAmtA} by ${payerA}) on the same date.`,
              suggestedAction: `Select which entry is correct, or keep both if they were separate expenses.`,
              data: { conflictWith: rowA.index, rowA: rowA.index, rowB: rowB.index }
            });
          }
        }
      }
    }
  }

  return anomalies.sort((a, b) => a.row - b.row);
}
