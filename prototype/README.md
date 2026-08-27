# Cat Board Game — Vertical Slice Prototype

Hotseat/local playtest build of the core loop: board movement (with forks), proximity, PvP battles, and alliances. Built against `catgame-package/MASTER-DATA-SHEET.md` using the `catgame-coding-assistant` skill.

> **Unification pass 2026-08-28:** four of this prototype's own extensions were promoted into the canonical spec — the **Poison Swamp** and **Thorn Vines** hazard tiles, the **ally-Heal** proximity option, and the **opening 2-turn grace period**. They're now in `MASTER-DATA-SHEET.md` (§2, §3, §5), not just "our own extension" as noted below. Still prototype-only stand-ins: the flat 100-coin toll, `STARTING_COINS = 500`, the Blacksmith raw `+2 Attack` (a placeholder for real equipment leveling), and one-time-hit Poison from swamp tiles is now the canonical per-tile bleed. See `UNIFICATION-NOTES.md`.

## Run it

```
pwsh prototype/serve.ps1
```
(or `preview_start` the `catgame-prototype` launch config), then open
**http://localhost:8791/prototype/**. The server serves the **repo root** so the prototype
can also reach the sibling `assets/` folder for drop-in art. `demo.html` is a smaller
isolated sanity check of just `combat.js`/`pvpTurns.js`.

Art: drop PNGs into `../assets/` per `../assets/README.md` and they render automatically
(`assets.js` maps names → paths; missing files fall back to flat colours).

## Files

- `board.js` — 20x20 grid, walled 5x5 Town Center, procedurally-generated single-tile-wide obstacle/path network (Section 02).
- `combat.js`, `pvpTurns.js` — damage formula and Draw/Battle/End PvP state machine (Sections 04/05), from the earlier prototype pass.
- `content.js` — Knight/Mage/Priest class decks and the Fountain/Yarn Emporium/Fish Market/Catnip Garden property card decks, pulled from `cat-dice-game-dev.skill`.
- `game.js` — turn loop, movement/forks, proximity check, alliances, victory condition (Sections 01/14), property/toll/card-draw logic.
- `app.js` / `index.html` — hotseat UI.

## Modes

The load screen offers **Prized Game** (default — the full hotseat build described below) and
**Campaign mode** (design bible §22): a PvE on-ramp with **no player-owned properties** (board
generation drops Yarn Emporium / Fish Market / Catnip Garden; Fountain, Inn, Blacksmith,
Church and hazards stay), and **bots** filling the non-human seats. Per seat on the setup
screen you tick "bot"; at least one human is required. Bots are a mid-tier, deliberately
beatable driver in `app.js` (`botAct`): they roll, choose forks (with a 40% bias toward
chasing the nearest opponent), mostly pass on proximity, occasionally propose alliances or
attack when ahead on HP, and play highest-value cards in PvP. Human decisions (fork choice,
alliance responses, PvP) still prompt normally — the bot driver only acts when a bot owns
the pending decision.

## Scope cut for this slice (not design decisions — just sequencing)

Out of scope until the loop itself is validated as fun:
- **No Gem-purchase system, no Fel.** Coins now exist (see below) but properties are claimed free by whoever lands there first, not bought.
- **No equipment system.** Players get a fixed placeholder Attack/Defense stat block as a base — all three classes share it, since `classes.md` only gave card decks, not base stats.
- Board generation produces the ring + Town Center + Blacksmith/Inn/Church + Fountain + the 3 named properties + obstacle/path network + hazard tiles.

## NPC locations & hazards

