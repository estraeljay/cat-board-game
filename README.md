# Cat Board Game

A real-money-property, card-battle multiplayer board game for up to 5 players. Cats roll a
d6 to move along a procedurally-obstructed path board, land on properties and special
locations to trigger card effects, fight multi-round PvP card battles, and form (and betray)
alliances — only 2 players can ever share a win.

This repo holds the **design bible**, a **playable JavaScript prototype**, the start of a
**Unity port**, and an **`assets/` drop-in folder** for playtest art.

---

## Quick start — run the prototype

No build step, no dependencies. You need PowerShell (Windows) or any static file server.

```bash
pwsh prototype/serve.ps1
```

Then open **http://localhost:8791/prototype/** in a browser. Pick 2–5 players and classes,
hit **Start Game**. "Fast test mode" swaps the 20s/30s turn timers for 3s.

Any other static server works too — serve the **repo root** (so `/prototype/` and `/assets/`
are both reachable) and open `/prototype/`.

What's playable: board generation, movement with fork choices, the proximity menu (PvP /
alliance / heal), multi-round PvP card battles with withdrawal, alliance formation and the
3-player cap, NPC locations (Inn/Blacksmith/Church), hazard tiles (Poison Swamp / Thorn
Vines), property claims + toll + card draws, and the Coin economy. It's a hotseat build —
one screen, pass-and-play.

---

## Adding art (Higgsfield → playtest)

The prototype renders flat colours by default. Drop PNGs into **[`assets/`](assets/)** using
the exact filenames in **[`assets/README.md`](assets/README.md)** and they appear on the
board automatically — no code change, no manifest. A missing file just falls back to its
colour, so you can add art one piece at a time and re-check.

Generate everything against the single **style anchor** and the two locked projections
(top-down map view + isometric play view) in
**[`cat-dice-game-dev-skill/.../art-asset-list.md`](cat-dice-game-dev-skill/cat-dice-game-dev/references/art-asset-list.md)**
— that's the full brief, ~55 top-down + ~30 iso + ~94 card pieces. The prototype currently
uses the top-down set; iso is wired for later.

---

## Repo layout

```
MASTER-DATA-SHEET.md      Authoritative game spec. Start here for any rule.
UNIFICATION-NOTES.md      Change log for the 2026-08-28 consistency pass.
playtest-asset-checklist.md   Minimal first art batch + suggested order.

assets/                   Drop-in art. See assets/README.md.
prototype/                Playable JS vertical slice (serve + open /prototype/).
unity-port/               C# port of the prototype — PvP battle logic ported so far.

catgame-package/          Portable handoff bundle:
  design-bible/             22-section long-form design doc (HTML). Lags the master
                            sheet; pages 01–04 carry dated amendment notes.
  skills/                   Claude skills (rules + economy), self-contained copies.

.claude/skills/           Same rules/economy skills, installed for this repo.
cat-dice-game-dev-skill/  Claude skill — Unity project conventions + the art brief.
```

**`MASTER-DATA-SHEET.md` is authoritative.** Where the design-bible HTML disagrees, the
master sheet wins. Seven byte-identical copies of it exist (root + bundled with each skill);
if you change one, sync the rest.

---

## Status

- Rules layer essentially complete. Open: exact balance numbers (playtesting pass), the 3
  per-class special abilities, and the card content for design-bible §12 / §17.
- Prototype: validated by 100+ scripted random playthroughs + manual testing.
- Unity port: PvP battle state machine ported and passing EditMode tests; board/movement
  layer is next.

---

## License

Proprietary. All rights reserved. Not licensed for use, copying, or distribution.
