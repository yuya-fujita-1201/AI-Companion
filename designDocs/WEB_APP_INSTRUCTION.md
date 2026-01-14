# AI Companion Web App Porting Instructions

This document serves as a comprehensive guide and "To-Do" instruction set for AI agents (like Codex) to port the existing iOS AI Companion app to a Cloudflare-hosted Web Application.

## Project Overview
**Goal:** Create a web-based version of the "AI Companion" app that runs on Cloudflare Pages. The app allows users to chat with an AI character ("Mike"), supports voice input/output, and remembers past conversations.

**Source Information:**
- Original Design: `designDocs/design.md`
- Core Logic Reference: `app/(tabs)/index.tsx` (React Native/Expo)

## Technology Stack & Requirements
1.  **Platform**: Cloudflare Pages (Hosting) + Cloudflare Functions (Backend/API).
2.  **Frontend Framework**: React (Vite template).
3.  **Styling**: Tailwind CSS (Match the "NativeWind" styling from the source).
4.  **State/Storage**:
    - `localStorage` for persisting chat history and settings (equivalent to `AsyncStorage`).
    - Cloudflare D1 (Optional but recommended for "Memories" if syncing is needed, otherwise `localStorage`).
5.  **Audio**:
    - Input: Web Audio API (MediaRecorder) for capturing voice.
    - Output: Web Speech API (Synthesis) or Edge TTS proxy.
6.  **API Integration**:
    - Use Cloudflare Pages Functions (`/functions/api/...`) to proxy requests to AI services (OpenAI/Gemini/Anthropic) to keep keys secure.

## Step-by-Step Implementation Instructions

### Phase 1: Project Setup
- [ ] Initialize a new React project using Vite.
    ```bash
    npm create vite@latest ai-companion-web -- --template react-ts
    ```
- [ ] Install dependencies:
    - `tailwindcss`, `postcss`, `autoprefixer`.
    - `lucide-react` (for icons, replacing IconSymbol).
    - `framer-motion` (replacing react-native-reanimated for web animations).
    - `react-markdown` (for rendering AI messages).
- [ ] Configure `wrangler.toml` for Cloudflare Pages.

### Phase 2: Core Components Adaptation (Porting iOS to Web)
*Replace React Native components (`View`, `Text`, `Pressable`, `FlatList`) with HTML/React Web equivalents (`div`, `p`, `button`, `map`).*

- [ ] **Design System Setup**:
    - Configure Tailwind colors (`primary`, `background`, `surface`, etc.) in `tailwind.config.js` based on `designDocs/design.md`.
- [ ] **UI Components**:
    - `MessageBubble`: Port from RN. Use flexbox for bubble layout.
    - `TypingIndicator`: meaningful animation with CSS.
    - `ScreenContainer`: Layout wrapper (max-width for mobile view centered on desktop).
    - `VoiceInputButton`: Web button with touch events.
- [ ] **Assets**:
    - Place character images in `/public/assets/images`.

### Phase 3: Feature Implementation

#### 1. Chat Interface
- [ ] Implement `ChatScreen` logic:
    - State for `messages`, `inputText`, `isGenerating`.
    - `useEffect` to load/save messages to `localStorage` (Key: `chat_messages`).
    - Auto-scroll to bottom behavior using a `ref` on the chat container.

#### 2. Audio System (Web API)
- [ ] **Voice Input**:
    - Implement `useAudioRecorder` hook using `MediaRecorder` API.
    - Convert audio blob to appropriate format for the transcription API (e.g., FormData).
- [ ] **Text-to-Speech**:
    - Implement `playTTS` using `window.speechSynthesis` (easiest) or call a TTS API via Cloudflare Functions.

#### 3. AI & Backend (Cloudflare Functions)
- [ ] Create `functions/api/chat.ts`:
    - Handle POST requests with conversation history.
    - Call the AI Provider (e.g., OpenAI API) with the system prompt and context.
    - Return the AI response text.
- [ ] Create `functions/api/transcribe.ts`:
    - Handle POST file uploads.
    - Call Whisper API (or similar) to convert speech to text.

#### 4. Logic & Memory
- [ ] Port `extractMemories` logic:
    - Can be a client-side logic or a background API call after 3-5 turns.
    - Save extracted memories to `localStorage` (Key: `memories`).
- [ ] Implement "Context Awareness":
    - Retrieve relevant memories before sending the prompt to the Chat API.

### Phase 4: Polish & Deployment
- [ ] **Responsive Design**: Ensure it looks good on Mobile (PWA style) and Desktop (Centered mobile view).
- [ ] **Animations**: Use `framer-motion` to replicate the "Character Bounce" and UI transitions.
- [ ] **Deploy**:
    - Run `npm run build`.
    - Deploy to Cloudflare Pages.

## To-Do List for AI Agent (Execute Order)

1.  **[Environment]** Set up Vite React project + Tailwind CSS.
2.  **[Backend]** Create `functions/api/chat.ts` (Mock or Real integration).
3.  **[Frontend]** Create `ChatMessage` and `ChatList` components.
4.  **[Frontend]** Create `HomeView` (Character greeting) and `ChatView`.
5.  **[Logic]** Implement `useChat` hook for state management & LocalStorage persistence.
6.  **[Logic]** Implement `useVoiceInput` hook (Web Audio API).
7.  **[Integration]** Connect Frontend to Cloudflare Functions.
8.  **[Polish]** Add animations and character images.
9.  **[Deploy]** Generate production build.

---
**Note to AI Developer**: When implementing, prioritize the "Mobile-First" look. On desktop, the app should be contained in a centered container resembling a mobile screen to maintain the intended UX.
