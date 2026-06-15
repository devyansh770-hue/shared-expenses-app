'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// Predefined members to seed if database is empty
const SEED_MEMBERS = [
  { name: 'Aisha', joinedAt: new Date('2026-02-01'), leftAt: null },
  { name: 'Rohan', joinedAt: new Date('2026-02-01'), leftAt: null },
  { name: 'Priya', joinedAt: new Date('2026-02-01'), leftAt: null },
  { name: 'Meera', joinedAt: new Date('2026-02-01'), leftAt: new Date('2026-03-31') },
  { name: 'Dev', joinedAt: new Date('2026-02-01'), leftAt: new Date('2026-03-31') },
  { name: 'Sam', joinedAt: new Date('2026-04-15'), leftAt: null },
]

export async function seedGroupAndUsers() {
  try {
    // Check if group already exists
    let group = await db.group.findFirst({
      where: { name: 'Flatmates' },
    })

    if (!group) {
      group = await db.group.create({
        data: { name: 'Flatmates' },
      })
    }

    const groupId = group.id

    // Seed users and group members
    for (const seed of SEED_MEMBERS) {
      let user = await db.user.findUnique({
        where: { name: seed.name },
      })

      if (!user) {
        user = await db.user.create({
          data: { 
            name: seed.name,
            email: `${seed.name.toLowerCase()}@example.com`,
          },
        })
      }

      // Check group membership
      const membership = await db.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: user.id,
          },
        },
      })

      if (!membership) {
        await db.groupMember.create({
          data: {
            groupId,
            userId: user.id,
            joinedAt: seed.joinedAt,
            leftAt: seed.leftAt,
          },
        })
      }
    }

    return { success: true, groupId }
  } catch (error: any) {
    console.error('Error seeding group and users:', error)
    return { success: false, error: error.message }
  }
}