- **Blacksmith** (2x2, single entry): landing on the entry gives a permanent +2 Attack, stacking on repeat visits. Stand-in for the locked design's equipment-leveling mechanic (no equipment system built yet) — a real implementation should level equipment, not buff a raw stat directly; flagged as a deliberate simplification, not a design change.
- **Inn** (3x3, two entries — north and south of the center column): no auto-effect on landing. At the start of any turn spent standing on an Inn entry tile, the player gets a "Rest at Inn" option instead of rolling — skips the turn, heals 20 HP (capped at 100).
- **Church** (2x2, single entry): landing there automatically cures Poisoned.
- **Poison Swamp** (1x1, scattered — 3 by default): triggers on every tile of movement through it, not just stopping — 1 HP damage (floored so it can't eliminate on its own) plus the Poisoned status. Cured by visiting Church, or by an allied player choosing "Heal" from the proximity menu when adjacent (see below).
- **Thorn Vines** (1x1, scattered — 3 by default): triggers on pass-through — applies a "snared" status. Consumed on the player's *next* roll: they roll a check die first (even → roll again normally for distance; odd → forced to move exactly 1 tile).
- **Ally-heal proximity action**: a new 4th proximity-menu option, "Heal," appears when the nearby target is Poisoned *and* the active player is allied with them. Cures the poison, ends the turn. This is our own extension, not a class-locked ability — any allied player can heal, not just a dedicated Healer class. Worth a real design decision later if a class-locked heal ability is wanted (Knight/Mage/Priest don't have unique abilities yet either, just their card decks — see below).

## Classes & property cards (from `cat-dice-game-dev.skill`)

The user pointed at `cat-dice-game-dev.skill` as the source of truth for class and card content — extracted into `content.js`. Two things from that file were deliberately **not** adopted as-is:

- **Combat formula**: the source file's own formula (`Attacker's Attack power − Defender's Guard power`, floored at 0 — card values only, no separate stats) was **not used**. The prototype keeps the already-locked, already-tested formula from `MASTER-DATA-SHEET.md`/`combat.js`: `max(1, attackStat + cardValue − defenseStat − guardValue)`, floored at 1 so a battle can never stall at 0 damage. The class decks' card power values (1–10) are plugged in as the card-bonus/card-block terms in that formula, not as the whole damage number.
- **Unity/C# architecture**: the `.skill` file's own frontmatter describes a Unity dice-roll game (ScriptableObjects, physics-based dice, `DiceDefinition`/`CatDefinition` assets). Only the *content* (class decks, property card decks, the toll rule) was pulled into this JS prototype — the Unity conventions weren't adopted, since this prototype isn't a Unity project.

**Classes**: Knight, Mage, Priest. Each player picks one at setup (or leaves the default assignment). Each class has its own 20-card PvP deck (10 Attack + 10 Guard, power 1–10, all named) — this replaces the old shared placeholder card-value arrays; base Attack/Defense stats are still shared/placeholder (see above).

**Coins**: every player starts with 500 (`STARTING_COINS` in `content.js`) — not specified anywhere, an arbitrary round starting figure, easy to retune.

**Fountain** (NPC property, no owner): draws a card from its 20-card deck on landing, no toll.

**Yarn Emporium / Fish Market / Catnip Garden** (player-claimable properties): first player to land there claims it for free (no purchase — see scope cut above). A non-owner landing there pays a flat **100-coin toll** to the owner *before* drawing; if they can't afford it, the whole visit is a no-op (no partial payment, no card draw) — this rule was explicit in the source. Landing on your own property just draws, no toll.

Every deck (Fountain + the 3 properties) has the same shape: 3 special-effect cards (one grants a bonus, one clears debuffs, one grants a cosmetic-for-now item), 9 coin-gain cards, 7 coin-loss cards, 1 wildcard (50/50 gain or loss). Two effects were explicitly left unspecified in the source file itself (marked "FILL IN" there, not just under-specified relative to it) and got a placeholder implementation, flagged in `content.js`/`game.js`:
- **"Special reward" cards** grant a flat +500 coins — the source describes "grants a bonus reward-tier card" without defining what a reward tier is.
- **"Reward item" cards** get added to the player's `items` list and logged, with no mechanical effect — there's no equipment/item system yet for them to plug into.
- **Draw weighting/reshuffle timing**: shuffle + draw-without-replacement + reshuffle-when-empty, matching the already-established PvP deck convention — the source flagged this as unresolved too.

### Interpretation calls made building these (flagged, not silently decided)

- **Entry tile placement**: read "entry on the lower-right tile" / "upper or lower center tile" as *external* tiles adjacent to that edge of the block, mirroring the locked design's own property rule ("entry tile above the block's center") rather than one of the block's own interior cells. Blacksmith/Church entry sits one tile south of the block's bottom-right corner; Inn gets *both* the north-of-top-center and south-of-bottom-center tiles as active entries (not a single random pick).
- **Poison**: per direction, this is a one-time hit (not the locked design's continuous "1 HP per tile moved" Poison from property cards) plus a status flag that needs curing. Since no property cards exist in this build yet, there's no actual clash today, but reconciling these into one Poison mechanic (or keeping them distinct) is an open question for whenever properties get built.
- **Hazard tile counts** (3 Poison Swamp, 3 Thorn Vines) are an arbitrary placeholder density, not specified.
- **Board generation repair pass**: the maze-carving algorithm's "no 2x2 open" constraint can occasionally strand a door or NPC entry behind cells that all got rejected during growth. Added a connectivity check + repair (forces a direct connector, ignoring the 2x2 constraint for that one narrow fix) so every entry is always reachable — caught by testing, not by inspection.

## Opening grace period

On a player's own first 2 turns, they can't initiate PvP/alliance/heal against anyone, and no one else can target them either — landing near a grace-period player just skips the proximity menu (or drops them from the target list if others nearby are still selectable), logs a line, and ends the turn. Not in the locked design — added per direction, to stop turn-1 rushes.

- **Per-player, not global**: each player gets their *own* first 2 turns protected, tracked via `player.turnNumber`, not "the game's first 2 turns overall" (which would only protect whoever happens to go first/second in turn order and leave everyone else exposed from turn 3 on regardless of their own turn count).
- **Full bidirectional protection**: `_resolveLanding()` checks grace twice — once for the active player as initiator (blocks the whole menu if they're still in their own first 2 turns), and once by filtering the nearby-players list down to only non-grace players before building the target list (so a grace-period player can't be landed on and targeted by someone else either, even if that someone else is long past their own grace window). If everyone nearby is still in grace, it's the same as no one being nearby.
- **Skip roll (auto-skip) and Rest at Inn both count as a turn** for grace purposes, same as an actual roll — a player doesn't get extra grace turns by not rolling.

## Interpretations of ambiguous/underspecified rules (flagged, not invented silently)

- **Dice**: the locked design never specifies dice type/count. Using a single d6 as the simplest placeholder.
- **20s roll timer**: read literally as gating only the roll itself (design's own wording: "Unused = turn is auto-skipped entirely"). Fork choice and the proximity menu are not separately timed.
- **30s PvP turn timer**: only auto-resolves the *defender's* guard decision on expiry (defaults to no guard — a clean, well-defined no-action state). The *attacker's* decision is always manual, whether or not they hold an attack card — there's no clean "force-skip while holding a playable card" behavior to fall back to, and per direction, ending a no-attack-card turn is a deliberate manual "Pass" click, never auto-forced by the timer.
- **Attacker with no attack card in hand**: not covered by the locked design. Added `PvpBattle.passAttackNoCard()` — the turn passes with no attack, same reasoning as the timer auto-skip.
- **Multiple players in proximity range**: implemented as a target-select step before the 3-option menu, since the design describes one menu but doesn't say how simultaneous multi-player proximity is handled.
- **Alliance group cap (3 players)**: enforced at *accept* time. If accepting would exceed the cap and the responder is already in a (full) alliance, they're prompted to either leave their current alliance and join the new one, or decline and stay put. If leaving wouldn't even help (the *proposer's* group is the one that's full), it falls back to a graceful non-formation instead. None of this is specified by the locked design — it's our own call, made explicit rather than left as a silent failure.
- **Hotseat card visibility**: the design specifies hand size is hidden from opponents in a real multiplayer client. This build shows whoever's turn it is their own hand only (pass-and-play convention) — not a substitute for real hidden information once this goes multiplayer.

## Known-good via testing

Verified in-browser: manual click-through (roll → fork → movement) and 100+ scripted random playthroughs (2- and 5-player) driving the real `Game`/`PvpBattle` classes through rolls, forks, proximity, PvP (including withdrawal and no-attack-card edge cases), alliance formation (including the 3-player-cap, the leave-and-join flow, and the "3 allied survivors doesn't force resolution" rule), and the NPC locations/hazards (Inn rest, Blacksmith buff, Church cure, Poison Swamp, Thorn Vines, ally-heal) — zero uncaught errors, both solo and alliance win conditions triggered correctly. Also verified board generation directly: 150+ regenerations (including the 4 new blocks) with no placement failures and full connectivity (every door/entry reachable) after adding the repair pass above.

Property/class systems specifically: 15+ scripted 5-player playthroughs exercising claims, card draws, and coin swings with zero crashes; then directly unit-tested the toll path (deduction + no-op-when-can't-afford), the wildcard coin-loss floor (can't go negative), and the reward-item grant, since random play alone wasn't hitting those (low per-deck odds — 1 wildcard and 1 reward-item card in 20, tolls need a property to already be owned by someone else).

Grace period: directly unit-tested all 4 combinations (actor free + target in grace, actor in grace, all nearby in grace, all free) confirming the target list correctly filters out grace-period players independent of the actor's own status; then re-ran the full 20-playthrough stress test with explicit assertions on *both* sides (would flag as a crash if the proximity menu was ever reached with the acting player, or any listed target, still at `turnNumber <= 2`) — 153 grace-period blocks logged across those games, zero violations either direction.
