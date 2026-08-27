# Unification Pass — 2026-08-28

Goal: make the working tree internally consistent before moving to game-asset creation.
**No content was pulled in from the uploaded `cat-dice-game Skill package.zip`** — that zip
is an older snapshot of the handoff package and everything in it was already superseded by
files already in this tree. This pass only reconciled the files we already had.

A pre-edit backup of the whole tree was taken to the session scratchpad before any change.

---

## Decisions made this pass (the user's calls)

| # | Question | Decision |
|---|---|---|
| 1 | Named properties (4) vs generic player-placed (up to 10)? | **Named = playtest only.** Generic player-placed stays canon (reference §10). Fountain/Yarn Emporium/Fish Market/Catnip Garden are theme skins on one generic 3×3 property shell, for the prototype and first art pass. Not a design change. |
| 2 | Prototype-only mechanics (Poison Swamp, Thorn Vines, ally-Heal, opening grace, Blacksmith +2)? | **Promote to canon** — except the Blacksmith `+2 raw Attack`, which stays a prototype stand-in for the already-canon "Blacksmith levels equipment" (there's no equipment system in the prototype yet). |
| 3 | Board / art perspective? | **Two projections.** Top-down for a map/overview screen (route planning); isometric storybook diorama for the main in-game play view. Board is still the locked 20×20 **square** grid — not a round-tile track. |

Also locked in passing: **cat class roster = exactly 3** (Knight/Mage/Priest); was "3–4".

---

## Canonical-source change

`MASTER-DATA-SHEET.md` (package root) is now explicitly **authoritative**. Where the
`design-bible/` HTML pages disagree, the master sheet wins. Three bundled copies are kept
byte-synced with it:

- `.claude/skills/catgame-coding-assistant/references/game-design-reference.md`
- `.claude/skills/catgame-economy-balance/references/game-design-reference.md`
- `cat-dice-game-dev-skill/cat-dice-game-dev/references/game-design-reference.md` (newly added)
- `catgame-package/MASTER-DATA-SHEET.md`

Before this pass these were the old 23 KB version, missing the proposed property-leveling
Coin thresholds and the Gem-price framework that had been added to the root copy on Aug 20.

---

## Spec changes (`MASTER-DATA-SHEET.md`)

- **Header:** added the "authoritative" statement and a unification-pass summary.
- **§2 Core Game Loop:** proximity menu is now *pick a target, then choose* — and gains a
  conditional **4th option, Heal** (target is Poisoned *and* a current ally → cures their
  Poison, ends turn, free, not class-locked). Added the **opening grace period** (each
  player's own first 2 turns: cannot act on or be targeted by the proximity menu).
- **§3 Board Structure:** added **Poison Swamp** and **Thorn Vines** as 1×1 hazard tiles
  woven into the path network (placeholder density 3 each; final counts are 🔓 balance).
- **§4 Player Characters:** class count **locked to 3** (Knight/Mage/Priest). Called out
  that the 3 per-class **special abilities are undesigned** and block final ability art.
- **§5 HP & Combat:** reconciled **Poison** — sources are now negative property cards *and*
  Poison Swamp tiles; the per-tile bleed is the whole effect; curable at the Church (Coin
  cost) *or* by an ally's free Heal action. Added **Snared** (from Thorn Vines): next roll
  only, coin-flip gated, kept deliberately distinct from Paralysis. Noted prototype
  stand-in values (Inn heal 20).
- **§10 Property System:** added the "named properties are a playtest/first-art stand-in on
  the generic shell" clarification and the 20-card prototype deck shape.
- **Appendix:** reorganised open questions; added a new "blocks the final art pass" bucket
  (class abilities, cosmetic-customization scope); added a "resolved this pass" section.

The same edits were propagated to all synced copies.

## `design-bible/` HTML

Not rewritten page-by-page (it's the long-form archive, allowed to lag). Added visible
**"Amendment — unification pass 2026-08-28"** note blocks to:

- `01-core-game-loop.html` — Heal option + grace period
- `02-board-structure.html` — hazard tiles
- `04-hp-and-combat-mathematics.html` — Poison reconciliation, Snared, class count
- `index.html` — added a "master sheet is authoritative" callout; softened the stale
  "9/10 systems locked" framing

## `classes.md`

Combat-formula header was **wrong** — it stated `Attack − Guard, floor 0`. Corrected to the
canonical `Damage = max(1, (Attack stat + Attack card bonus) − Defense stat − Guard block)`.
Card power values are the bonus/block *terms*, not the whole damage number. This matches
what `prototype/combat.js` and `unity-port/.../CombatResolver.cs` already do.

## De-scoping the "dice-roll game" (`cat-dice-game-dev-skill/`)

This skill and its references were scaffolded for a Yahtzee-style cat dice game that is not
what's being built. The board game only ever "rolls" a single d6 to move. Changes:

- **`SKILL.md`** — rewritten. `name:` kept (`cat-dice-game-dev`, it's the installed id).
  Description no longer says "dice-roll game" / "add a new dice type"; it's now the
  **Unity project-conventions companion**, explicitly complementary to
  `catgame-coding-assistant` (rules there, project structure here). Workflows retargeted to
  cat / class / property / card content.
- **`references/game-mechanics.md`** — the `## Dice`, `## Cats`, `## Roll resolution &
  scoring` sections (all `<!-- FILL IN -->` placeholders) were removed. The file is now just
  the **property card decks** + the flat toll rule + RNG-reproducibility advice. Filename
  kept to avoid breaking the SKILL.md reference.
- **`references/coding-conventions.md`** — folder tree and asset naming retargeted from
  `DiceDefinition`/`Dice_*` to the board game's `ScriptableObject` set
  (`CatDefinition`, `ClassDefinition`, `PropertyDefinition`, `EquipmentDefinition`,
  `PvpCardDefinition`).
- **`references/testing.md`** — "roll math / probability distributions / physics-based dice
  tumbling" → combat math / board generation / scripted random playthroughs; example
  renamed `DiceRollerTests` → `CombatResolverTests` (matches the real ported file).
- **`references/build-deploy.md`** — "physics-based dice rolls behave differently on device"
  → animation timing / touch input / full-board render.
- **`scripts/README.md`** — retargeted to cat/class/property/card asset scaffolding.

## `art-asset-list.md` — full rewrite

- Board is the **20×20 square grid path maze**, square tiles. Removed the "round board
  tiles / curved corner path" language (it contradicted the locked board and the prototype).
- **Two projection tags** added to the prompting system: iso for play-view assets, top-down
  for map-view assets. Board tiles, Town Center, property/special-location blocks, and
  hazards are generated in **both**.
- Added the board assets the old list was missing: walled 5×5 **Town Center**, the
  **generic 3×3 property shell**, **Inn/Blacksmith/Church** 2×2 blocks, shared **entry-tile
  marker**, **tree + crate** obstacle variants, **boundary ring** tile, T/4-way path tiles,
  **Poison Swamp** and **Thorn Vines** hazard tiles.
- Added the **status/currency icon set** (HP, Coin, Fel, Gem, Poison, Paralysis, Snared,
  Prize Card) — also missing before.
- 4 named properties kept as the explicit **first-art-pass set** on the generic shell;
  Fountain flagged as Campaign-only.
- 3 class cats; equipment icons stay deferred (blocked on card rarity, §17); class ability
  icons left as placeholders (abilities undesigned).
- Points to `playtest-asset-checklist.md` for the minimal first batch and build order.

## Other files touched

- **`README.md`** (root) — updated the file tree, current-status, and sync guidance.
- **`prototype/README.md`** — noted which of its extensions are now canon vs still stand-in.

---

## Known remaining inconsistencies (deliberately NOT fixed here)

- **`catgame-package.zip`** (root) and **`index.html`** (root, a bare copy of
  `design-bible/index.html` with no sibling CSS/JS) are stale duplicates. Regenerate the zip
  from `catgame-package/` or delete both; they aren't load-bearing.
- The **`cat-dice-game-dev-skill/` folder name** still implies a dice game. Left as-is to
  avoid breaking paths; the SKILL.md content is now correct.
- **`design-bible/` HTML** still shows per-page "N/22 locked" stamps and open-question
  counts that predate this pass. The amendment notes cover the substance; a full HTML
  refresh is a separate task if you want the stamps accurate.

## Still open after this pass (genuinely undecided — flag, don't invent)

**Blocks final art:**
- The 3 per-class special abilities (reference §4)
- Cosmetic customization scope — modular cat rig vs one-off illustrations (§3)

**Balance pass (numbers, not design):**
- Property-leveling Coin thresholds (proposed 450 / 1,050 / 2,100 / 3,600 — hypothesis only)
- Gem price for properties (framework proposed, blocked on a Coins↔Gems rate)
- Inn/Blacksmith/Church costs; Inn heal amount
- Booster Pack contents & pricing (blocked on §17)
- Campaign reward amounts
- Equipment max level per match; hazard-tile density; starting Coin grant

**Saved for last (content work):**
- §12 Property Card Design; §17 Card Rarity & Collection
