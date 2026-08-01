---
name: google-agents-cli-adk-code
description: ADK API best practices — agent definitions, tools, callbacks, state management, and Gemma 4 tool calling.
---

# Skill: ADK Code Structure & Tool Calling

This skill governs writing Google Agent Development Kit (ADK) agent logic, tool declarations, callbacks, and state.

## Guidelines
1. **Agent Definition**:
   - Define system instructions, model selection (`gemma-4-26b-a4b-it`), and available tool functions.
2. **Tool Function Declarations**:
   - Explicitly declare JSON schema parameters (`type`, `properties`, `required`).
   - Every transaction mutation tool (`add_transaction`, `sync_to_google_sheets`, `get_financial_summary`) must execute SQLite updates via Prisma and queue Google Sheets sync.
3. **State & Callbacks**:
   - Maintain dual-state synchronization (SQLite for low latency, Google Sheets for cloud backup).
   - Return clean human-readable summaries along with tool call execution flags.
