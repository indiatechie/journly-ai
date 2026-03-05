# Journly.ai

> Privacy-first, offline-first journaling PWA with optional AI-powered storytelling.
> Free. Offline. No account required.

## ✨ Features

- **🔒 Privacy-first** — All data encrypted with AES-256-GCM on your device. Keys derive from your passphrase via PBKDF2-SHA256 (600,000 iterations) and are never persisted.
- **📴 Offline-first** — Works entirely without internet; no backend required. Data lives in IndexedDB.
- **🤖 Optional AI stories** — Generate stories from your entries using OpenAI (gpt-4o-mini / gpt-4o), Gemini (gemini-2.0-flash / gemini-1.5-pro), or any OpenAI-compatible endpoint. Entries are anonymized before leaving the device.
- **📱 Mobile-first PWA + Android APK** — Installable as a PWA or as a native Android app via Capacitor. iOS also supported.
- **✍️ Distraction-free editor** — Auto-save, writing prompts, focus mode.
- **🔥 Streaks & stats** — Writing streak tracker with 7-day word count chart.
- **📦 Export/Import** — Encrypted JSON backup and restore; no vendor lock-in.
- **☁️ Google Drive sync** — End-to-end encrypted cloud backup via Google OAuth (optional).
- **🧩 Modular architecture** — Clean domain-driven design with pluggable adapters.

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

### Android

```bash
npm run cap:android   # build + sync + open Android Studio
```

### iOS

```bash
npm run cap:ios       # build + sync + open Xcode
```

### Testing

```bash
npm run test
npm run test:ui   # Vitest UI
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

- **Encryption**: AES-256-GCM via native WebCrypto API; unique 12-byte random IV per record.
- **Key derivation**: PBKDF2-SHA256 with 600,000 iterations and a 16-byte random salt.
- **CryptoKey**: Derived from passphrase at unlock, held in memory only — never persisted, non-extractable.
- **AI API keys**: Encrypted with your vault key (AES-GCM) before being written to localStorage.
- **Remote AI**: Explicit opt-in. Entries are anonymized (`src/shared/anonymize.ts`) before leaving the device.
- **Google Drive**: Pre-encrypted blobs are uploaded — Google cannot read the content.

## 📄 License

Private — all rights reserved.
