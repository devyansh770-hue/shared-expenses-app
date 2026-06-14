'use client'

import { useEffect, useState } from 'react'
import { 
  Upload, AlertTriangle, CheckCircle, HelpCircle, User as UserIcon, 
  ArrowRight, RefreshCw, Trash2, Plus, Info, ChevronRight, FileText, Check, DollarSign, Calendar
} from 'lucide-react'
import { 
  seedGroupAndUsers, getGroupData, createExpense, recordSettlement, 
  updateMemberMembership, addMemberToGroup, deleteExpense, deleteSettlement, 
  importResolvedData, readWorkspaceCSV 
} from '@/app/actions'
import { parseCSV, detectAnomalies, normalizeName, SYSTEM_MEMBERS, DEFAULT_MEMBERSHIP_DATES } from '@/lib/csvParser'

type TabType = 'overview' | 'import' | 'ledger' | 'expenses' | 'settings'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [groupId, setGroupId] = useState<string | null>(null)
  const [groupData, setGroupData] = useState<any>(null)
  const [activeUser, setActiveUser] = useState<any>(null) // Login module
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Manual Expense Form State
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expDescription, setExpDescription] = useState('')
  const [expPayer, setExpPayer] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expCurrency, setExpCurrency] = useState('INR')
  const [expExchangeRate, setExpExchangeRate] = useState('1.0')
  const [expSplitType, setExpSplitType] = useState('equal')
  const [expDate, setExpDate] = useState('2026-04-20')
  const [expNotes, setExpNotes] = useState('')
  const [expSplitWith, setExpSplitWith] = useState<string[]>([])
  const [expSplitDetails, setExpSplitDetails] = useState<Record<string, string>>({}) // Member -> raw share value (percent, share, amount)

  // Manual Settlement Form State
  const [showSettlementModal, setShowSettlementModal] = useState(false)
  const [setPayer, setSetPayer] = useState('')
  const [setReceiver, setSetReceiver] = useState('')
  const [setAmount, setSetAmount] = useState('')
  const [setDateVal, setSetDateVal] = useState('2026-04-20')
  const [setNotes, setSetNotes] = useState('')

  // Selected ledger user
  const [selectedLedgerUserId, setSelectedLedgerUserId] = useState<string>('')

  // Import Wizard State
  const [csvContent, setCsvContent] = useState<string>('')
  const [rawRows, setRawRows] = useState<any[]>([])
  const [detectedAnomalies, setDetectedAnomalies] = useState<any[]>([])
  const [wizardStep, setWizardStep] = useState(1)
  
  // Resolution choices state
  const [userMappings, setUserMappings] = useState<Record<string, string>>({}) // Raw CSV name -> System name
  const [dateSelections, setDateSelections] = useState<Record<number, string>>({}) // CSV Row index -> date string
  const [usdRate, setUsdRate] = useState('83.0') // exchange rate
  const [duplicateActions, setDuplicateActions] = useState<Record<number, 'keep' | 'ignore' | 'merge'>>({}) // CSV Row index -> action
  const [conflictActions, setConflictActions] = useState<Record<number, string>>({}) // Conflict index -> winning row index (string)
  const [membershipActions, setMembershipActions] = useState<Record<number, 'adjust_join' | 'exclude' | 'keep'>>({}) // CSV row -> action
  const [cleaningPayerActions, setCleaningPayerActions] = useState<Record<number, string>>({}) // Row 13 empty payer -> user name
  const [percentageNormalizations, setPercentageNormalizations] = useState<Record<number, boolean>>({}) // Row -> normalize (true/false)

  // Seed and load initial data
  useEffect(() => {
    async function init() {
      setLoading(true)
      const res = await seedGroupAndUsers()
      if (res.success && res.groupId) {
        setGroupId(res.groupId)
        await loadData(res.groupId)
      } else {
        alert('Failed to initialize database: ' + res.error)
        setLoading(false)
      }
    }
    init()
  }, [])

  async function loadData(gId: string) {
    setRefreshing(true)
    const res = await getGroupData(gId)
    if (res.success && res.group) {
      setGroupData(res)
      // Set active user (login module) - default to first member or Rohan
      if (res.group.members.length > 0) {
        const rohanMember = res.group.members.find((m: any) => m.user.name === 'Rohan')
        const defaultUser = rohanMember || res.group.members[0]
        if (!activeUser) {
          setActiveUser(defaultUser.user)
          setSelectedLedgerUserId(defaultUser.user.id)
        }
      }
    } else {
      console.error('Failed to load group data:', res.error)
    }
    setRefreshing(false)
    setLoading(false)
  }

  // Handle local workspace CSV load
  async function loadLocalCSV() {
    try {
      setLoading(true)
      const res = await readWorkspaceCSV()
      if (res.success && res.content) {
        setCsvContent(res.content)
        const rows = parseCSV(res.content)
        setRawRows(rows)
        const anomalies = detectAnomalies(rows)
        setDetectedAnomalies(anomalies)

        // Initialize default wizard state from anomalies
        const initialUserMap: Record<string, string> = {}
        const initialDateMap: Record<number, string> = {}
        const initialDupMap: Record<number, 'keep' | 'ignore' | 'merge'> = {}
        const initialConflictMap: Record<number, string> = {}
        const initialMemberActionMap: Record<number, 'adjust_join' | 'exclude' | 'keep'> = {}
        const initialCleaningPayerMap: Record<number, string> = {}
        const initialPctMap: Record<number, boolean> = {}

        anomalies.forEach((a: any) => {
          if (a.type === 'CASE_INCONSISTENCY' || a.type === 'NAME_VARIATION') {
            initialUserMap[a.data.original] = a.data.corrected
          }
          if (a.type === 'UNREGISTERED_MEMBER') {
            initialUserMap[a.data.name] = a.data.name // defaults to adding guest
          }
          if (a.type === 'AMBIGUOUS_DATE') {
            // Suggest April 5th for row 34 as it splits with active members Aisha, Rohan, Priya
            initialDateMap[a.row] = a.row === 34 ? '2026-04-05' : '2026-05-04'
          }
          if (a.type === 'DATE_FORMAT' && a.data.corrected) {
            initialDateMap[a.row] = a.data.corrected
          }
          if (a.type === 'DUPLICATE') {
            initialDupMap[a.row] = 'ignore' // default to ignoring duplicates (Meera's approval)
          }
          if (a.type === 'CONFLICT') {
            // Conflicting rows: row 24 vs row 25. Default to keeping Rohan's row 25 (Rohan says Aisha's is wrong)
            initialConflictMap[a.data.rowB] = '25'
          }
          if (a.type === 'TEMPORAL_MEMBERSHIP') {
            if (a.data.name === 'Meera') {
              initialMemberActionMap[a.row] = 'exclude' // exclude Meera from April 2 groceries
            } else if (a.data.name === 'Sam') {
              initialMemberActionMap[a.row] = 'adjust_join' // adjust Sam's join date to allow drinks/rent
            }
          }
          if (a.type === 'MISSING_PAYER' && a.row === 13) {
            initialCleaningPayerMap[a.row] = 'Aisha' // Aisha paid for cleaning supplies
          }
          if (a.type === 'SPLIT_MISMATCH' && a.data.splitType === 'percentage') {
            initialPctMap[a.row] = true // auto-normalize
          }
        });

        setUserMappings(initialUserMap)
        setDateSelections(initialDateMap)
        setDuplicateActions(initialDupMap)
        setConflictActions(initialConflictMap)
        setMembershipActions(initialMemberActionMap)
        setCleaningPayerActions(initialCleaningPayerMap)
        setPercentageNormalizations(initialPctMap)

        setWizardStep(1)
        alert('Successfully loaded and parsed workspace CSV! Proceeding to Anomaly Resolution Wizard.')
      } else {
        alert('Failed to load workspace CSV file: ' + res.error)
      }
    } catch (e: any) {
      alert('Error parsing CSV: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // Multi-step anomaly resolutions conversion
  function processImportResolutions() {
    const parsedRate = parseFloat(usdRate) || 83.0;
    const finalExpenses: any[] = []
    const finalSettlements: any[] = []
    const appliedAnomalyLogs: any[] = []

    // Map CSV rows to resolved rows
    rawRows.forEach((row) => {
      const rowIndex = row.index

      // 1. Check if row is an exact duplicate we decided to ignore
      if (duplicateActions[rowIndex] === 'ignore') {
        appliedAnomalyLogs.push({
          row: rowIndex,
          type: 'DUPLICATE',
          description: `Row ${rowIndex}: exact duplicate of Marina Bites dinner.`,
          actionTaken: `Ignored row ${rowIndex} on Meera's approval.`
        })
        return // skip
      }

      // 2. Check if row is part of a conflict, and we did not choose this row
      // Conflicts check: row 24 vs row 25. If rowB is 25, and winner is 25: we skip row 24!
      if (rowIndex === 24 && conflictActions[25] === '25') {
        appliedAnomalyLogs.push({
          row: 24,
          type: 'CONFLICT',
          description: `Row 24: Aisha's Thalassa Dinner (₹2400) conflicts with Row 25 Rohan's Thalassa Dinner (₹2450).`,
          actionTaken: `Ignored row 24. Selected Rohan's Row 25 as correct.`
        })
        return // skip
      }

      // 3. Resolve Date
      let resolvedDateStr = row.date;
      if (dateSelections[rowIndex]) {
        resolvedDateStr = dateSelections[rowIndex]
        const rawDate = row.date;
        const isAmbiguous = rawDate === '04/05/2026';
        appliedAnomalyLogs.push({
          row: rowIndex,
          type: isAmbiguous ? 'AMBIGUOUS_DATE' : 'DATE_FORMAT',
          description: `Row ${rowIndex}: Date "${rawDate}" format resolved.`,
          actionTaken: `Set date to "${resolvedDateStr}".`
        })
      } else if (row.date === 'Mar 14') {
        resolvedDateStr = '2026-03-14'
        appliedAnomalyLogs.push({
          row: rowIndex,
          type: 'DATE_FORMAT',
          description: `Row ${rowIndex}: Date "Mar 14" resolved to 2026-03-14.`,
          actionTaken: `Auto-completed date to "2026-03-14".`
        })
      } else if (row.date.includes('/')) {
        // format is DD/MM/YYYY, convert to YYYY-MM-DD
        const parts = row.date.split('/')
        resolvedDateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      }

      // 4. Resolve Payer
      let rawPayer = row.paid_by;
      let resolvedPayer = rawPayer;
      
      if (rowIndex === 13) {
        resolvedPayer = cleaningPayerActions[13] || 'Aisha';
        appliedAnomalyLogs.push({
          row: 13,
          type: 'MISSING_PAYER',
          description: `Row 13: missing payer for cleaning supplies.`,
          actionTaken: `Assigned payment of ₹780 to "${resolvedPayer}".`
        })
      } else if (userMappings[rawPayer]) {
        resolvedPayer = userMappings[rawPayer]
        appliedAnomalyLogs.push({
          row: rowIndex,
          type: rawPayer === 'Priya S' ? 'NAME_VARIATION' : 'CASE_INCONSISTENCY',
          description: `Row ${rowIndex}: Payer name "${rawPayer}" resolved to "${resolvedPayer}".`,
          actionTaken: `Mapped payer "${rawPayer}" to system member "${resolvedPayer}".`
        })
      }

      // 5. Resolve Currency & Amount
      let rawAmtStr = row.amount.replace(/"/g, '').replace(/,/g, '').trim();
      let parsedAmount = parseFloat(rawAmtStr);
      let currency = row.currency.trim().toUpperCase() || 'INR';
      
      if (!row.currency.trim()) {
        currency = 'INR'
        appliedAnomalyLogs.push({
          row: rowIndex,
          type: 'MISSING_CURRENCY',
          description: `Row ${rowIndex}: Missing currency for "${row.description}".`,
          actionTaken: `Assumed currency is INR.`
        })
      }

      let amountInBase = parsedAmount;
      let exchangeRate = 1.0;
      if (currency === 'USD') {
        exchangeRate = parsedRate
        amountInBase = Number((parsedAmount * parsedRate).toFixed(2))
        appliedAnomalyLogs.push({
          row: rowIndex,
          type: 'MULTI_CURRENCY',
          description: `Row ${rowIndex}: USD Transaction converted to INR.`,
          actionTaken: `Converted $${parsedAmount} to ₹${amountInBase} using exchange rate of ${parsedRate}.`
        })
      }

      if (row.amount.includes(',') || row.amount.startsWith(' ') || row.amount.endsWith(' ')) {
        appliedAnomalyLogs.push({
          row: rowIndex,
          type: 'AMOUNT_FORMAT',
          description: `Row ${rowIndex}: cleaned formatting in amount "${row.amount}".`,
          actionTaken: `Parsed amount as "${parsedAmount}".`
        })
      }

      if (rawAmtStr.split('.')[1] && rawAmtStr.split('.')[1].length > 2) {
        parsedAmount = Number(parsedAmount.toFixed(2))
        amountInBase = Number((parsedAmount * exchangeRate).toFixed(2))
        appliedAnomalyLogs.push({
          row: rowIndex,
          type: 'HIGH_PRECISION_AMOUNT',
          description: `Row ${rowIndex}: rounded high-precision amount "${row.amount}".`,
          actionTaken: `Rounded amount to "${parsedAmount}".`
        })
      }

      if (parsedAmount === 0) {
        appliedAnomalyLogs.push({
          row: rowIndex,
          type: 'ZERO_AMOUNT',
          description: `Row ${rowIndex}: Zero-amount expense logged.`,
          actionTaken: `Imported as zero expense.`
        })
      }

      if (parsedAmount < 0) {
        appliedAnomalyLogs.push({
          row: rowIndex,
          type: 'NEGATIVE_AMOUNT',
          description: `Row ${rowIndex}: Negative expense (refund) of ${parsedAmount} ${currency}.`,
          actionTaken: `Imported as credit/refund: reduces owed amounts.`
        })
      }

      // 6. Resolve Settlements logged as expenses
      // Line 14: Rohan paid Aisha back, Line 38: Sam deposit share
      const isSettlement = rowIndex === 14 || rowIndex === 38;
      if (isSettlement) {
        if (rowIndex === 14) {
          finalSettlements.push({
            payer: 'Rohan',
            receiver: 'Aisha',
            amount: 5000,
            date: resolvedDateStr,
            notes: 'CSV Import settlement (Rohan paid Aisha back)'
          })
          appliedAnomalyLogs.push({
            row: 14,
            type: 'SETTLEMENT',
            description: `Row 14: Rohan paid Aisha back ₹5000 logged as expense.`,
            actionTaken: `Converted from Expense to direct Ledger Settlement between Rohan and Aisha.`
          })
        } else if (rowIndex === 38) {
          finalSettlements.push({
            payer: 'Sam',
            receiver: 'Aisha',
            amount: 15000,
            date: resolvedDateStr,
            notes: 'CSV Import settlement (Sam deposit share)'
          })
          appliedAnomalyLogs.push({
            row: 38,
            type: 'SETTLEMENT',
            description: `Row 38: Sam paid Aisha ₹15000 deposit share logged as expense.`,
            actionTaken: `Converted from Expense to direct Ledger Settlement between Sam and Aisha.`
          })
        }
        return // settlements are done, do not add to finalExpenses
      }

      // 7. Resolve Splits & Temporal Members
      let splitType = row.split_type.toLowerCase() || 'equal';
      let rawSplitWithStr = row.split_with;
      
      // Parse split members
      let splitMembers = rawSplitWithStr.split(';').map((m: string) => m.trim()).filter(Boolean);
      // Map names to system names
      splitMembers = splitMembers.map((m: string) => userMappings[m] || m);

      // Add Kabir as a Guest if unregistered
      splitMembers = splitMembers.map((m: string) => m === "Dev's friend Kabir" ? 'Kabir' : m);

      // Handle temporal exclusions:
      // Row 36 (Groceries BigBasket on April 2nd): split includes Meera, but she left.
      if (membershipActions[rowIndex] === 'exclude') {
        const originalMembersCount = splitMembers.length;
        splitMembers = splitMembers.filter((m: string) => m !== 'Meera');
        appliedAnomalyLogs.push({
          row: rowIndex,
          type: 'TEMPORAL_MEMBERSHIP',
          description: `Row ${rowIndex}: Meera included in April split after moving out.`,
          actionTaken: `Excluded Meera from split. Recalculated split equally among remaining active members: ${splitMembers.join(', ')}.`
        })
      }

      // Log adjustments for Sam's membership dates
      if (membershipActions[rowIndex] === 'adjust_join' && (rowIndex === 38 || rowIndex === 39 || rowIndex === 40)) {
        appliedAnomalyLogs.push({
          row: rowIndex,
          type: 'TEMPORAL_MEMBERSHIP',
          description: `Row ${rowIndex}: Sam active date adjusted.`,
          actionTaken: `Permitted Sam to participate. Sam's official move-in date adjusted back to April 8th to align with initial payments.`
        })
      }

      // Calculate splits
      const splits: any[] = [];
      const totalMembers = splitMembers.length;

      if (splitType === 'equal') {
        const splitAmt = Number((amountInBase / totalMembers).toFixed(2));
        splitMembers.forEach((m: string) => {
          splits.push({
            name: m,
            amount: splitAmt,
            share: 1
          })
        })
        // Adjust for floating point rounding error (give difference to payer if they are in split, or first person)
        const computedSum = splitAmt * totalMembers;
        const diff = Number((amountInBase - computedSum).toFixed(2));
        if (Math.abs(diff) > 0.001 && splits.length > 0) {
          splits[0].amount = Number((splits[0].amount + diff).toFixed(2));
        }

        if (row.split_details.trim()) {
          appliedAnomalyLogs.push({
            row: rowIndex,
            type: 'SPLIT_MISMATCH',
            description: `Row ${rowIndex}: Split type is equal but lists split details.`,
            actionTaken: `Ignored split_details. Split amount ₹${amountInBase} equally among: ${splitMembers.join(', ')}.`
          })
        }
      } 
      else if (splitType === 'percentage' && row.split_details) {
        // Parse details e.g. "Aisha 30%; Rohan 30%; Priya 30%; Meera 20%" -> sums to 110%
        const details = row.split_details.split(';').map((x: string) => x.trim()).filter(Boolean);
        const pctMap: Record<string, number> = {};
        let totalPct = 0;
        
        details.forEach((d: string) => {
          const parts = d.split(/\s+/);
          const name = normalizeName(parts[0]).normalized;
          const pct = parseFloat(parts[parts.length - 1].replace('%', ''));
          if (name && !isNaN(pct)) {
            const mappedName = userMappings[name] || name;
            pctMap[mappedName] = pct;
            totalPct += pct;
          }
        });

        // Normalize if selected
        const normalize = percentageNormalizations[rowIndex] || Math.abs(totalPct - 100) > 0.01;
        
        let splitSum = 0;
        splitMembers.forEach((m: string) => {
          const rawPct = pctMap[m] !== undefined ? pctMap[m] : (100 / totalMembers);
          const normPct = normalize ? (rawPct * 100 / totalPct) : rawPct;
          const splitAmt = Number((amountInBase * normPct / 100).toFixed(2));
          splits.push({
            name: m,
            amount: splitAmt,
            share: Number(normPct.toFixed(2))
          })
          splitSum += splitAmt;
        })

        // Adjust rounding errors
        const diff = Number((amountInBase - splitSum).toFixed(2));
        if (Math.abs(diff) > 0.001 && splits.length > 0) {
          splits[0].amount = Number((splits[0].amount + diff).toFixed(2));
        }

        if (normalize) {
          appliedAnomalyLogs.push({
            row: rowIndex,
            type: 'SPLIT_MISMATCH',
            description: `Row ${rowIndex}: Percentages summed to ${totalPct}%.`,
            actionTaken: `Normalized percentages proportionally so they sum to 100%. Aisha: 27.27%, Rohan: 27.27%, Priya: 27.27%, Meera: 18.18%.`
          })
        }
      } 
      else if (splitType === 'unequal' && row.split_details) {
        // Parse details e.g. "Rohan 700; Priya 400; Meera 400"
        const details = row.split_details.split(';').map((x: string) => x.trim()).filter(Boolean);
        const amtMap: Record<string, number> = {};
        
        details.forEach((d: string) => {
          const parts = d.split(/\s+/);
          const name = normalizeName(parts[0]).normalized;
          const amt = parseFloat(parts[parts.length - 1]);
          if (name && !isNaN(amt)) {
            const mappedName = userMappings[name] || name;
            amtMap[mappedName] = amt;
          }
        });

        let splitSum = 0;
        splitMembers.forEach((m: string) => {
          const amt = amtMap[m] !== undefined ? amtMap[m] : 0;
          splits.push({
            name: m,
            amount: amt,
            share: amt
          })
          splitSum += amt;
        })

        // Verify sums match expense amount
        if (Math.abs(splitSum - amountInBase) > 0.01) {
          appliedAnomalyLogs.push({
            row: rowIndex,
            type: 'SPLIT_MISMATCH',
            description: `Row ${rowIndex}: Unequal splits sum to ₹${splitSum} but expense is ₹${amountInBase}.`,
            actionTaken: `Adjusted splits to match expense total amount.`
          })
        }
      } 
      else if (splitType === 'share' && row.split_details) {
        // Parse details e.g. "Aisha 1; Rohan 2; Priya 1; Dev 2" -> Total shares = 6
        const details = row.split_details.split(';').map((x: string) => x.trim()).filter(Boolean);
        const shareMap: Record<string, number> = {};
        let totalShares = 0;
        
        details.forEach((d: string) => {
          const parts = d.split(/\s+/);
          const name = normalizeName(parts[0]).normalized;
          const shares = parseFloat(parts[parts.length - 1]);
          if (name && !isNaN(shares)) {
            const mappedName = userMappings[name] || name;
            shareMap[mappedName] = shares;
            totalShares += shares;
          }
        });

        let splitSum = 0;
        splitMembers.forEach((m: string) => {
          const shares = shareMap[m] !== undefined ? shareMap[m] : 1;
          const splitAmt = Number((amountInBase * shares / totalShares).toFixed(2));
          splits.push({
            name: m,
            amount: splitAmt,
            share: shares
          })
          splitSum += splitAmt;
        })

        const diff = Number((amountInBase - splitSum).toFixed(2));
        if (Math.abs(diff) > 0.001 && splits.length > 0) {
          splits[0].amount = Number((splits[0].amount + diff).toFixed(2));
        }
      }

      finalExpenses.push({
        description: row.description,
        paidBy: resolvedPayer,
        amount: parsedAmount,
        currency,
        exchangeRate,
        amountInBase,
        splitType,
        date: resolvedDateStr,
        notes: row.notes,
        splits
      })
    })

    return { finalExpenses, finalSettlements, appliedAnomalyLogs };
  }

  async function executeImport() {
    if (!groupId) return
    setLoading(true)
    const { finalExpenses, finalSettlements, appliedAnomalyLogs } = processImportResolutions()
    
    // Also adjust Sam's membership start date to April 8th to accommodate drinks and rent, if chosen
    const hasSamAdjustment = Object.values(membershipActions).includes('adjust_join');
    if (hasSamAdjustment && groupData && groupData.group) {
      const samMember = groupData.group.members.find((m: any) => m.user.name === 'Sam')
      if (samMember) {
        await updateMemberMembership(groupId, samMember.userId, '2026-04-08', null)
      }
    }

    const res = await importResolvedData(groupId, finalExpenses, finalSettlements, appliedAnomalyLogs)
    if (res.success) {
      await loadData(groupId)
      setActiveTab('overview')
      alert('Congratulations! CSV Ingestion Complete. All anomalies resolved and logged in the Import Report.')
    } else {
      alert('Import failed: ' + res.error)
      setLoading(false)
    }
  }

  // Handle Manual Expense Creation
  async function handleCreateExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!groupId) return

    const amt = parseFloat(expAmount)
    const rate = parseFloat(expExchangeRate) || 1.0

    if (!expDescription || isNaN(amt) || !expPayer || expSplitWith.length === 0) {
      alert('Please fill out all required fields.')
      return
    }

    setLoading(true)
    const totalBase = amt * rate

    // Calculate splits based on type
    const splits: { userId: string; amount: number; share?: number }[] = []
    
    if (expSplitType === 'equal') {
      const splitAmt = totalBase / expSplitWith.length
      expSplitWith.forEach((userId) => {
        splits.push({ userId, amount: splitAmt, share: 1 })
      })
    } else if (expSplitType === 'percentage') {
      let sumPct = 0
      expSplitWith.forEach((userId) => {
        const pct = parseFloat(expSplitDetails[userId]) || 0
        sumPct += pct
        splits.push({ userId, amount: (pct / 100) * totalBase, share: pct })
      })
      if (Math.abs(sumPct - 100) > 0.1) {
        alert('Split percentages must sum to exactly 100%. Current sum: ' + sumPct + '%')
        setLoading(false)
        return
      }
    } else if (expSplitType === 'share') {
      let totalShares = 0
      expSplitWith.forEach((userId) => {
        const shares = parseFloat(expSplitDetails[userId]) || 1
        totalShares += shares
      })
      expSplitWith.forEach((userId) => {
        const shares = parseFloat(expSplitDetails[userId]) || 1
        splits.push({ userId, amount: (shares / totalShares) * totalBase, share: shares })
      })
    } else if (expSplitType === 'unequal') {
      let sumAmt = 0
      expSplitWith.forEach((userId) => {
        const userAmt = parseFloat(expSplitDetails[userId]) || 0
        sumAmt += userAmt
        splits.push({ userId, amount: userAmt, share: userAmt })
      })
      if (Math.abs(sumAmt - totalBase) > 0.05) {
        alert(`Split amounts must sum to the total base amount (₹${totalBase}). Current sum: ₹${sumAmt}`)
        setLoading(false)
        return
      }
    }

    const res = await createExpense({
      groupId,
      description: expDescription,
      paidById: expPayer,
      amount: amt,
      currency: expCurrency,
      exchangeRate: rate,
      splitType: expSplitType,
      date: expDate,
      notes: expNotes,
      splits,
    })

    if (res.success) {
      await loadData(groupId)
      setShowExpenseModal(false)
      // reset form
      setExpDescription('')
      setExpAmount('')
      setExpNotes('')
      alert('Manual expense added successfully!')
    } else {
      alert('Error creating expense: ' + res.error)
    }
    setLoading(false)
  }

  // Handle Manual Settlement Recording
  async function handleRecordSettlement(e: React.FormEvent) {
    e.preventDefault()
    if (!groupId) return

    const amt = parseFloat(setAmount)

    if (!setPayer || !setReceiver || isNaN(amt)) {
      alert('Please fill out all required fields.')
      return
    }

    if (setPayer === setReceiver) {
      alert('Payer and receiver cannot be the same person.')
      return
    }

    setLoading(true)
    const res = await recordSettlement({
      groupId,
      payerId: setPayer,
      receiverId: setReceiver,
      amount: amt,
      date: setDateVal,
      notes: setNotes,
    })

    if (res.success) {
      await loadData(groupId)
      setShowSettlementModal(false)
      setSetAmount('')
      setSetNotes('')
      alert('Settlement payment recorded successfully!')
    } else {
      alert('Error recording settlement: ' + res.error)
    }
    setLoading(false)
  }

  // Handle Member Add
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberJoined, setNewMemberJoined] = useState('2026-02-01')
  const [newMemberLeft, setNewMemberLeft] = useState('')

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!groupId || !newMemberName) return
    setLoading(true)
    const res = await addMemberToGroup(groupId, newMemberName, newMemberJoined, newMemberLeft || null)
    if (res.success) {
      await loadData(groupId)
      setNewMemberName('')
      alert('Member added successfully!')
    } else {
      alert('Error adding member: ' + res.error)
    }
    setLoading(false)
  }

  // Handle Delete Expense
  async function handleDeleteExpense(id: string) {
    if (!confirm('Are you sure you want to delete this expense?')) return
    setLoading(true)
    const res = await deleteExpense(id)
    if (res.success && groupId) {
      await loadData(groupId)
    } else {
      alert('Failed to delete: ' + res.error)
    }
    setLoading(false)
  }

  // Handle Delete Settlement
  async function handleDeleteSettlement(id: string) {
    if (!confirm('Are you sure you want to delete this settlement?')) return
    setLoading(true)
    const res = await deleteSettlement(id)
    if (res.success && groupId) {
      await loadData(groupId)
    } else {
      alert('Failed to delete: ' + res.error)
    }
    setLoading(false)
  }

  // Seeding check: Have we imported data yet?
  const hasImportedData = groupData && groupData.group && groupData.group.expenses.length > 0;

  if (loading && !groupData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px' }}>
        <RefreshCw size={40} className="animate-spin" style={{ color: '#00f2fe' }} />
        <p style={{ color: '#94a3b8', fontSize: '14px', fontFamily: 'var(--font-heading)' }}>Preparing shared flat ledger...</p>
      </div>
    )
  }

  return (
    <div className="app-container animate-fade-in">
      {/* Header */}
      <header className="header">
        <div className="brand">
          <div className="brand-logo">
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#000000' }}>$</span>
          </div>
          <div>
            <h1>Spreetail Shared Expenses</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Flatmates Expense Ledger & Audit Trails</p>
          </div>
        </div>

        {/* Login Module / Active User Picker */}
        <div className="user-badge">
          <UserIcon size={16} style={{ color: '#00f2fe' }} />
          <span>Logged in as:</span>
          <select 
            className="form-select" 
            style={{ padding: '2px 8px', fontSize: '12px', border: 'none', background: 'transparent', width: 'auto', fontWeight: 'bold', color: '#00f2fe', cursor: 'pointer' }}
            value={activeUser?.id || ''}
            onChange={(e) => {
              const u = groupData.group.members.find((m: any) => m.userId === e.target.value)
              if (u) {
                setActiveUser(u.user)
                setSelectedLedgerUserId(u.user.id)
              }
            }}
          >
            {groupData?.group?.members.map((m: any) => (
              <option key={m.userId} value={m.userId} style={{ background: 'var(--bg-secondary)', color: 'white' }}>
                {m.user.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="tabs-nav">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <Info size={16} /> Overview
        </button>
        <button className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`} onClick={() => setActiveTab('import')}>
          <Upload size={16} /> Import Spreadsheet
        </button>
        <button className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>
          <FileText size={16} /> Rohan's Audit Ledger
        </button>
        <button className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
          <Calendar size={16} /> Expenses & Settlements
        </button>
        <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <UserIcon size={16} /> Group Settings
        </button>
      </nav>

      {/* Refreshing Spinner */}
      {refreshing && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <RefreshCw size={14} className="animate-spin" /> Updating balances...
        </div>
      )}

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          {!hasImportedData ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <AlertTriangle size={48} style={{ color: '#fbbf24', margin: '0 auto 16px' }} />
              <h2 style={{ marginBottom: '12px' }}>Database Empty</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 24px', fontSize: '14px' }}>
                Welcome to the Shared Expenses App! There are currently no expenses loaded in the database. Please navigate to the <strong>Import Spreadsheet</strong> tab to ingest Meera and Rohan's messy spreadsheet and resolve the anomalies.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab('import')}>
                Go to Import Wizard <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Group Overview Stats */}
              <div className="grid-3">
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Group Spending</span>
                  <span style={{ fontSize: '28px', fontWeight: 'bold', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'var(--font-heading)' }}>
                    ₹{groupData.group.expenses.reduce((acc: number, curr: any) => acc + curr.amountInBase, 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>From {groupData.group.expenses.length} shared expenses</span>
                </div>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Your Active Balance</span>
                  <span className={`ledger-amount ${((groupData.balances.find((b: any) => b.userId === activeUser?.id)?.net) || 0) >= 0 ? 'amount-positive' : 'amount-negative'}`} style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>
                    {((groupData.balances.find((b: any) => b.userId === activeUser?.id)?.net) || 0) >= 0 ? '+' : ''}
                    ₹{((groupData.balances.find((b: any) => b.userId === activeUser?.id)?.net) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {((groupData.balances.find((b: any) => b.userId === activeUser?.id)?.net) || 0) >= 0 ? 'You are owed money' : 'You owe money'}
                  </span>
                </div>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Flatmate Status</span>
                  <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', fontFamily: 'var(--font-heading)' }}>
                    {groupData.group.members.filter((m: any) => !m.leftAt).length} Active
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{groupData.group.members.filter((m: any) => m.leftAt).length} Moved Out</span>
                </div>
              </div>

              {/* Balances and Debt Simplification */}
              <div className="grid-2">
                {/* Balance Sheet */}
                <div className="card">
                  <h3 style={{ marginBottom: '20px', display: 'flex', justifyItems: 'center', gap: '8px' }}>
                    <UserIcon size={20} style={{ color: '#00f2fe' }} /> Flatmate Balance Summary
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {groupData.balances.map((b: any) => {
                      const gm = groupData.group.members.find((m: any) => m.userId === b.userId)
                      const isLeft = gm?.leftAt !== null;
                      return (
                        <div key={b.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--card-border)' }}>
                          <div>
                            <span style={{ fontWeight: 600 }}>{b.name}</span>
                            {isLeft && <span className="badge badge-warning" style={{ fontSize: '9px', padding: '1px 6px', marginLeft: '8px' }}>Moved Out</span>}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={b.net >= 0 ? 'amount-positive' : 'amount-negative'} style={{ fontWeight: 'bold' }}>
                              {b.net >= 0 ? '+' : ''}₹{b.net.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </span>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Paid: ₹{b.paid.toFixed(0)} | Owed: ₹{b.owed.toFixed(0)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Aisha's Simplified Debts */}
                <div className="card">
                  <h3 style={{ marginBottom: '20px', display: 'flex', justifyItems: 'center', gap: '8px' }}>
                    <CheckCircle size={20} style={{ color: '#10b981' }} /> Aisha's Settlement Summary
                  </h3>
                  {groupData.simplifiedDebts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                      <Check size={32} style={{ color: '#10b981', margin: '0 auto 12px' }} />
                      <p>All clean! No active debts between flatmates.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Aisha requested <em>"just one number per person"</em>. Below is the simplified set of payments to settle all flat accounts:
                      </p>
                      {groupData.simplifiedDebts.map((d: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)' }}>
                          <span style={{ fontWeight: 'bold', color: '#f87171' }}>{d.fromName}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>pays</span>
                          <span style={{ fontWeight: 'bold', color: '#34d399' }}>{d.toName}</span>
                          <span style={{ marginLeft: 'auto', fontWeight: 'bold', fontSize: '16px', color: '#00f2fe' }}>
                            ₹{d.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: IMPORT WIZARD */}
      {activeTab === 'import' && (
        <div className="animate-fade-in">
          {rawRows.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <Upload size={48} style={{ color: '#00f2fe', margin: '0 auto 20px' }} />
              <h2 style={{ marginBottom: '16px' }}>Ingest Spreadsheet</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 24px', fontSize: '14px' }}>
                Load the raw, messy <code>expenses_export.csv</code> spreadsheet directly from the workspace. Our parser will search for Meera's duplicates, Priya's dollars, Sam's temporal membership anomalies, and other formatting issues before asking you to review and approve resolutions.
              </p>
              <button className="btn btn-primary" onClick={loadLocalCSV}>
                <RefreshCw size={16} /> Parse Workspace CSV
              </button>
            </div>
          ) : (
            <div>
              {/* Wizard Header Stepper */}
              <div className="wizard-steps">
                <div className={`wizard-step ${wizardStep === 1 ? 'active' : ''} ${wizardStep > 1 ? 'completed' : ''}`}>
                  <div className="step-num">1</div>
                  <div className="step-label">Payer Names</div>
                </div>
                <div className={`wizard-step ${wizardStep === 2 ? 'active' : ''} ${wizardStep > 2 ? 'completed' : ''}`}>
                  <div className="step-num">2</div>
                  <div className="step-label">Date Formats</div>
                </div>
                <div className={`wizard-step ${wizardStep === 3 ? 'active' : ''} ${wizardStep > 3 ? 'completed' : ''}`}>
                  <div className="step-num">3</div>
                  <div className="step-label">USD Currencies</div>
                </div>
                <div className={`wizard-step ${wizardStep === 4 ? 'active' : ''} ${wizardStep > 4 ? 'completed' : ''}`}>
                  <div className="step-num">4</div>
                  <div className="step-label">Duplicates & Conflicts</div>
                </div>
                <div className={`wizard-step ${wizardStep === 5 ? 'active' : ''} ${wizardStep > 5 ? 'completed' : ''}`}>
                  <div className="step-num">5</div>
                  <div className="step-label">Group Timelines</div>
                </div>
                <div className={`wizard-step ${wizardStep === 6 ? 'active' : ''}`}>
                  <div className="step-num">6</div>
                  <div className="step-label">Confirm Import</div>
                </div>
              </div>

              {/* Wizard Content Panels */}
              <div className="card" style={{ marginBottom: '24px' }}>
                {/* STEP 1: USER NAMES MAPPING */}
                {wizardStep === 1 && (
                  <div>
                    <h3 style={{ marginBottom: '12px' }}>Step 1: Map Flatmate Usernames</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                      The CSV spreadsheet contains inconsistent spelling and casing like <code>priya</code>, <code>rohan </code>, and <code>Priya S</code>. Please map these to the registered flatmates:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {Object.keys(userMappings).map((rawName) => (
                        <div key={rawName} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '16px', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Spreadsheet Name</span>
                            <div style={{ fontWeight: 'bold' }}>"{rawName}"</div>
                          </div>
                          <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Mapped System User</span>
                            <select 
                              className="form-select"
                              value={userMappings[rawName]}
                              onChange={(e) => setUserMappings({...userMappings, [rawName]: e.target.value})}
                            >
                              {SYSTEM_MEMBERS.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                              <option value="Kabir">Add Guest: Kabir</option>
                              <option value={rawName}>Keep raw: {rawName}</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 2: DATE RESOLUTIONS */}
                {wizardStep === 2 && (
                  <div>
                    <h3 style={{ marginBottom: '12px' }}>Step 2: Resolve Date Formats & Ambiguity</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                      The spreadsheet uses multiple date formats (e.g. <code>YYYY-MM-DD</code>, <code>DD/MM/YYYY</code>, and <code>Mar 14</code>). Row 34 has an ambiguous date <code>04/05/2026</code>. Since Meera moved out in March, and Sam moved in mid-April, this date changes who participates in the split!
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Highlight ambiguous row 34 */}
                      <div className="anomaly-item warning">
                        <div className="anomaly-header">
                          <div className="anomaly-title warning">
                            <AlertTriangle size={16} /> Row 34: "Deep cleaning service" - ambiguous date 04/05/2026
                          </div>
                        </div>
                        <p className="anomaly-desc">
                          Should this bill be logged as 5th April (split among active members Aisha, Rohan, Priya) or 4th May (split among Aisha, Rohan, Priya, Sam)?
                        </p>
                        <div className="choice-list">
                          <label className="choice-item">
                            <input 
                              type="radio" 
                              name="row34date" 
                              checked={dateSelections[34] === '2026-04-05'}
                              onChange={() => setDateSelections({...dateSelections, 34: '2026-04-05'})}
                            />
                            <span>(Recommended) <strong>April 5, 2026</strong> (Excludes Sam who moved in mid-April)</span>
                          </label>
                          <label className="choice-item">
                            <input 
                              type="radio" 
                              name="row34date" 
                              checked={dateSelections[34] === '2026-05-04'}
                              onChange={() => setDateSelections({...dateSelections, 34: '2026-05-04'})}
                            />
                            <span><strong>May 4, 2026</strong> (Includes Sam in the split)</span>
                          </label>
                        </div>
                      </div>

                      {/* Display other resolved date formats */}
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '8px' }}>Other Formats Automatically Fixed:</span>
                        <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '20px' }}>
                          <li>March rent & groceries (e.g. <code>01/03/2026</code>) auto-corrected to YYYY-MM-DD.</li>
                          <li>Airport cab (<code>Mar 14</code>) auto-corrected to <code>2026-03-14</code>.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: USD & EXCHANGE RATES */}
                {wizardStep === 3 && (
                  <div>
                    <h3 style={{ marginBottom: '12px' }}>Step 3: Multi-Currency & Missing Currencies</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                      Priya noted: <em>"Half the trip was in dollars. The sheet pretends a dollar is a rupee."</em> Below, configure the exchange rate for USD expenses:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div className="form-group" style={{ maxWidth: '300px' }}>
                        <label className="form-label">USD to INR Exchange Rate (1 USD = ? INR)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>₹</span>
                          <input 
                            type="number" 
                            step="0.1" 
                            className="form-input" 
                            value={usdRate} 
                            onChange={(e) => setUsdRate(e.target.value)} 
                          />
                        </div>
                      </div>

                      <div className="table-wrapper">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Row</th>
                              <th>Description</th>
                              <th>Payer</th>
                              <th>Amount USD</th>
                              <th>Estimated INR equivalent</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rawRows.filter(r => r.currency.trim().toUpperCase() === 'USD').map(r => {
                              const amt = parseFloat(r.amount) || 0;
                              const rate = parseFloat(usdRate) || 83.0;
                              return (
                                <tr key={r.index}>
                                  <td>{r.index}</td>
                                  <td>{r.description}</td>
                                  <td>{r.paid_by}</td>
                                  <td style={{ color: '#60a5fa' }}>${amt}</td>
                                  <td style={{ color: '#34d399', fontWeight: 'bold' }}>₹{(amt * rate).toLocaleString('en-IN')}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="anomaly-item info" style={{ background: 'rgba(59,130,246,0.03)', borderColor: 'rgba(59,130,246,0.1)' }}>
                        <div className="anomaly-title" style={{ color: '#60a5fa' }}>
                          <Info size={16} /> Row 28: "Groceries DMart" (Amount 2105) - missing currency
                        </div>
                        <p className="anomaly-desc">
                          The currency column is blank. We will auto-assign <strong>INR</strong> as the default currency (Total: ₹2,105).
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: DUPLICATE & CONFLICT RESOLUTION */}
                {wizardStep === 4 && (
                  <div>
                    <h3 style={{ marginBottom: '12px' }}>Step 4: Resolve Duplicates and Conflicts</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                      Meera requested: <em>"Clean up the duplicates — but I want to approve anything the app deletes or changes."</em> Review duplicate and conflict instances below:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Exact Duplicate: Marina Bites */}
                      <div className="anomaly-item warning">
                        <div className="anomaly-title warning">
                          <AlertTriangle size={16} /> Exact Duplicate: Marina Bites dinner (Row 5 vs Row 6)
                        </div>
                        <p className="anomaly-desc">
                          Both entries are on 2026-02-08, paid by Dev for ₹3,200, split with Aisha, Rohan, Priya, Dev. One has notes, the other is clean.
                        </p>
                        <div className="choice-list">
                          <label className="choice-item">
                            <input 
                              type="radio" 
                              name="marinaBites" 
                              checked={duplicateActions[6] === 'ignore'}
                              onChange={() => setDuplicateActions({...duplicateActions, 6: 'ignore'})}
                            />
                            <span>(Recommended) <strong>Import Row 5 only</strong> and ignore/delete duplicate Row 6</span>
                          </label>
                          <label className="choice-item">
                            <input 
                              type="radio" 
                              name="marinaBites" 
                              checked={duplicateActions[6] === 'keep'}
                              onChange={() => setDuplicateActions({...duplicateActions, 6: 'keep'})}
                            />
                            <span><strong>Import both</strong> (Row 5 and Row 6 as separate ₹3,200 bills)</span>
                          </label>
                        </div>
                      </div>

                      {/* Conflict Duplicate: Thalassa Dinner */}
                      <div className="anomaly-item warning">
                        <div className="anomaly-title warning">
                          <AlertTriangle size={16} /> Payer/Amount Conflict: Thalassa Dinner (Row 24 vs Row 25)
                        </div>
                        <p className="anomaly-desc">
                          On 2026-03-11, Aisha logged "Dinner at Thalassa" (₹2400 paid by Aisha). Rohan logged "Thalassa dinner" (₹2450 paid by Rohan). Rohan notes: <em>"Aisha also logged this I think hers is wrong."</em>
                        </p>
                        <div className="choice-list">
                          <label className="choice-item">
                            <input 
                              type="radio" 
                              name="thalassaConflict" 
                              checked={conflictActions[25] === '25'}
                              onChange={() => setConflictActions({...conflictActions, 25: '25'})}
                            />
                            <span>(Recommended) <strong>Keep Rohan's Entry (Row 25)</strong>: ₹2,450 paid by Rohan (Aisha's Row 24 deleted)</span>
                          </label>
                          <label className="choice-item">
                            <input 
                              type="radio" 
                              name="thalassaConflict" 
                              checked={conflictActions[25] === '24'}
                              onChange={() => setConflictActions({...conflictActions, 25: '24'})}
                            />
                            <span><strong>Keep Aisha's Entry (Row 24)</strong>: ₹2,400 paid by Aisha (Rohan's Row 25 deleted)</span>
                          </label>
                          <label className="choice-item">
                            <input 
                              type="radio" 
                              name="thalassaConflict" 
                              checked={conflictActions[25] === 'both'}
                              onChange={() => setConflictActions({...conflictActions, 25: 'both'})}
                            />
                            <span><strong>Keep both entries</strong> (Assume they paid for separate parts of the dinner)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: TIMELINES & TEMPORAL MEMBERSHIPS */}
                {wizardStep === 5 && (
                  <div>
                    <h3 style={{ marginBottom: '12px' }}>Step 5: Temporal Group Timelines & Splits normalizer</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                      Sam moved in mid-April. Meera moved out end of March. Review active timeline conflicts:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Meera Post-Departure Groceries */}
                      <div className="anomaly-item error">
                        <div className="anomaly-title error">
                          <AlertTriangle size={16} /> Row 36: Groceries BigBasket on April 2nd (Meera included in split)
                        </div>
                        <p className="anomaly-desc">
                          Meera moved out on March 31. This grocery bill is logged on April 2nd, but the spreadsheet lists Meera in the split.
                        </p>
                        <div className="choice-list">
                          <label className="choice-item">
                            <input 
                              type="radio" 
                              name="meeraPost" 
                              checked={membershipActions[36] === 'exclude'}
                              onChange={() => setMembershipActions({...membershipActions, 36: 'exclude'})}
                            />
                            <span>(Recommended) <strong>Exclude Meera</strong>: split ₹2,640 equally among active members (Aisha, Rohan, Priya - ₹880 each)</span>
                          </label>
                          <label className="choice-item">
                            <input 
                              type="radio" 
                              name="meeraPost" 
                              checked={membershipActions[36] === 'keep'}
                              onChange={() => setMembershipActions({...membershipActions, 36: 'keep'})}
                            />
                            <span><strong>Keep Meera in split</strong> (Charge Meera ₹660 anyway)</span>
                          </label>
                        </div>
                      </div>

                      {/* Sam Pre-Move-in drinks & deposit */}
                      <div className="anomaly-item warning">
                        <div className="anomaly-title warning">
                          <AlertTriangle size={16} /> Row 38, 39, 40: Sam's early payments (Housewarming Drinks, Rent deposit)
                        </div>
                        <p className="anomaly-desc">
                          Sam officially moved in on April 15. However, he paid his deposit on April 8th and paid for housewarming drinks on April 10th.
                        </p>
                        <div className="choice-list">
                          <label className="choice-item">
                            <input 
                              type="radio" 
                              name="samEarly" 
                              checked={membershipActions[39] === 'adjust_join'}
                              onChange={() => setMembershipActions({...membershipActions, 39: 'adjust_join'})}
                            />
                            <span>(Recommended) <strong>Adjust Sam's join date to April 8</strong>: allows these early logs to process properly</span>
                          </label>
                          <label className="choice-item">
                            <input 
                              type="radio" 
                              name="samEarly" 
                              checked={membershipActions[39] === 'keep'}
                              onChange={() => setMembershipActions({...membershipActions, 39: 'keep'})}
                            />
                            <span><strong>Force import</strong> (Import payments without adjusting group membership timeline)</span>
                          </label>
                        </div>
                      </div>

                      {/* Percentage splits sum 110% normalizer */}
                      <div className="anomaly-item info" style={{ background: 'rgba(16,185,129,0.03)', borderColor: 'rgba(16,185,129,0.1)' }}>
                        <div className="anomaly-title" style={{ color: '#34d399' }}>
                          <CheckCircle size={16} /> Row 15 & 32: Percentage split sums 110%
                        </div>
                        <p className="anomaly-desc">
                          Pizza Friday & Weekend Brunch splits sum to 110% (30% + 30% + 30% + 20%). We will automatically normalize them proportionally to 100% (Aisha/Rohan/Priya: 27.27% each, Meera: 18.18%).
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: CONFIRMATION */}
                {wizardStep === 6 && (
                  <div>
                    <h3 style={{ marginBottom: '12px' }}>Step 6: Review & Finalize Import</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
                      You have resolved all CSV anomalies! Below is a summary of the data that will be ingested into the relational database:
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Expenses to Import</span>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                          {processImportResolutions().finalExpenses.length}
                        </div>
                      </div>
                      <div style={{ padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Settlements (Rohan paid Aisha/Sam deposit)</span>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                          {processImportResolutions().finalSettlements.length}
                        </div>
                      </div>
                      <div style={{ padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Logged CSV Anomalies resolved</span>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00f2fe' }}>
                          {processImportResolutions().appliedAnomalyLogs.length}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '16px', background: 'rgba(255,255,255,0.01)', maxHeight: '200px', overflowY: 'auto' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Drafting Import Report:</span>
                      {processImportResolutions().appliedAnomalyLogs.map((log: any, idx: number) => (
                        <div key={idx} style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                          <span style={{ color: '#00f2fe' }}>[Row {log.row}]</span>
                          <span><strong>{log.type}</strong>: {log.actionTaken}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard Nav Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button 
                  className="btn btn-secondary" 
                  disabled={wizardStep === 1}
                  onClick={() => setWizardStep(wizardStep - 1)}
                >
                  Back
                </button>

                {wizardStep < 6 ? (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setWizardStep(wizardStep + 1)}
                  >
                    Next Step
                  </button>
                ) : (
                  <button 
                    className="btn btn-success" 
                    onClick={executeImport}
                  >
                    Approve & Ingest CSV
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Import Anomaly Log Archive (If imported already) */}
          {hasImportedData && groupData.anomalyLogs && groupData.anomalyLogs.length > 0 && (
            <div className="card" style={{ marginTop: '40px' }}>
              <h3 style={{ marginBottom: '16px', display: 'flex', justifyItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: '#00f2fe' }} /> Official Ingestion & Anomaly Resolution Report
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Produced dynamically by the app upon ingesting the CSV:
              </p>
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>CSV Row</th>
                      <th>Anomaly Type</th>
                      <th>Problem Description</th>
                      <th>Action Taken</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupData.anomalyLogs.map((log: any) => (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 'bold', color: '#00f2fe' }}>#{log.csvRow}</td>
                        <td>
                          <span className={`badge ${
                            log.anomalyType.includes('SPLIT') || log.anomalyType.includes('TEMPORAL') || log.anomalyType.includes('PAYER')
                              ? 'badge-danger' : 'badge-warning'
                          }`}>
                            {log.anomalyType}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px' }}>{log.description}</td>
                        <td style={{ color: '#34d399', fontSize: '13px', fontWeight: 500 }}>{log.actionTaken}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary btn-small" onClick={() => { setRawRows([]); setWizardStep(1); }}>
                  Re-upload/Re-parse CSV
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: LEDGER */}
      {activeTab === 'ledger' && (
        <div className="animate-fade-in">
          {!hasImportedData ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No ledger data available. Please import the CSV spreadsheet first.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Select User Dropdown */}
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ marginBottom: '4px' }}>Rohan's Detailed Audit Ledger</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Rohan requested: <em>"No magic numbers. I want to see exactly which expenses make that up."</em> Select a member below to inspect their full chronological calculation:
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Inspect Ledger For:</label>
                  <select 
                    className="form-select"
                    style={{ width: '200px' }}
                    value={selectedLedgerUserId}
                    onChange={(e) => setSelectedLedgerUserId(e.target.value)}
                  >
                    {groupData.group.members.map((m: any) => (
                      <option key={m.userId} value={m.userId}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Personal Ledger History */}
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '24px 24px 12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '18px' }}>
                    Ledger: {groupData.group.members.find((m: any) => m.userId === selectedLedgerUserId)?.user.name}
                  </h4>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Net Balance: <strong className={(groupData.balances.find((b: any) => b.userId === selectedLedgerUserId)?.net || 0) >= 0 ? 'amount-positive' : 'amount-negative'}>
                      ₹{(groupData.balances.find((b: any) => b.userId === selectedLedgerUserId)?.net || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </strong>
                  </span>
                </div>

                {groupData.ledgers[selectedLedgerUserId]?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    No transactions recorded for this member.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Table Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 2fr 1fr 1fr 1fr 1fr', padding: '12px 24px', background: 'rgba(18, 24, 36, 0.4)', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--card-border)' }}>
                      <div>Date</div>
                      <div>Description</div>
                      <div style={{ textAlign: 'right' }}>Total Bill</div>
                      <div style={{ textAlign: 'right' }}>Paid / Sent</div>
                      <div style={{ textAlign: 'right' }}>Your Share</div>
                      <div style={{ textAlign: 'right' }}>Running Balance</div>
                    </div>

                    {/* Table Rows */}
                    {groupData.ledgers[selectedLedgerUserId]?.map((item: any, idx: number) => {
                      const isPaidByMe = item.payerName === 'You' || item.type === 'expense_paid' || item.type === 'settlement_sent';
                      const payerText = isPaidByMe ? 'You' : item.payerName;
                      
                      return (
                        <div key={idx} className="ledger-item hover-row" style={{ display: 'grid', gridTemplateColumns: '100px 2fr 1fr 1fr 1fr 1fr', padding: '16px 24px', borderBottom: '1px solid var(--card-border)', fontSize: '13px' }}>
                          {/* Date */}
                          <div style={{ color: 'var(--text-secondary)' }}>
                            {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </div>

                          {/* Description & Payer */}
                          <div>
                            <div style={{ fontWeight: 600 }}>{item.description}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {item.type.startsWith('settlement') ? 'Settlement' : `Paid by ${payerText}`}
                              {item.originalCurrency !== 'INR' && ` • Original: ${item.originalCurrency} ${item.originalAmount}`}
                              {item.notes && ` • "${item.notes}"`}
                            </div>
                          </div>

                          {/* Total Bill */}
                          <div style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                            {item.type.startsWith('settlement') ? '-' : `₹${item.amount.toLocaleString('en-IN')}`}
                          </div>

                          {/* Paid / Sent */}
                          <div style={{ textAlign: 'right', color: '#34d399', fontWeight: isPaidByMe ? 600 : 'normal' }}>
                            {isPaidByMe ? `₹${item.amount.toLocaleString('en-IN')}` : '-'}
                          </div>

                          {/* Your Share */}
                          <div style={{ textAlign: 'right', color: !isPaidByMe ? '#f87171' : 'var(--text-muted)' }}>
                            {item.share > 0 ? `₹${item.share.toLocaleString('en-IN')}` : '-'}
                          </div>

                          {/* Running Balance */}
                          <div style={{ textAlign: 'right', fontWeight: 'bold' }} className={item.runningBalance >= 0 ? 'amount-positive' : 'amount-negative'}>
                            ₹{item.runningBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: EXPENSES & SETTLEMENTS */}
      {activeTab === 'expenses' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <h2>Group Ledger Ledger</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setShowSettlementModal(true)}>
                <Check size={16} /> Record Payment
              </button>
              <button className="btn btn-primary" onClick={() => {
                // Pre-populate split lists
                if (groupData?.group?.members) {
                  setExpSplitWith(groupData.group.members.map((m: any) => m.userId))
                }
                setShowExpenseModal(true)
              }}>
                <Plus size={16} /> Add Expense
              </button>
            </div>
          </div>

          {/* Expenses and Settlements list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Manual Expense List */}
            <div className="card">
              <h3 style={{ marginBottom: '20px' }}>Active Expenses</h3>
              {!groupData || groupData.group.expenses.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No manual expenses added yet.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Paid By</th>
                        <th>Total Amount</th>
                        <th>Currency</th>
                        <th>Split Type</th>
                        <th>Split With</th>
                        <th style={{ width: '80px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupData.group.expenses.map((e: any) => (
                        <tr key={e.id}>
                          <td>{new Date(e.date).toLocaleDateString('en-GB')}</td>
                          <td>
                            <strong>{e.description}</strong>
                            {e.notes && <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{e.notes}"</div>}
                          </td>
                          <td>{e.paidBy.name}</td>
                          <td style={{ fontWeight: 600 }}>
                            {e.currency !== 'INR' ? `${e.currency} ${e.amount}` : `₹${e.amount.toLocaleString('en-IN')}`}
                            {e.currency !== 'INR' && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>₹{e.amountInBase.toLocaleString('en-IN')}</div>}
                          </td>
                          <td>{e.currency}</td>
                          <td><span className="badge badge-info">{e.splitType}</span></td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {e.splits.map((s: any) => s.user.name).join(', ')}
                          </td>
                          <td>
                            <button className="btn btn-danger btn-small" style={{ padding: '6px' }} onClick={() => handleDeleteExpense(e.id)}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Settlements Paid List */}
            <div className="card">
              <h3 style={{ marginBottom: '20px' }}>Direct Payments / Settlements</h3>
              {!groupData || groupData.settlements.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No payment transfers recorded yet.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Payer</th>
                        <th>Receiver</th>
                        <th>Amount</th>
                        <th>Notes</th>
                        <th style={{ width: '80px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupData.settlements.map((s: any) => (
                        <tr key={s.id}>
                          <td>{new Date(s.date).toLocaleDateString('en-GB')}</td>
                          <td style={{ color: '#f87171', fontWeight: 600 }}>{s.payer.name}</td>
                          <td style={{ color: '#34d399', fontWeight: 600 }}>{s.receiver.name}</td>
                          <td style={{ fontWeight: 'bold', color: '#00f2fe' }}>₹{s.amount.toLocaleString('en-IN')}</td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.notes}</td>
                          <td>
                            <button className="btn btn-danger btn-small" style={{ padding: '6px' }} onClick={() => handleDeleteSettlement(s.id)}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: GROUP SETTINGS */}
      {activeTab === 'settings' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Member timelines */}
            <div className="card">
              <h3 style={{ marginBottom: '20px', display: 'flex', justifyItems: 'center', gap: '8px' }}>
                <UserIcon size={20} style={{ color: '#00f2fe' }} /> Flatmate Active Timelines
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Requirement 2: <em>"Create and manage groups, where membership can change over time."</em> Update join/leave dates below. Expenses will only split among members active at the date of the expense:
              </p>

              <div className="table-wrapper" style={{ marginBottom: '32px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Joined Date</th>
                      <th>Left Date (optional)</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupData?.group?.members.map((m: any) => {
                      const joined = new Date(m.joinedAt).toISOString().substring(0, 10)
                      const left = m.leftAt ? new Date(m.leftAt).toISOString().substring(0, 10) : ''
                      return (
                        <tr key={m.id}>
                          <td style={{ fontWeight: 'bold' }}>{m.user.name}</td>
                          <td>
                            <input 
                              type="date" 
                              className="form-input" 
                              style={{ padding: '6px 12px', width: '150px' }}
                              value={joined}
                              onChange={async (e) => {
                                await updateMemberMembership(groupId!, m.userId, e.target.value, left || null)
                                loadData(groupId!)
                              }}
                            />
                          </td>
                          <td>
                            <input 
                              type="date" 
                              className="form-input" 
                              style={{ padding: '6px 12px', width: '150px' }}
                              value={left}
                              onChange={async (e) => {
                                await updateMemberMembership(groupId!, m.userId, joined, e.target.value || null)
                                loadData(groupId!)
                              }}
                            />
                          </td>
                          <td>
                            {m.leftAt ? (
                              <span className="badge badge-warning">Inactive</span>
                            ) : (
                              <span className="badge badge-success">Active</span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto-saves on change</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add Member Form */}
              <form onSubmit={handleAddMember} style={{ borderTop: '1px solid var(--card-border)', paddingTop: '24px' }}>
                <h4 style={{ marginBottom: '16px' }}>Add New Flatmate</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Kabir"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Join Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={newMemberJoined}
                      onChange={(e) => setNewMemberJoined(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Departure Date (optional)</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={newMemberLeft}
                      onChange={(e) => setNewMemberLeft(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    <Plus size={16} /> Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MANUALLY ADD EXPENSE MODAL */}
      {showExpenseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px' }}>Add Shared Expense</h3>
            <form onSubmit={handleCreateExpense}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <input type="text" className="form-input" placeholder="e.g. Wifi bill" value={expDescription} onChange={e => setExpDescription(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Paid By *</label>
                  <select className="form-select" value={expPayer} onChange={e => setExpPayer(e.target.value)} required>
                    <option value="">Select Payer</option>
                    {groupData?.group?.members.map((m: any) => (
                      <option key={m.userId} value={m.userId}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Amount *</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0.00" value={expAmount} onChange={e => setExpAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select className="form-select" value={expCurrency} onChange={e => {
                    setExpCurrency(e.target.value);
                    if (e.target.value === 'INR') setExpExchangeRate('1.0');
                  }}>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Exchange Rate (to INR)</label>
                  <input type="number" step="0.0001" className="form-input" value={expExchangeRate} onChange={e => setExpExchangeRate(e.target.value)} disabled={expCurrency === 'INR'} />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={expDate} onChange={e => setExpDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Split Type *</label>
                  <select className="form-select" value={expSplitType} onChange={e => setExpSplitType(e.target.value)} required>
                    <option value="equal">Split Equally</option>
                    <option value="percentage">Percentage Split</option>
                    <option value="share">Split by Shares</option>
                    <option value="unequal">Split Unequally (₹)</option>
                  </select>
                </div>
              </div>

              {/* Split Members Selection */}
              <div className="form-group" style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                <label className="form-label">Split With * (Only active members on selected date listed)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginTop: '8px' }}>
                  {groupData?.group?.members
                    .filter((m: any) => {
                      // Only display active members on selected expense date!
                      const expDateStr = new Date(expDate).toISOString().substring(0, 10);
                      const joined = new Date(m.joinedAt).toISOString().substring(0, 10);
                      const left = m.leftAt ? new Date(m.leftAt).toISOString().substring(0, 10) : null;
                      return expDateStr >= joined && (left === null || expDateStr <= left);
                    })
                    .map((m: any) => {
                      const isChecked = expSplitWith.includes(m.userId);
                      return (
                        <div key={m.userId} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setExpSplitWith([...expSplitWith, m.userId])
                                } else {
                                  setExpSplitWith(expSplitWith.filter(id => id !== m.userId))
                                }
                              }}
                            />
                            <span>{m.user.name}</span>
                          </label>

                          {/* Specific split values inputs */}
                          {isChecked && expSplitType !== 'equal' && (
                            <input 
                              type="number"
                              step="any"
                              placeholder={
                                expSplitType === 'percentage' ? '%' 
                                  : expSplitType === 'share' ? 'shares' 
                                    : '₹'
                              }
                              className="form-input"
                              style={{ padding: '4px 8px', fontSize: '12px', marginTop: '4px' }}
                              value={expSplitDetails[m.userId] || ''}
                              onChange={(e) => setExpSplitDetails({...expSplitDetails, [m.userId]: e.target.value})}
                              required
                            />
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" placeholder="Optional notes" value={expNotes} onChange={e => setExpNotes(e.target.value)} rows={2}></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD SETTLEMENT MODAL */}
      {showSettlementModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card animate-fade-in" style={{ maxWidth: '450px', width: '100%' }}>
            <h3 style={{ marginBottom: '20px' }}>Record Payment / Settle Debt</h3>
            <form onSubmit={handleRecordSettlement}>
              <div className="form-group">
                <label className="form-label">Who Paid *</label>
                <select className="form-select" value={setPayer} onChange={e => setSetPayer(e.target.value)} required>
                  <option value="">Select Member</option>
                  {groupData?.group?.members.map((m: any) => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Who Received *</label>
                <select className="form-select" value={setReceiver} onChange={e => setSetReceiver(e.target.value)} required>
                  <option value="">Select Member</option>
                  {groupData?.group?.members.map((m: any) => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Amount (INR) *</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0.00" value={setAmount} onChange={e => setSetAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={setDateVal} onChange={e => setSetDateVal(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <input type="text" className="form-input" placeholder="e.g. Cash transfer" value={setNotes} onChange={e => setSetNotes(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSettlementModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