export async function getGroupData(groupId: string) {
  try {
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        expenses: {
          include: {
            paidBy: true,
            splits: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!group) {
      return { success: false, error: 'Group not found' }
    }

    const settlements = await db.settlement.findMany({
      where: { groupId },
      include: {
        payer: true,
        receiver: true,
      },
      orderBy: { date: 'asc' },
    })

    const anomalyLogs = await db.anomalyLog.findMany({
      orderBy: { csvRow: 'asc' },
    })

    // Compute net balances
    const balances: Record<string, { userId: string; name: string; paid: number; owed: number; sent: number; received: number; net: number }> = {}
    
    // Initialize balances for all group members
    group.members.forEach((m: any) => {
      balances[m.userId] = {
        userId: m.userId,
        name: m.user.name,
        paid: 0,
        owed: 0,
        sent: 0,
        received: 0,
        net: 0,
      }
    })

    // Add paid amounts from expenses
    group.expenses.forEach((e: any) => {
      if (balances[e.paidById]) {
        balances[e.paidById].paid += e.amountInBase
      }
      e.splits.forEach((s: any) => {
        if (balances[s.userId]) {
          balances[s.userId].owed += s.amount
        }
      })
    })

    // Add settlements
    settlements.forEach((s: any) => {
      if (balances[s.payerId]) {
        balances[s.payerId].sent += s.amount
      }
      if (balances[s.receiverId]) {
        balances[s.receiverId].received += s.amount
      }
    })

    // Calculate Net Balance: Paid - Owed + Sent - Received
    Object.keys(balances).forEach((userId) => {
      const b = balances[userId]
      b.net = Number((b.paid - b.owed + b.sent - b.received).toFixed(2))
    })

    // Compute simplified debts (Aisha's request)
    const simplifiedDebts = computeSimplifiedDebts(Object.values(balances))

    // Compute detailed audit ledger (Rohan's request)
    const ledgers: Record<string, any[]> = {}
    group.members.forEach((m: any) => {
      ledgers[m.userId] = []
    })

    // Populate ledgers chronologically
    // 1. Process expenses
    group.expenses.forEach((e: any) => {
      // If the user paid, they get credit for paid amount
      if (balances[e.paidById]) {
        const userSplit = e.splits.find((s: any) => s.userId === e.paidById)
        const userOwes = userSplit ? userSplit.amount : 0
        ledgers[e.paidById].push({
          type: 'expense_paid',
          id: e.id,
          date: e.date,
          description: e.description,
          amount: e.amountInBase,
          originalAmount: e.amount,
          originalCurrency: e.currency,
          payer: 'You',
          payerName: e.paidBy.name,
          share: userOwes,
          netChange: Number((e.amountInBase - userOwes).toFixed(2)),
          notes: e.notes,
        })
      }

      // If the user participated in the split (but was not the payer)
      e.splits.forEach((s: any) => {
        if (s.userId !== e.paidById && balances[s.userId]) {
          ledgers[s.userId].push({
            type: 'expense_split',
            id: e.id,
            date: e.date,
            description: e.description,
            amount: e.amountInBase,
            originalAmount: e.amount,
            originalCurrency: e.currency,
            payer: e.paidBy.name,
            payerName: e.paidBy.name,
            share: s.amount,
            netChange: Number((-s.amount).toFixed(2)),
            notes: e.notes,
          })
        }
      })
    })

    // 2. Process settlements
    settlements.forEach((s: any) => {
      if (balances[s.payerId]) {
        ledgers[s.payerId].push({
          type: 'settlement_sent',
          id: s.id,
          date: s.date,
          description: `Paid settlement to ${s.receiver.name}`,
          amount: s.amount,
          originalAmount: s.amount,
          originalCurrency: 'INR',
          payer: 'You',
          payerName: s.payer.name,
          share: 0,
          netChange: s.amount,
          notes: s.notes,
        })
      }
      if (balances[s.receiverId]) {
        ledgers[s.receiverId].push({
          type: 'settlement_received',
          id: s.id,
          date: s.date,
          description: `Received settlement from ${s.payer.name}`,
          amount: s.amount,
          originalAmount: s.amount,
          originalCurrency: 'INR',
          payer: s.payer.name,
          payerName: s.payer.name,
          share: 0,
          netChange: -s.amount,
          notes: s.notes,
        })
      }
    })

    // Sort ledgers chronologically and calculate running balance
    Object.keys(ledgers).forEach((userId) => {
      ledgers[userId].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      let runningBalance = 0
      ledgers[userId] = ledgers[userId].map((item) => {
        runningBalance += item.netChange
        return {
          ...item,
          runningBalance: Number(runningBalance.toFixed(2)),
        }
      })
    })

    return {
      success: true,
      group,
      balances: Object.values(balances),
      simplifiedDebts,
      ledgers,
      settlements,
      anomalyLogs,
    }
  } catch (error: any) {
    console.error('Error fetching group data:', error)
    return { success: false, error: error.message }
  }
}

// Aisha's Request: Minimize Transactions (Greedy debt simplification)
function computeSimplifiedDebts(balancesList: any[]) {
  const creditors = balancesList
    .filter((b) => b.net > 0.01)
    .map((b) => ({ userId: b.userId, name: b.name, balance: b.net }))
    .sort((a, b) => b.balance - a.balance)

  const debtors = balancesList
    .filter((b) => b.net < -0.01)
    .map((b) => ({ userId: b.userId, name: b.name, balance: Math.abs(b.net) }))
    .sort((a, b) => b.balance - a.balance)

  const transactions: { fromId: string; fromName: string; toId: string; toName: string; amount: number }[] = []

  let cIdx = 0
  let dIdx = 0

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx]
    const debtor = debtors[dIdx]

    const amount = Number(Math.min(creditor.balance, debtor.balance).toFixed(2))

    if (amount > 0.01) {
      transactions.push({
        fromId: debtor.userId,
        fromName: debtor.name,
        toId: creditor.userId,
        toName: creditor.name,
        amount,
      })
    }

    creditor.balance -= amount
    debtor.balance -= amount

    if (creditor.balance <= 0.01) cIdx++
    if (debtor.balance <= 0.01) dIdx++
  }

  return transactions
}

