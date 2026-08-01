# Guidelines for Development - Catatin Application

## Technical Stack & Principles
- **Language**: JavaScript (Node.js & React Native / Next.js)
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS & Lucide Icons
- **Database**: SQLite with Prisma ORM
- **Sync**: 2-Way Synchronization with Google Sheets API
- **AI Agent**: Google Agent Development Kit with Gemma 4 26B A4B IT (Multimodal & Function Calling / Tool Calling)

## Development Rules
1. **Tool Calling Integration**:
   - Every transaction mutation triggered by the AI Agent (Gemma 4) must execute Tool Calling functions (`addTransaction`, `updateTransaction`, `deleteTransaction`, `syncToGoogleSheets`).
   - Mutations must immediately update SQLite database via Prisma and queue/trigger Google Sheets API updates.
2. **Financial Data Visualization**:
   - Provide visual dashboards outside the chatbot interface.
   - Include interactive charts (e.g. Expense Distribution Pie Chart, Income vs Expense Bar Chart, Monthly Trend Line Chart) using `recharts`.
   - Include financial summary metrics cards (Total Income, Total Expense, Net Savings Rate, Sync Status Indicator).
3. **Data Integrity & Fallback**:
   - Maintain dual state: SQLite local DB for low-latency queries and Google Sheets as cloud backup/sync target.
   - Handle API rate limits or offline sync gracefully via `SyncLog` entries.
4. **UI Layout & Gemma Chatbot**:
   - Gemma Chatbot AI Assistant disajikan sebagai **Right Slide-over Drawer** (dapat dibuka/ditutup dari sebelah kanan layar) dengan floating trigger button di pojok kanan bawah.
5. **Execution & Command Rules**:
   - Jangan jalankan `npm run build` jika dev server (`npm run dev`) sudah aktif/berjalan di background.

