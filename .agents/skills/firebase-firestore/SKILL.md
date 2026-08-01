---
name: firebase-firestore
description: How to model, query, index, and sync Firestore data for agent applications.
---

# Skill: Firebase Firestore Data Layer

This skill governs modeling, querying, and indexing Firestore databases when used alongside ADK agents.

## Guidelines
1. **Data Modeling**:
   - Model transactions as sub-collections or top-level collections with timestamp indexing.
2. **Querying & Indexing**:
   - Create composite indexes for range queries combined with equality filters (e.g. `userId == X AND date >= Y`).
3. **Synchronization**:
   - Ensure real-time listeners (`onSnapshot`) push updates to UI components without polling.
