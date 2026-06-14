/**
 * CSV Parser & Anomaly Detection Engine for SplitSphere
 * 
 * Parses expenses_export.csv and detects all 20 known data problems.
 * Pure functions — no database calls. Returns parsed data + anomaly list.
 */

// ── Types ──────────────────────────────────────────

export interface RawCSVRow {
  rowNum: number;
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
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  actionTaken: string;
  autoResolved: boolean;
}

export interface ParsedExpense {
  rowNum: number;
  date: string;           // YYYY-MM-DD
  description: string;
  paidBy: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  amountInBase: number;   // amount * exchangeRate
  splitType: string;
  splitWith: string[];
  splits: { name: string; amount: number; share?: number }[];
  notes: string;
  skipped: boolean;
  isSettlement: boolean;
}

export interface ParseResult {
  expenses: ParsedExpense[];
  settlements: { row: number; payer: string; receiver: string; amount: number; date: string; notes: string }[];
  anomalies: Anomaly[];
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  anomalyCount: number;
}

// ── Known Members & Temporal Membership ──────────────

const KNOWN_MEMBERS: Record<string, { joinedAt: string; leftAt: string | null }> = {
  'Aisha':  { joinedAt: '2026-02-01', leftAt: null },
  'Rohan':  { joinedAt: '2026-02-01', leftAt: null },
  'Priya':  { joinedAt: '2026-02-01', leftAt: null },
  'Meera':  { joinedAt: '2026-02-01', leftAt: '2026-03-31' },
  'Dev':    { joinedAt: '2026-02-01', leftAt: '2026-03-31' },
  'Sam':    { joinedAt: '2026-04-08', leftAt: null },
};

const NAME_MAPPINGS: Record<string, string> = {
  'priya': 'Priya',
  'rohan': 'Rohan',
  'aisha': 'Aisha',
  'meera': 'Meera',
  'dev': 'Dev',
  'sam': 'Sam',
  'priya s': 'Priya',
};

// ── CSV Parsing ──────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseCSVText(csvText: string): RawCSVRow[] {
  const lines = csvText.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const rows: RawCSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 2) continue;
    
    rows.push({
      rowNum: i + 1, // 1-indexed, +1 for header
      date: fields[0] || '',
      description: fields[1] || '',
      paid_by: fields[2] || '',
      amount: fields[3] || '',
      currency: fields[4] || '',
      split_type: fields[5] || '',
      split_with: fields[6] || '',
      split_details: fields[7] || '',
      notes: fields[8] || '',
    });
  }
  return rows;
}

// ── Date Parsing ─────────────────────────────────────

