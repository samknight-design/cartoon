# ⚔️ MTG Companion — Deck Scanner & AI Advisor

A mobile-first Magic: The Gathering companion app built with Vite + React.

## Features

| Tab | What it does |
|-----|-------------|
| 📷 **Scan** | Photograph a card or pick from gallery — Claude Vision identifies it automatically. Manual search fallback included. |
| 🃏 **Deck** | Full card list with thumbnails, +/− counts, CMC, type badges and colour pips. Tap any thumbnail for full card art. |
| 📊 **Stats** | Mana curve chart, colour distribution, card type breakdown with progress bars, land ratio warnings. |
| ✨ **AI** | Full deck analysis — archetype, bracket estimate (1–5), strengths/weaknesses, specific card swap recommendations, mana base assessment, and an overall /10 rating. |

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Add your Anthropic API key
cp .env.example .env
# Edit .env and add your key: VITE_ANTHROPIC_API_KEY=sk-ant-...

# 3. Run (use --host to access from phone on same WiFi)
npm run dev -- --host
```

Then open the **Network** URL shown in the terminal on your phone.

## APIs used

- **Anthropic API** (Claude Opus 4.5) — card vision recognition + deck insights  
- **Scryfall REST API** (free, no auth) — card data, images, search

## Notes

- Calling the Anthropic API directly from the browser exposes the key in network requests. This is fine for a personal local tool — do not deploy publicly.
- Camera access on iOS requires HTTPS in Safari. If it blocks, use Chrome on Android or run `npx localtunnel --port 5173` for an HTTPS tunnel.
- Scryfall rate limit is 10 req/s — well within normal usage.
