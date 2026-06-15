import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import fs from 'fs'
import path from 'path'

// On Vercel, if using ephemeral local SQLite, copy the pre-existing database with schemas to /tmp/dev.db
const dbUrl = process.env.DATABASE_URL || 'file:./dev.db'
if (dbUrl.startsWith('file:/tmp/')) {
  const targetPath = dbUrl.substring(5) // Remove 'file:' prefix
  if (!fs.existsSync(targetPath)) {
    try {
      // Find the source dev.db in the workspace root
      const sourcePath = path.join(process.cwd(), 'dev.db')
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath)
        console.log('Successfully copied template database schema to', targetPath)
      } else {
        console.error('Source dev.db not found at', sourcePath)
      }
    } catch (err) {
      console.error('Failed to copy database schema to /tmp:', err)
    }
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const adapter = new PrismaLibSql({
  url: dbUrl
})

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
