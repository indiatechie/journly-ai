# Journly.ai

> Privacy-first, offline-first journaling PWA with optional AI-powered storytelling.

## ✨ Features

- **🔒 Privacy-first** — All data encrypted with AES-256-GCM on your device
- **📴 Offline-first** — Works entirely without internet; no backend required
- **🤖 Optional AI** — Generate stories from your entries using remote (OpenAI-compatible) AI
- **📱 Mobile-first PWA** — Installable on any device, designed for mobile
- **✍️ Distraction-free editor** — Focus mode, auto-save, mood tracking, daily prompts
- **🔥 Streaks & stats** — Writing streak tracker with 7-day word count chart
- **📦 Export/Import** — Encrypted JSON backup and restore
- **☁️ Google Drive sync** — End-to-end encrypted cloud backup (optional)
- **🧩 Modular architecture** — Clean domain-driven design with pluggable adapters

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+ (includes npm)

### Installation

```bash
cd journly-ai
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
npm run preview
```

### Testing

```bash
npm run test
```

## 🏗️ Architecture

This project follows a **layered architecture** with clean dependency inversion:

```
Presentation → Application → Domain ← Infrastructure
```

| Layer | Purpose |
|---|---|
| `src/domain/` | Pure models, interfaces, errors (zero dependencies) |
| `src/application/` | Use-case orchestrators, Zustand stores |
| `src/infrastructure/` | Concrete adapters: storage, crypto, AI |
| `src/presentation/` | React components, pages, hooks, layouts |
| `src/shared/` | Cross-cutting utilities and constants |

See [`plans/journly-ai-architecture.md`](plans/journly-ai-architecture.md) for the full architecture document.

## 🔐 Security Model

- **Encryption**: AES-256-GCM via native WebCrypto API
- **Key derivation**: PBKDF2-SHA256 with 600,000 iterations
- **CryptoKey**: Derived from passphrase, held in memory only — never persisted
- **IV**: Unique 12-byte random IV per record
- **Remote AI**: Explicit opt-in with clear privacy warning

## 📋 Implementation Phases

- [x] **Phase 1**: Foundation (scaffold, models, interfaces, app shell)
- [x] **Phase 2**: Core storage + crypto (DexieStorageAdapter, CryptoService)
- [x] **Phase 3**: Journal CRUD (editor, auto-save, vault, prompts, stats)
- [x] **Phase 4**: AI integration (remote AI story generation, anonymization)
- [ ] **Phase 5**: Polish + ship

## 📄 License

Private — not yet licensed for distribution.
