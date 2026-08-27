# Cat Board Game — Playtest Asset Checklist

Scoped for a **first code prototype** (HTML or Unity), not final production art. The goal is mechanical clarity — every asset needs to be visually distinct and readable, not beautiful. Placeholder-friendly notes are included throughout; swap in real art later without touching game logic.

---

## 1. Board Tiles (the foundation — everything else sits on this)

| Asset | Notes |
|---|---|
| **Path tile** | Single walkable ground tile. This is the most-repeated asset on the board — keep it simple, it'll tile hundreds of times. |
| **Obstacle tile** | Trees/crates filling gaps wider than 1 tile (Section 02). One variant is enough for playtest; add visual variety later. |
| **Outer boundary tile** | The permanent path ring — can reuse the path tile, or give it a subtle border treatment so players recognize the board edge. |
| **Town Center** | 5x5 walled block, with the 4 exit tiles visually marked. This is a big, central, one-off asset — worth getting distinct even at placeholder quality, since every player starts here. |

## 2. Properties — 3 needed

Each property is a **3x3 block + 1 entry tile** (Section 02), impassable except the entry tile.

| Asset | Notes |
|---|---|
| Property block shell (3x3) | One base template — reuse the shape, differentiate by theme/color per property. |
| Entry tile marker | Visually distinct from the block itself, since it's the only interactive tile. |
| **3 distinct themes/facades** | You'll want each property to feel different (e.g., your earlier "Fish Market" example). For playtest: a color + simple icon per property is enough — don't need full illustration yet. |

## 3. Special Locations — 3 needed for a meaningful playtest

2x2 + entry tile each (Section 02). These aren't optional for a real playtest — Inn/Blacksmith/Church are load-bearing for HP, equipment, and status-effect mechanics, all of which need testing.

| Asset | Notes |
|---|---|
| **Inn** | Heals HP. |
| **Blacksmith** | Levels equipment. |
| **Church** | Cures Poison/Paralysis. |

*(Skip the Fountain for now — it's Campaign-mode-only, and Campaign is a secondary mode. Not needed for a first Prized Game playtest.)*

## 4. Player Tokens — 5 needed

Simple colored markers/pawns are genuinely fine here for v1 — you don't need cat art yet, since cat skins are purely cosmetic and don't affect anything mechanically testable. 5 distinct colors is enough to track who's who on the board.

## 5. Starter PvP Decks — 2 needed, as requested

Each deck is **10 Attack + 10 Guard** (20 cards). Two class-flavored decks means 40 unique card faces total — but you can cut this dramatically:

- **One shared card template** (Attack template, Guard template) with just the printed number/value changing per card. You don't need 40 unique illustrations — a single frame design with variable numbers is enough to playtest the actual math (Section 04's damage formula).
- **1 card back** (shared across both decks).
- Save distinct class *identity* (unique ability icon, deck flavor/theme) for later — for playtest purposes, what matters is that the numbers on the cards are readable and distinguishable as Attack vs. Guard.

## 6. Property Card Decks — start small, not the full 10-20

Section 09 specs 10-20 cards per property deck, but for a first playtest, **5-8 cards per property** (15-24 total across your 3 properties) is plenty to test the loop — draw on visit, resolve an effect, see how it feels. Full deck breadth can come once the core exchange feels right.

Each property card needs to visually communicate its effect type at a glance:
- Coin reward
- Equipment level effect
- Poison / Paralysis (negative)
- Prize Card (only 3 exist total across the whole game — these need to feel special/rare even at placeholder quality)

## 7. Status & Currency Icons (small, fast to make, still necessary)

| Icon | Used for |
|---|---|
| HP | Health display |
| Coin | Match-scoped currency |
| Fel | Persistent currency |
| Gem | Premium currency |
| Poison | Status effect |
| Paralysis | Status effect |

These are small and quick — simple, legible symbols (a drop, a skull, a lightning bolt, etc.) are fine. Don't over-invest here yet.

## 8. Equipment Slot Icons — 8 needed

Ring, Necklace, Boots, Gloves, Body Armor, Helmet, Weapon, Shield. For a first playtest, **text labels can substitute entirely** — these only matter visually once you're testing the equipment-loadout UI specifically, which is a later concern than core loop/PvP/property feel.

## 9. Turn/Timer UI

A simple countdown indicator (20s normal turn, 30s PvP turn). This is more of a UI component than a graphic asset — a numeric countdown or a shrinking bar is enough.

---

## What I'd explicitly *not* worry about yet

- Cat character art/skins (cosmetic only, zero mechanical impact)
- Booster Pack art, card rarity visual treatments (Sections 12/17 — you've already deferred these)
- Fountain and Campaign-specific assets (secondary mode)
- Level-up animations (Section 07, deferred)
- Any UI screens beyond the board/hand/battle view (collection screens, marketplace, etc. — Section 20's full list is for much later)

## Suggested build order

1. Path tile + obstacle tile + Town Center (get a board rendering at all)
2. 3 properties + entry tiles (test placement/routing)
3. Player tokens (get movement testable)
4. PvP card templates + 2 starter decks (test the combat math)
5. Inn/Blacksmith/Church (test the support loop)
6. Property card decks, small batch (test the property/reward loop)
7. Status/currency icons last (polish pass on an already-testable prototype)
