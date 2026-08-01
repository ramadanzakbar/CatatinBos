# Skill: Gemma 4 Tool Calling & Google Sheets Sync

This skill governs the integration of Gemma 4 26B A4B IT Function Calling (Tool Calling) for financial transactions and 2-way Google Sheets synchronization.

## Tool Definitions for Gemma 4 Agent

### 1. `add_transaction`
- **Description**: Add a new financial transaction (Income or Expense) to SQLite and sync to Google Sheets.
- **Parameters**:
  - `amount` (number, required): Transaction amount.
  - `category` (string, required): Category (e.g., Food, Transport, Salary, Bills).
  - `type` (string, required): `INCOME` or `EXPENSE`.
  - `note` (string, optional): Description or detail.
  - `date` (string, optional): ISO date string.

### 2. `get_financial_summary`
- **Description**: Query aggregated financial data (total income, total expense, net balance, transaction count) to act as a Financial Planner and offer budgeting advice.
- **Parameters**:
  - `category` (string, optional): Filter analytics by specific category.

### 3. `sync_to_google_sheets`
- **Description**: Trigger two-way synchronization between SQLite database and Google Sheets.

## Planner Capabilities & Visualization Requirements
- **Financial Planner Mode**: Gemma 4 uses `get_financial_summary` tool calling to analyze current spending habits and recommend budgets or savings targets.
- **Visual Charts**: Recharts render dynamically in the primary Dashboard component outside the Chatbot slide-over drawer.
- Real-time updates trigger automatically upon completion of transaction mutations or sync operations.
