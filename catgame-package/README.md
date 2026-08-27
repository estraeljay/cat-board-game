# Cat Board Game — Project Handoff Package

Everything needed to start implementation in Claude Code (or any other coding environment).

## What's in here

```
catgame-package/
├── README.md                     ← you are here
├── MASTER-DATA-SHEET.md          ← single source of truth, start here
├── playtest-asset-checklist.md   ← minimum graphic assets for a first playable build
├── design-bible/                 ← the full 22-section interactive design doc (HTML)
│   ├── index.html                ← open this first to browse the full bible
│   └── 01-*.html … 22-*.html
└── skills/
    ├── catgame-coding-assistant/       ← Claude Skill for implementation work
    └── catgame-economy-balance/        ← Claude Skill for economy/balance work
```

## How to use this

**If you just need answers fast:** read `MASTER-DATA-SHEET.md`. It's a single, complete markdown file covering every locked mechanic, formula, and system — condensed from the full design bible, organized for quick lookup.

**If you want the full design history/reasoning:** browse `design-bible/index.html` in a browser. Each section shows what's locked, why, and what's still open. This is the "long form" version — useful for understanding *why* a decision was made, not just what it is.

**If you're working in Claude Code:** install both skills (copy the `skills/catgame-coding-assistant/` and `skills/catgame-economy-balance/` folders into your Claude Code skills directory, or point Claude Code at them directly). Once installed:
- The **coding-assistant** skill triggers automatically when you ask Claude to write/review/debug game logic, and will cross-check against the design reference before implementing anything.
- The **economy-balance** skill triggers when you're working through numbers, pricing, or currency-flow questions — especially useful for the still-open balance values (property leveling Coin thresholds, Gem pricing, Booster Pack economics).

Both skills bundle their own copy of the master data sheet (`skills/*/references/game-design-reference.md`), so they're self-contained and portable — you can hand either skill folder to someone else without the rest of this package.

## Current status

- The **rules layer is essentially complete.** What's left: exact balance numbers (a playtesting pass), the card content for Sections 12 & 17 (deliberately last), and the 3 per-class special abilities. The appendix of `MASTER-DATA-SHEET.md` lists every open item.
- A **unification pass (2026-08-28)** reconciled this package with a validated JS prototype and an in-progress Unity port (both live one level up, outside this bundle): class count locked to 3, board hazard tiles / ally-Heal / opening grace period promoted to canon, combat-formula wording corrected. See `../UNIFICATION-NOTES.md`.

## A note on keeping this in sync

`MASTER-DATA-SHEET.md` is the **authoritative** "compiled" version. The design-bible HTML files are the long-form reasoning archive and are allowed to lag — where they disagree, the master sheet wins (pages 01–04 carry dated amendment notes). If you make a new design decision while coding, update the master sheet and its bundled `skills/*/references/` copies, then note it for later reconciliation into the HTML.
