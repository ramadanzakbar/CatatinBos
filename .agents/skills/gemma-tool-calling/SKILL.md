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

### 2. `sync_to_google_sheets`
- **Description**: Trigger two-way synchronization between SQLite database and Google Sheets.

### 3. `get_financial_summary`
- **Description**: Retrieve aggregated transaction summary for reports.

## Visualization Requirements
- Visual charts (Recharts) render in the primary Dashboard component outside the Chatbot sidebar/overlay.
- Real-time updates trigger upon tool calling completion.