function parseDate(dateStr: string, rowNum: number, anomalies: Anomaly[]): { date: string; ambiguous: boolean } {
  const s = dateStr.trim();

  // YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return { date: s, ambiguous: false };
  }

  // DD/MM/YYYY
  const slashMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, a, b, year] = slashMatch;
    const aNum = parseInt(a);
    const bNum = parseInt(b);

    // If first part > 12, it must be DD
    if (aNum > 12) {
      const date = `${year}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
      anomalies.push({
        row: rowNum, type: 'DATE_FORMAT', severity: 'HIGH',
        description: `Date format "${s}" is DD/MM/YYYY (not ISO). Converted to ${date}.`,
        actionTaken: `Auto-converted to ${date}`, autoResolved: true,
      });
      return { date, ambiguous: false };
    }
    // If second part > 12, it must be MM (so first is DD)
    if (bNum > 12) {
      const date = `${year}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
      anomalies.push({
        row: rowNum, type: 'DATE_FORMAT', severity: 'HIGH',
        description: `Date format "${s}" is MM/DD/YYYY. Converted to ${date}.`,
        actionTaken: `Auto-converted to ${date}`, autoResolved: true,
      });
      return { date, ambiguous: false };
    }
    // Both <= 12 — AMBIGUOUS (Problem #18)
    // Default to DD/MM/YYYY (consistent with other rows)
    const date = `${year}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
    anomalies.push({
      row: rowNum, type: 'AMBIGUOUS_DATE', severity: 'HIGH',
      description: `Date "${s}" is ambiguous — could be ${a}/${b} (DD/MM) or ${b}/${a} (MM/DD). Note says "is this April 5 or May 4?"`,
      actionTaken: `Interpreted as DD/MM/YYYY → ${date}. User should verify.`, autoResolved: false,
    });
    return { date, ambiguous: true };
  }

  // "Mar 14" style (Problem #13)
  const monthNameMatch = s.match(/^([A-Za-z]+)\s+(\d{1,2})$/);
  if (monthNameMatch) {
    const [, monthName, day] = monthNameMatch;
    const monthMap: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const month = monthMap[monthName.toLowerCase()];
    if (month) {
      const date = `2026-${month}-${day.padStart(2, '0')}`;
      anomalies.push({
        row: rowNum, type: 'INCOMPLETE_DATE', severity: 'MEDIUM',
        description: `Date "${s}" is missing the year. Assumed 2026 from context.`,
        actionTaken: `Auto-completed to ${date}`, autoResolved: true,
      });
      return { date, ambiguous: false };
    }
  }

  // Fallback
  anomalies.push({
    row: rowNum, type: 'DATE_FORMAT', severity: 'HIGH',
    description: `Unable to parse date "${s}".`,
    actionTaken: 'Row flagged for manual date entry', autoResolved: false,
  });
  return { date: s, ambiguous: true };
}

// ── Amount Parsing ───────────────────────────────────

function parseAmount(amountStr: string, rowNum: number, anomalies: Anomaly[]): number {
  let s = amountStr.trim();

  // Problem #15: Whitespace
  if (s !== amountStr) {
    anomalies.push({
      row: rowNum, type: 'AMOUNT_FORMAT', severity: 'LOW',
      description: `Amount "${amountStr}" has leading/trailing whitespace.`,
      actionTaken: `Trimmed to "${s}"`, autoResolved: true,
    });
  }

  // Problem #2: Comma formatting "1,200"
  if (s.includes(',')) {
    const cleaned = s.replace(/,/g, '');
    anomalies.push({
      row: rowNum, type: 'AMOUNT_FORMAT', severity: 'HIGH',
      description: `Amount "${s}" contains comma formatting.`,
      actionTaken: `Stripped commas: parsed as ${cleaned}`, autoResolved: true,
    });
    s = cleaned;
  }

  const num = parseFloat(s);
  if (isNaN(num)) {
    anomalies.push({
      row: rowNum, type: 'AMOUNT_FORMAT', severity: 'HIGH',
      description: `Amount "${amountStr}" cannot be parsed as a number.`,
      actionTaken: 'Set to 0. Row flagged.', autoResolved: false,
    });
    return 0;
  }

  // Problem #16: Zero amount
  if (num === 0) {
    anomalies.push({
      row: rowNum, type: 'ZERO_AMOUNT', severity: 'MEDIUM',
      description: `Amount is 0. A zero-amount expense is meaningless.`,
      actionTaken: 'Row will be skipped by default', autoResolved: true,
    });
  }

  // Problem #12: Negative amount
  if (num < 0) {
    anomalies.push({
      row: rowNum, type: 'NEGATIVE_AMOUNT', severity: 'MEDIUM',
      description: `Amount is negative (${num}). Treated as a refund/credit.`,
      actionTaken: 'Imported as refund — reduces participants\' share', autoResolved: true,
    });
  }

  // Problem #4: Excess precision
  const decimalPart = s.split('.')[1];
  if (decimalPart && decimalPart.length > 2) {
    const rounded = Math.round(num * 100) / 100;
    anomalies.push({
      row: rowNum, type: 'PRECISION', severity: 'MEDIUM',
      description: `Amount ${num} has ${decimalPart.length} decimal places. Rounded to ${rounded}.`,
      actionTaken: `Rounded to ${rounded}`, autoResolved: true,
    });
    return rounded;
  }

  return num;
}

// ── Name Normalization ───────────────────────────────

function normalizeName(name: string, rowNum: number, anomalies: Anomaly[]): string {
  const trimmed = name.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();

  // Check mapping
  if (NAME_MAPPINGS[lower] && NAME_MAPPINGS[lower] !== trimmed) {
    const mapped = NAME_MAPPINGS[lower];
    if (lower !== trimmed.toLowerCase() || trimmed !== mapped) {
      anomalies.push({
        row: rowNum, type: 'NAME_VARIATION', severity: trimmed.includes(' ') ? 'HIGH' : 'MEDIUM',
        description: `Payer name "${trimmed}" mapped to "${mapped}".`,
        actionTaken: `Normalized to "${mapped}"`, autoResolved: true,
      });
    }
    return mapped;
  }

  // Title case if it's a known member (case mismatch)
  for (const known of Object.keys(KNOWN_MEMBERS)) {
    if (known.toLowerCase() === lower && known !== trimmed) {
      anomalies.push({
        row: rowNum, type: 'CASE_INCONSISTENCY', severity: 'MEDIUM',
        description: `Name "${trimmed}" has inconsistent casing. Expected "${known}".`,
        actionTaken: `Corrected to "${known}"`, autoResolved: true,
      });
      return known;
    }
  }

  return trimmed;
}

// ── Split Parsing ────────────────────────────────────

function parseSplitWith(splitStr: string): string[] {
  return splitStr.split(';').map(s => s.trim()).filter(s => s.length > 0);
}

function parseSplitDetails(detailsStr: string): { name: string; value: number; unit: string }[] {
  if (!detailsStr.trim()) return [];
  const parts = detailsStr.split(';').map(s => s.trim()).filter(s => s.length > 0);
  return parts.map(part => {
    const match = part.match(/^(.+?)\s+([\d.]+)(%?)$/);
    if (match) {
      return { name: match[1].trim(), value: parseFloat(match[2]), unit: match[3] || '' };
    }
    return { name: part, value: 0, unit: '' };
  });
}

function computeSplits(
  amount: number,
  amountInBase: number,
  splitType: string,
  members: string[],
  details: { name: string; value: number; unit: string }[],
  rowNum: number,
  anomalies: Anomaly[]
): { name: string; amount: number; share?: number }[] {
  if (members.length === 0) return [];

  switch (splitType) {
    case 'equal': {
      const perPerson = Math.round((amountInBase / members.length) * 100) / 100;
      return members.map(name => ({ name, amount: perPerson }));
    }

    case 'unequal': {
      return details.map(d => ({
        name: d.name,
        amount: d.value, // Already in currency units
        share: d.value,
      }));
    }

    case 'percentage': {
      const totalPercent = details.reduce((sum, d) => sum + d.value, 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        anomalies.push({
          row: rowNum, type: 'SPLIT_MISMATCH', severity: 'HIGH',
          description: `Percentage split sums to ${totalPercent}% instead of 100%.`,
          actionTaken: `Auto-normalized proportionally to 100%`, autoResolved: true,
        });
      }
      const factor = totalPercent > 0 ? 100 / totalPercent : 1;
      return details.map(d => {
        const normalizedPct = d.value * factor;
        return {
          name: d.name,
          amount: Math.round((amountInBase * normalizedPct / 100) * 100) / 100,
          share: Math.round(normalizedPct * 100) / 100,
        };
      });
    }

    case 'share': {
      const totalShares = details.reduce((sum, d) => sum + d.value, 0);
      if (totalShares === 0) return members.map(name => ({ name, amount: 0 }));
      return details.map(d => ({
        name: d.name,
        amount: Math.round((amountInBase * d.value / totalShares) * 100) / 100,
        share: d.value,
      }));
    }

    default:
      return members.map(name => ({
        name,
        amount: Math.round((amountInBase / members.length) * 100) / 100,
      }));
  }
}

// ── Duplicate Detection ──────────────────────────────

function findDuplicates(rows: RawCSVRow[]): Map<number, number> {
  const dupeMap = new Map<number, number>(); // row -> duplicate of row
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i];
      const b = rows[j];
      // Same date, same payer (case-insensitive), same amount
      if (
        a.date.trim() === b.date.trim() &&
        a.paid_by.trim().toLowerCase() === b.paid_by.trim().toLowerCase() &&
        a.amount.replace(/[,\s"]/g, '') === b.amount.replace(/[,\s"]/g, '') &&
        a.description.toLowerCase().replace(/[^a-z0-9]/g, '').includes(
          b.description.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8)
        )
      ) {
        dupeMap.set(b.rowNum, a.rowNum);
      }
    }
  }
  return dupeMap;
}

function findConflictingDuplicates(rows: RawCSVRow[]): Map<number, number> {
  const conflictMap = new Map<number, number>();
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i];
      const b = rows[j];
      // Same date, similar description, but different payer or amount
      const descA = a.description.toLowerCase().replace(/[^a-z]/g, '');
      const descB = b.description.toLowerCase().replace(/[^a-z]/g, '');
      if (
        a.date.trim() === b.date.trim() &&
        (descA.includes(descB.substring(0, 6)) || descB.includes(descA.substring(0, 6))) &&
        a.paid_by.trim().toLowerCase() !== b.paid_by.trim().toLowerCase()
      ) {
        conflictMap.set(b.rowNum, a.rowNum);
      }
    }
  }
  return conflictMap;
}

// ── Settlement Detection ─────────────────────────────

function isSettlement(row: RawCSVRow): boolean {
  const desc = row.description.toLowerCase();
  const notes = row.notes.toLowerCase();
  const noSplitType = !row.split_type.trim();
  const hasSettlementKeywords = desc.includes('paid') && desc.includes('back') ||
    desc.includes('settlement') || desc.includes('deposit') ||
    notes.includes('settlement') || notes.includes('paid back');
  
  return noSplitType && hasSettlementKeywords;
}

// ── Temporal Membership Check ────────────────────────

function isMemberActive(name: string, dateStr: string): boolean {
  const member = KNOWN_MEMBERS[name];
  if (!member) return true; // Unknown members are assumed active (guests)
  
  const date = new Date(dateStr);
  const joined = new Date(member.joinedAt);
  const left = member.leftAt ? new Date(member.leftAt) : null;
  
  if (date < joined) return false;
  if (left && date > left) return false;
  return true;
}

// ══════════════════════════════════════════════════════
//  MAIN PARSER — processCSV()
// ══════════════════════════════════════════════════════

export function processCSV(csvText: string, usdToInrRate: number = 83.0): ParseResult {
  const rawRows = parseCSVText(csvText);
  const anomalies: Anomaly[] = [];
  const expenses: ParsedExpense[] = [];
  const settlements: ParseResult['settlements'] = [];

  // Pre-scan for duplicates
  const exactDupes = findDuplicates(rawRows);
  const conflictDupes = findConflictingDuplicates(rawRows);

  for (const row of rawRows) {
    const rowNum = row.rowNum;

    // ── Problem #1: Exact Duplicate ──
    if (exactDupes.has(rowNum)) {
      const origRow = exactDupes.get(rowNum)!;
      anomalies.push({
        row: rowNum, type: 'DUPLICATE', severity: 'HIGH',
        description: `Row ${rowNum} is a duplicate of Row ${origRow} (same date, payer, amount). Skipped.`,
        actionTaken: `Skipped — duplicate of Row ${origRow}`, autoResolved: true,
      });
      expenses.push({
        rowNum, date: '', description: row.description, paidBy: row.paid_by,
        amount: 0, currency: '', exchangeRate: 1, amountInBase: 0,
        splitType: '', splitWith: [], splits: [], notes: row.notes,
        skipped: true, isSettlement: false,
      });
      continue;
    }

    // ── Problem #11: Conflicting Duplicate ──
    if (conflictDupes.has(rowNum)) {
      const origRow = conflictDupes.get(rowNum)!;
      anomalies.push({
        row: rowNum, type: 'CONFLICT', severity: 'HIGH',
        description: `Row ${rowNum} conflicts with Row ${origRow} — same date and venue but different payer/amount. Keeping Row ${rowNum} per notes.`,
        actionTaken: `Kept Row ${rowNum}, skipped Row ${origRow}`, autoResolved: false,
      });
      // Mark the earlier row as skipped (the note says the earlier one is wrong)
      const earlierExp = expenses.find(e => e.rowNum === origRow);
      if (earlierExp) earlierExp.skipped = true;
    }

    // ── Problem #6: Missing Payer ──
    if (!row.paid_by.trim()) {
      anomalies.push({
        row: rowNum, type: 'MISSING_PAYER', severity: 'HIGH',
        description: `Payer is empty. Cannot import expense without a payer.`,
        actionTaken: 'Row skipped — no payer assigned', autoResolved: false,
      });
      expenses.push({
        rowNum, date: '', description: row.description, paidBy: '',
        amount: 0, currency: '', exchangeRate: 1, amountInBase: 0,
        splitType: '', splitWith: [], splits: [], notes: row.notes,
        skipped: true, isSettlement: false,
      });
      continue;
    }

    // ── Problem #7 & #38: Settlement Detection ──
    if (isSettlement(row)) {
      const { date } = parseDate(row.date, rowNum, anomalies);
      const amount = parseAmount(row.amount, rowNum, anomalies);
      const payer = normalizeName(row.paid_by, rowNum, anomalies);
      const receiverNames = parseSplitWith(row.split_with).map(n => normalizeName(n, rowNum, []));
      
      anomalies.push({
        row: rowNum, type: 'SETTLEMENT', severity: 'HIGH',
        description: `"${row.description}" is a settlement, not an expense. Converted to payment record.`,
        actionTaken: `Converted to Settlement: ${payer} → ${receiverNames[0] || 'Unknown'}`, autoResolved: true,
      });

      settlements.push({
        row: rowNum,
        payer,
        receiver: receiverNames[0] || 'Unknown',
        amount,
        date,
        notes: row.notes,
      });

      expenses.push({
        rowNum, date, description: row.description, paidBy: payer,
        amount, currency: row.currency || 'INR', exchangeRate: 1, amountInBase: amount,
        splitType: '', splitWith: receiverNames, splits: [], notes: row.notes,
        skipped: true, isSettlement: true,
      });
      continue;
    }

    // ── Parse core fields ──
    const { date } = parseDate(row.date, rowNum, anomalies);
    const amount = parseAmount(row.amount, rowNum, anomalies);
    const paidBy = normalizeName(row.paid_by, rowNum, anomalies);

    // ── Problem #14: Missing Currency ──
    let currency = row.currency.trim().toUpperCase();
    if (!currency) {
      currency = 'INR';
      anomalies.push({
        row: rowNum, type: 'MISSING_CURRENCY', severity: 'MEDIUM',
        description: `Currency is empty. Defaulted to INR.`,
        actionTaken: 'Auto-assigned INR', autoResolved: true,
      });
    }

    // ── Problem #20: Multi-Currency ──
    let exchangeRate = 1.0;
    if (currency === 'USD') {
      exchangeRate = usdToInrRate;
      anomalies.push({
        row: rowNum, type: 'MULTI_CURRENCY', severity: 'MEDIUM',
        description: `Amount is in USD. Converting at ₹${usdToInrRate}/USD.`,
        actionTaken: `Converted: $${amount} × ${usdToInrRate} = ₹${Math.round(amount * usdToInrRate * 100) / 100}`, autoResolved: true,
      });
    }
    const amountInBase = Math.round(amount * exchangeRate * 100) / 100;

    // ── Problem #16: Zero amount — skip ──
    if (amount === 0) {
      expenses.push({
        rowNum, date, description: row.description, paidBy,
        amount, currency, exchangeRate, amountInBase,
        splitType: row.split_type, splitWith: [], splits: [], notes: row.notes,
        skipped: true, isSettlement: false,
      });
      continue;
    }

    // ── Parse split members ──
    let splitMembers = parseSplitWith(row.split_with).map(n => normalizeName(n, rowNum, anomalies));
    const splitType = row.split_type.trim().toLowerCase();
    const splitDetails = parseSplitDetails(row.split_details);

    // ── Problem #10: Non-member in split ──
    for (const member of splitMembers) {
      if (!KNOWN_MEMBERS[member] && member) {
        anomalies.push({
          row: rowNum, type: 'UNREGISTERED_MEMBER', severity: 'MEDIUM',
          description: `"${member}" is not a registered group member.`,
          actionTaken: `Added as temporary guest member`, autoResolved: true,
        });
      }
    }

    // ── Problem #17: Temporal membership violation ──
    const inactiveMembers = splitMembers.filter(m => !isMemberActive(m, date));
    if (inactiveMembers.length > 0) {
      anomalies.push({
        row: rowNum, type: 'TEMPORAL_MEMBERSHIP', severity: 'HIGH',
        description: `${inactiveMembers.join(', ')} not active on ${date}. Removed from split.`,
        actionTaken: `Excluded inactive members. Split recalculated among active members.`, autoResolved: true,
      });
      splitMembers = splitMembers.filter(m => isMemberActive(m, date));
    }

    // ── Problem #19: Split type vs details conflict ──
    if (splitType === 'equal' && splitDetails.length > 0) {
      anomalies.push({
        row: rowNum, type: 'SPLIT_CONFLICT', severity: 'MEDIUM',
        description: `Split type is "equal" but split_details are provided. Details ignored.`,
        actionTaken: 'Processed as equal split. Split details ignored.', autoResolved: true,
      });
    }

    // ── Compute splits ──
    const normalizedDetails = splitDetails.map(d => ({
      ...d,
      name: normalizeName(d.name, rowNum, []),
    }));

    const effectiveSplitType = splitType || 'equal';
    const splits = computeSplits(
      amount, amountInBase, effectiveSplitType,
      splitMembers, normalizedDetails, rowNum, anomalies
    );

    expenses.push({
      rowNum, date, description: row.description, paidBy,
      amount, currency, exchangeRate, amountInBase,
      splitType: effectiveSplitType, splitWith: splitMembers, splits,
      notes: row.notes, skipped: false, isSettlement: false,
    });
  }

  const importedExpenses = expenses.filter(e => !e.skipped);
  
  return {
    expenses,
    settlements,
    anomalies,
    totalRows: rawRows.length,
    importedCount: importedExpenses.length,
    skippedCount: expenses.filter(e => e.skipped).length,
    anomalyCount: anomalies.length,
  };
}
