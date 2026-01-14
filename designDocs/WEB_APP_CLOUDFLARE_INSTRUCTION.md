# AI Companion Web App Porting Instructions (Cloudflare Edition)

This document serves as a comprehensive guide for AI agents to port the "AI Companion" app to a Cloudflare-native architecture.

## Architecture Overview
- **Frontend**: Cloudflare Pages (React/Vite). Serves the UI.
- **Backend**: Cloudflare Workers (via Pages Functions). Handles API requests and logic.
- **Database**: Cloudflare D1 (SQLite). Stores persistent data (Memories).
- **Architecture Goal**: Separation of concerns. Frontend focuses on display; Backend handles logic and state management.

## Technology Stack
1.  **Frontend**: React (Vite), Tailwind CSS (NativeWind style).
2.  **Backend**: Cloudflare Pages Functions (`functions/api/...`).
3.  **Database**: Cloudflare D1 (`ai-companion-db`).
4.  **AI Integration**: OpenAI/Anthropic API calls proxied through Workers.

## Memory System Design (Critical)
The application must distinguish between memory types for optimal performance and context retrieval.

### 1. Short-term Memory (Context Window)
- **Storage**: Application State (Frontend) or Ephemeral Worker State.
- **Purpose**: Immediate conversation context (last 5-10 turns).
- **Implementation**: Pass as `history` payload in API requests.

### 2. Mid-term Memory (Active Recall)
- **Storage**: Cloudflare D1 (Table: `memories`).
- **Purpose**: Frequently accessed facts, user preferences, and recent important events.
- **Access**: High frequency. Query D1 on every chat session start or context switch.

### 3. Long-term Memory (Archive)
- **Storage**: Cloudflare D1 (Table: `memories_archive` or `memories` with `status='archived'`).
- **Purpose**: Historical logs and old conversations.
- **Access**: Low frequency. Only queried when specific historical context is triggered or during "reflection" periods.

## Step-by-Step Implementation

### Phase 1: Environment & D1 Setup
- [ ] **Initialize Cloudflare D1**:
    - Run `npx wrangler d1 create ai-companion-db`.
    - Configure `wrangler.toml` with the binding `[[d1_databases]]`.
- [ ] **Schema Definition**:
    - Create SQL schema for `memories`:
      ```sql
      CREATE TABLE memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        type TEXT NOT NULL, -- 'fact', 'preference', 'event'
        importance INTEGER DEFAULT 0,
        tier TEXT DEFAULT 'mid', -- 'short', 'mid', 'long'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      ```

### Phase 2: Backend Logic (Workers/Functions)
- [ ] **API: `/functions/api/chat.ts`**:
    - Receive user message + local history.
    - **Retrieval**: Query D1 for relevant Mid-term memories.
    - **Inference**: Construct prompt (System + Mid-term + Short-term history) and call AI.
    - **Persistence**: Save new turn to D1 (if archiving) or return response.
- [ ] **API: `/functions/api/memory.ts`**:
    - Background job (or valid async call) to analyze conversation and extract new memories.
    - Determine if memory is Mid-term (important) or Long-term (detail).
    - Insert into D1.

### Phase 3: Frontend Implementation
- [ ] **Chat UI**: 
    - Display Chat.
    - Manage Short-term history in React State / LocalStorage (for offline cache).
- [ ] **Settings/Status**:
    - View stored memories (fetched from D1 via API).

## To-Do List for AI Agent
1.  **[Setup]** Configure `wrangler.toml` for D1 and Pages.
2.  **[DB]** specific migration files for Memory tables.
3.  **[Backend]** Implement `chat` endpoint with D1 connection.
4.  **[Backend]** Implement functionality to classify and store memories into tiers (Mid vs Long).
5.  **[Frontend]** Connect UI to these new Cloudflare native endpoints.
