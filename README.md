# Spreetail Shared Expenses App

An intelligent, relational database shared expense manager designed for Aisha, Rohan, Priya, Meera, Dev, and Sam to resolve their messy spreadsheet accounts. Built with **Next.js**, **SQLite**, and **Prisma ORM**.

---

## 🚀 Key Features

1. **Interactive Data Import Wizard**: Ingests `expenses_export.csv` directly. It runs a 20+ rule engine to identify duplicate rows, casing anomalies, USD exchange rates, percentage errors, missing payers, and active membership dates. The user reviews and approves resolutions step-by-step.
2. **Temporal Group Membership**: Enforces that flatmates are only charged for bills dated during their active stay (Meera left end of March; Sam joined mid-April).
3. **Multi-Currency Support**: Automatically converts USD trip expenses to INR using a user-specified exchange rate during ingestion, storing both original currency values and base conversions.
4. **Aisha's Settlement Summary**: A greedy debt-simplification algorithm that minimizes transactions to show exactly who pays whom and how much.
5. **Rohan's Audit Ledger**: A chronological, line-item ledger showing every expense, split share, refund, and payment, explaining exactly how a member's balance is calculated.
6. **Relational Database Integrity**: Implements SQLite database models using Prisma with cascading deletes.

---

## 🛠️ Tech Stack
* **Framework**: Next.js 16 (React 19, TypeScript, App Router)
* **Database**: SQLite (Relational DB)
* **ORM**: Prisma Client v7
* **Icons**: Lucide React
* **Styling**: Premium Vanilla CSS

---

## 🏃 Setup Instructions

Follow these steps to run the application locally:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file at the root of the project and add the following variables:
```env
DATABASE_URL="file:./dev.db"
BETTER_AUTH_SECRET="your_32_character_high_entropy_secret_here"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
*(Note: For local development, `supersecret123` can be used as the secret, but a random 32-character string is recommended in production. If accessing the app from a network IP, update the URLs accordingly).*

### 3. Generate Database Client
Generate the Prisma Client types:
```bash
npx prisma generate
```
*(Note: The app uses an SQLite database `dev.db` which is portable and self-contained).*

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or the network IP shown in your terminal) in your browser. The app will automatically seed the database with the default flatmates (Aisha, Rohan, Priya, Meera, Dev, Sam) and default timeline ranges.

### 5. Running Production Build
To validate or run the optimized production bundle locally:
```bash
npm run build
npm start
```

---

## 🤖 AI Usage

This project was built in collaboration with **Antigravity (Gemini 3.5 Flash)**. Detailed prompts, corrections, and the 8 concrete debugging case studies can be reviewed in the comprehensive AI logs in [AI_USAGE.md](file:///c:/Users/Devyansh%20verma/OneDrive/Desktop/spreetail/AI_USAGE.md).

