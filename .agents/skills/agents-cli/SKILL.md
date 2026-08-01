---
name: agents-cli
description: How to scaffold, lint, test, run, and manage ADK 2.0 agents on the Gemini Enterprise Platform.
---

# Skill: agents-cli

This skill governs the CLI usage and development lifecycle for building ADK 2.0 agents on the Gemini Enterprise Agent Platform.

## Core Commands

### 1. Project Scaffolding
- `agents-cli scaffold create`: Create a new ADK 2.0 agent project structure.
- `agents-cli scaffold enhance`: Add new capabilities or tools to an existing project.

### 2. Execution & Testing
- `agents-cli run "prompt"`: Run the agent once against a single prompt for smoke testing.
- `agents-cli playground`: Launch local interactive web UI for testing agent tool calls and state.

### 3. Code Quality & Linting
- `agents-cli lint`: Execute code quality checks and static analysis (Ruff / ESLint).

### 4. Evaluation & Optimization
- `agents-cli eval`: Run regression tests against evaluation datasets with LLM-as-a-judge.
- `agents-cli eval optimize`: Auto-tune agent prompts and system instructions based on eval datasets.

### 5. Deployment & Publishing
- `agents-cli deploy`: Deploy agent service to Google Cloud Run / Agent Runtime.
- `agents-cli publish gemini-enterprise`: Register agent with Gemini Enterprise catalog.