export async function importResolvedData(
  groupId: string,
  resolvedExpenses: any[],
  resolvedSettlements: any[],
  anomalyLogs: any[]
) {
  try {
    // Run in transaction
    await db.$transaction(async (tx: any) => {
      // 1. Clear previous expenses and settlements for this group
      await tx.expense.deleteMany({
        where: { groupId },
      })
      await tx.settlement.deleteMany({
        where: { groupId },
      })
      await tx.anomalyLog.deleteMany({}) // Clear anomaly logs

      // 2. Clear out guests that aren't seeded to avoid duplicates if re-importing
      // We will keep seeded members, delete others if they have no other group affiliations
      const seededNames = SEED_MEMBERS.map(m => m.name)
      const nonSeededUsers = await tx.user.findMany({
        where: {
          NOT: {
            name: { in: seededNames }
          },
          accounts: {
            none: {}
          },
          sessions: {
            none: {}
          }
        }
      })

      for (const u of nonSeededUsers) {
        // delete group membership
        await tx.groupMember.deleteMany({
          where: { userId: u.id, groupId }
        })
        // check if they are in other groups, if not delete user
        const membershipsCount = await tx.groupMember.count({
          where: { userId: u.id }
        })
        if (membershipsCount === 0) {
          await tx.user.delete({
            where: { id: u.id }
          })
        }
      }

      // 3. Ensure all user mappings are added to the group
      // First, get all current users
      const usersMap: Record<string, string> = {} // name -> id
      const allUsers = await tx.user.findMany()
      allUsers.forEach((u: any) => {
        usersMap[u.name] = u.id
      })

      // Add any new names as guest members
      const allNamesInImport = new Set<string>()
      resolvedExpenses.forEach((e: any) => {
        allNamesInImport.add(e.paidBy)
        e.splits.forEach((s: any) => allNamesInImport.add(s.name))
      })
      resolvedSettlements.forEach((s: any) => {
        allNamesInImport.add(s.payer)
        allNamesInImport.add(s.receiver)
      })

      for (const name of Array.from(allNamesInImport)) {
        if (!usersMap[name]) {
          const newUser = await tx.user.create({
            data: { 
              name,
              email: `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
            },
          })
          usersMap[name] = newUser.id

          // Add as group member with join date as Feb 1, 2026, or check when they appeared
          await tx.groupMember.create({
            data: {
              groupId,
              userId: newUser.id,
              joinedAt: new Date('2026-02-01'), // Default to start
              leftAt: new Date('2026-03-31'), // Assume temporary (e.g. Kabir)
            }
          })
        }
      }

      // 4. Save resolved expenses
      for (const exp of resolvedExpenses) {
        const payerId = usersMap[exp.paidBy]
        if (!payerId) throw new Error(`Payer "${exp.paidBy}" not found in mapping.`)

        const createdExpense = await tx.expense.create({
          data: {
            groupId,
            description: exp.description,
            paidById: payerId,
            amount: exp.amount,
            currency: exp.currency,
            exchangeRate: exp.exchangeRate || 1.0,
            amountInBase: exp.amountInBase,
            splitType: exp.splitType,
            date: new Date(exp.date),
            notes: exp.notes || '',
          }
        })

        // Create splits
        for (const s of exp.splits) {
          const sUserId = usersMap[s.name]
          if (!sUserId) throw new Error(`Split member "${s.name}" not found.`)

          await tx.expenseSplit.create({
            data: {
              expenseId: createdExpense.id,
              userId: sUserId,
              amount: s.amount,
              share: s.share !== undefined ? s.share : null,
            }
          })
        }
      }

      // 5. Save resolved settlements
      for (const set of resolvedSettlements) {
        const payerId = usersMap[set.payer]
        const receiverId = usersMap[set.receiver]
        if (!payerId || !receiverId) throw new Error(`Settlement users not found.`)

        await tx.settlement.create({
          data: {
            groupId,
            payerId,
            receiverId,
            amount: set.amount,
            date: new Date(set.date),
            notes: set.notes || '',
          }
        })
      }

      // 6. Save anomaly logs
      for (const log of anomalyLogs) {
        await tx.anomalyLog.create({
          data: {
            csvRow: log.row,
            anomalyType: log.type,
            description: log.description,
            actionTaken: log.actionTaken || 'None',
          }
        })
      }
    })

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error importing CSV:', error)
    return { success: false, error: error.message }
  }
}

export async function createExpense(data: {
  groupId: string
  description: string
  paidById: string
  amount: number
  currency: string
  exchangeRate: number
  splitType: string
  date: string
  notes?: string
  splits: { userId: string; amount: number; share?: number }[]
}) {
  try {
    const amountInBase = Number((data.amount * data.exchangeRate).toFixed(2))

    await db.$transaction(async (tx: any) => {
      const expense = await tx.expense.create({
        data: {
          groupId: data.groupId,
          description: data.description,
          paidById: data.paidById,
          amount: data.amount,
          currency: data.currency,
          exchangeRate: data.exchangeRate,
          amountInBase,
          splitType: data.splitType,
          date: new Date(data.date),
          notes: data.notes || '',
        },
      })

      for (const s of data.splits) {
        await tx.expenseSplit.create({
          data: {
            expenseId: expense.id,
            userId: s.userId,
            amount: Number(s.amount.toFixed(2)),
            share: s.share !== undefined ? s.share : null,
          },
        })
      }
    })

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error creating manual expense:', error)
    return { success: false, error: error.message }
  }
}

export async function recordSettlement(data: {
  groupId: string
  payerId: string
  receiverId: string
  amount: number
  date: string
  notes?: string
}) {
  try {
    await db.settlement.create({
      data: {
        groupId: data.groupId,
        payerId: data.payerId,
        receiverId: data.receiverId,
        amount: data.amount,
        date: new Date(data.date),
        notes: data.notes || '',
      },
    })

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error recording settlement:', error)
    return { success: false, error: error.message }
  }
}

export async function updateMemberMembership(groupId: string, userId: string, joinedAt: string, leftAt: string | null) {
  try {
    await db.groupMember.update({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      data: {
        joinedAt: new Date(joinedAt),
        leftAt: leftAt ? new Date(leftAt) : null,
      },
    })

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating member membership:', error)
    return { success: false, error: error.message }
  }
}

export async function addMemberToGroup(groupId: string, name: string, joinedAt: string, leftAt: string | null) {
  try {
    let user = await db.user.findUnique({
      where: { name },
    })

    if (!user) {
      user = await db.user.create({
        data: { 
          name,
          email: `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
        },
      })
    }

    await db.groupMember.create({
      data: {
        groupId,
        userId: user.id,
        joinedAt: new Date(joinedAt),
        leftAt: leftAt ? new Date(leftAt) : null,
      },
    })

    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error adding member to group:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteExpense(expenseId: string) {
  try {
    await db.expense.delete({
      where: { id: expenseId },
    })
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting expense:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteSettlement(settlementId: string) {
  try {
    await db.settlement.delete({
      where: { id: settlementId },
    })
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting settlement:', error)
    return { success: false, error: error.message }
  }
}

export async function readWorkspaceCSV() {
  try {
    const fs = require('fs')
    const path = require('path')
    const csvPath = path.join(process.cwd(), 'expenses export.csv')
    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8')
      return { success: true, content }
    }
    return { success: false, error: 'File not found' }
  } catch (error: any) {
    console.error('Error reading workspace CSV:', error)
    return { success: false, error: error.message }
  }
}

