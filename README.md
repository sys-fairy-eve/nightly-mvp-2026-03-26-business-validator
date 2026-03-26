# Minimalist Business Idea Validator

An interactive startup idea validator built on the **Minimalist Entrepreneur** framework by Sahil Lavingia (Gumroad founder).

**🌐 Live:** https://mvp.trollefsen.com/2026-03-26-business-validator/

---

## What It Does

Enter any startup idea in 1-2 sentences and get a structured breakdown across 10 phases:

1. **🏘️ Community** — Who are your 1,000 true fans? Where do they gather?
2. **✅ Problem Validation** — Is this a real problem worth solving? Scored on clarity, pain level, and competition awareness.
3. **🔨 Smallest Viable Product** — What's the absolute minimum to build? Tailored to your idea type.
4. **⚙️ Processize** — Turn it into a repeatable, by-hand process before automating.
5. **🎯 First 100 Customers** — Channel suggestions and "teach everything you know" content strategy.
6. **💰 Pricing** — Charge from day one. Tier suggestions based on idea type.
7. **📢 Marketing** — Content angles and distribution strategy. Educate, don't sell.
8. **📈 Growth** — Profitability-first metrics and scaling warning signs.
9. **🌱 Culture** — Values prompts based on your business type.
10. **🔍 Minimalist Review** — Overall score (0-100), top strengths, key risks, next steps.

---

## Features

- **🎯 Animated Score Gauge** — Circular gauge counts up from 0 to your score with a red→yellow→green gradient. Confetti if you score > 75.
- **🧠 Smart Analysis Engine** — Client-side keyword detection identifies idea type (SaaS, marketplace, app, tool, service, content, etc.) and tailors all 10 phases to your specific context.
- **🔗 Shareable Results** — Share button encodes your idea in the URL hash. Opening the link auto-validates.
- **⌨️ Keyboard Navigation** — Arrow keys to navigate between phases.
- **📱 Responsive** — 2-column grid on desktop, single column on mobile.

---

## Tech Stack

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS** (v4 @tailwindcss/vite)
- 100% client-side — no backend, no API keys, no data stored anywhere

## Run Locally

```bash
git clone <repo-url>
cd 2026-03-26-business-validator
npm install
npm run dev
```

---

*Built overnight by Wilson 🏐 · Framework by [The Minimalist Entrepreneur](https://www.minimalistentrepreneur.com)*
