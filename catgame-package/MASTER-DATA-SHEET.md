# Cat Board Game — Master Data Sheet

**Purpose of this document:** the single source of truth for every locked game-design decision. Written for both humans and AI assistants (Claude Code, design tools) to reference when implementing or discussing this game. Anything marked 🔓 OPEN is genuinely undecided — do not invent an answer, flag it instead. Anything not marked open is locked and should be treated as fixed unless the user explicitly changes it.

> **This file is authoritative.** Where the `design-bible/` HTML pages disagree with anything here, this file wins. The HTML bible is the long-form reasoning archive; it lags behind this sheet by design (see `UNIFICATION-NOTES.md`).

Status at last update: **rules layer essentially complete.** Remaining work is (a) exact numeric balance values deferred to a dedicated playtesting/balance pass, (b) card-content work (Sections 12, 17) deliberately saved for last, and (c) the per-class special abilities (Section 4). Everything else is locked.

**Unification pass — 2026-08-28.** Reconciled this sheet with the JS prototype and the Unity port. Changes: cat classes locked to exactly **3** (Knight/Mage/Priest); four prototype mechanics promoted to canon — **board hazard tiles** (Poison Swamp, Thorn Vines), the **ally-Heal proximity option**, and the **opening 2-turn grace period** (all detailed below). The four named properties (Fountain, Yarn Emporium, Fish Market, Catnip Garden) are a **first-art-pass / playtest stand-in** layered on the generic player-placed property system — they are not a design change to Section 10. Full change log: `UNIFICATION-NOTES.md`.

**Design revisions — 2026-08-28 (owner decision, edits locked sections):**
1. **Movement — roll a maximum, move 1..N of your choice** (Section 2 / Section 3). The die is a ceiling, not an exact step count; the player stops where they like within range. Fixes property-visit friction; movement randomness retained. Implemented in the prototype.
2. **Property leveling — optional Gem accelerator** (Section 11): spend Gems to waive the cumulative-Coin threshold for one level-up; the Fel cost is still paid. Fel stays a leveling sink; money accelerates, doesn't gate.

---

## 0. Game Overview

A real-money-property, card-battle board game for up to 5 players per match. Players roll dice to move cat characters along a procedurally-obstructed path network, land on properties/special locations to trigger effects, and can engage in multi-round PvP card battles with other players. The core tension is a formal but mechanically toothless **alliance system**: players can ally, but betrayal is always free, and only 2 players can ever share a win — creating deliberate, structural pressure toward betrayal in larger alliances.

Two game modes exist: **Prized Game** (real stakes, variable entry fee, full economy) and **Campaign** (free, PvE-primary, practice/onboarding).

---

## 1. Currency System (read this first — referenced everywhere)

| Currency | Scope | Source | Sink/Use |
|---|---|---|---|
| **Coins** | Match-tracked, but the ending total becomes the player's *permanently* (never resets to zero, never pooled with teammates even in a shared win) | Property rent, property card draws, Campaign rewards | Property rent payments, the property-leveling Coin gate, and paying to use Inn/Blacksmith/Church. **Exactly these three uses, nothing else.** |
| **Fel** | Fully persistent, cross-game | Winning a Prized Game (80% of the entry-fee pot), a small starting grant for new players, small Campaign rewards, Gem purchases | Property-leveling cost (Section 11's table), Prized Game entry fees |
| **Gems** | Persistent, premium | Primarily real-money purchase; small amount earnable via in-game bonuses/events (not a "no free path" currency) | Buys Fel directly; purchases properties, Booster Packs, cosmetic cats, board themes, other cosmetics |

**Key economic principles:**
- The Prized Game entry-fee pot is **zero-sum among players plus a deliberate burn** — it doesn't inflate the Fel supply on its own.
- Property leveling switched from a "visits" gate to a **cumulative-Coins-earned-by-the-property** gate (rent + card draws), while Fel remains the cost. This ties investment to a property actually being used/popular, not just existing.
- On PvP elimination: winner takes **80%** of the loser's Coins, loser keeps 20% (revised from an initial 90/10).
- Prized Game entry-fee pot: **80% to winner(s), 20% permanently burned** (a deliberate Fel sink).
- 🔓 OPEN: exact Gem price for properties; exact Coin thresholds for property leveling (needs rent-rate and property-card-value data first); Booster Pack contents/pricing.

---

## 2. Core Game Loop (Section 01 — LOCKED; movement resolution revised 2026-08-28)

**Turn sequence:** Start Turn → Roll a **maximum** distance → Move **1 to that many** tiles along the path network (player's choice, choosing a direction at forks and choosing when to stop) → Resolve Landing Location → Check Proximity → optional proximity menu (pick target → PvP / Do Nothing / Propose Alliance / conditional Heal) → End Turn.

- **Movement is roll-a-maximum, move-your-choice (revised 2026-08-28).** The roll (a d6 in the prototype — dice type still not otherwise locked) sets an *upper bound*. The player then moves **1 up to that many** tiles and may **stop on any tile within range**, including partway through the roll. Rationale: under fixed "move exactly the rolled number," reliably landing on a specific property/special-location entry tile was a hassle; letting the player choose the distance removes that friction. The randomness is deliberately kept — you still can't guarantee reaching a fleeing player or dodging every encounter, so the chasing/alliance/betrayal tension (Section 0, Section 3) is preserved. A player must move **at least 1 tile** if any legal move exists (no "stay put").
- **Snared interaction (Section 5):** if the check die comes up odd, the player is forced to move **exactly 1 tile** that turn (no distance choice). Even → normal roll-a-maximum.
- **20-second timer** per normal turn. Unused = turn is **auto-skipped entirely** (no roll, no move).
- Cards (any type) can only be used after landing, on the player's own turn — never before rolling, never reactively on someone else's turn.
- Three card pools: **Property Deck** (visitor draws only — owner never draws), **Equipment cards** (the 8 gear slots), **PvP Deck** (Attack/Guard, used only inside a battle).
- Passing through a property without stopping still triggers nothing — but since the player now chooses their stopping tile, "I couldn't stop there" is no longer a reason to miss a property within range.
- **Proximity check** (after landing): for each player within distance 0–1 (8-directional, including the landed-on tile), the active player gets a menu: **Initiate PvP**, **Do Nothing**, **Propose Alliance**, or — conditionally — **Heal** (see next bullet). Where multiple players are in range, the active player first picks one target, then sees the menu for that target.
- **Heal (4th proximity option, conditional — promoted to canon in the unification pass):** shown only when the chosen target is **Poisoned** *and* is a **current ally** of the active player. Cures the target's Poison and ends the active player's turn. Not class-locked — any allied player can Heal. Free (no Coin cost, unlike the Church).
- **Opening grace period (promoted to canon):** during each player's **own first 2 turns** (tracked per-player, not the game's first 2 turns globally), that player can neither initiate PvP/Alliance/Heal nor be targeted by anyone else's proximity menu. A grace-period player is simply dropped from others' target lists. Skipping a turn or resting at the Inn still counts as one of the 2 grace turns.
- **Alliance** is formal and tracked (not emergent). Proposing gives the target an immediate accept/decline interrupt. If declined, the active player may still initiate PvP that turn. Alliances can also be proposed after an accepted PvP withdrawal, by either party. An alliance has **zero mechanical restriction** — betrayal is always free, no cooldown.
- Multiple players can share a tile with no blocking.
- **Win condition:** last player, or last allied group (max 2 winners), standing.

---

## 3. Board Structure (Section 02 — FULLY LOCKED)

- **20x20 fixed grid.** Outer ring = permanent path (hard boundary, no wrap-around).
- **Town Center:** walled 5x5 block at dead center, all players start here, exits via **4 middle tiles** (one per edge).
- **Movement is path-following, not free 2D movement.** Any blank gap wider than 1 tile is filled with obstacles (trees/crates), leaving only a single-tile-wide path network. At forks, the player **actively chooses** which branch to take — intentional, to enable **chasing dynamics** between players. Distance is **roll-a-maximum, move 1..N of the player's choice** (revised 2026-08-28 — see Section 2); the die sets a ceiling, not an exact step count.
- **Board generation:** grid/Town Center/outer ring are fixed every game. Property placement is player-chosen each game. The obstacle/path layout filling the gaps is **procedurally generated after** properties are placed.
- **Properties:** 3x3 impassable block + 1 entry tile (10 tiles total, entry tile above the block's center). Must be **at least 1 tile apart** from any other property. Max **2 per player**, up to **10 total** on one board (5 players × 2).
- **Special locations:** Inn (heal HP), Blacksmith (level equipment), Church (cure Poison/Paralysis) — one of each, 2x2 block + 1 entry tile, randomly placed at game start, **all three cost Coins to use**.
- **Board hazard tiles (1x1, scattered — promoted to canon in the unification pass):**
  - **Poison Swamp** — triggers on *every tile of movement through it*, not just stopping. Applies the **Poisoned** status (Section 5). Placeholder density in the prototype is 3 per board; final count is a balance-pass number (🔓).
  - **Thorn Vines** — triggers on pass-through. Applies **Snared** (Section 5): the player's *next* roll is gated by a coin-flip check die (even → roll normally; odd → move exactly 1 tile), then Snared clears. Distinct from Paralysis. Placeholder density 3 per board (🔓 final count).
  - Both are woven into the procedural path network like obstacles; exact placement rules for them are an implementation detail, not a locked design.
- **No shortcuts or portals.**
- **Dungeons are cut entirely from scope** — replaced by the Prize Card system.

---

## 4. Player Characters & Classes (Section 03 — class count now locked)

- Cats **do** affect PvP — via their class, not the skin.
- **Exactly 3 Cat Classes: Knight, Mage, Priest** (locked in the unification pass — was "3–4"). Each class has a class-flavored **starter PvP deck** — exactly 10 Attack + 10 Guard, power values 1–10 per type, all cards named. Full card lists live in `references/classes.md` (skill bundle) and `prototype/content.js`.
- Each class is also meant to grant **one unique special ability**. 🔓 OPEN: the abilities themselves are undesigned — prototype and Unity port currently ship classes as *deck flavor only*, no active ability. Ability design blocks the final card-frame / HUD ability-icon art (flag when that art pass comes up).
- A "cat" = cosmetic skin; a "class" = functional gameplay category. Multiple skins can share one class.
- Unlock: both purchasable (Booster Packs/Gems) and earned via Campaign.
- Starting/Max HP: 100, from equipment only — no separate character-level stat system.
- Movement is fully uniform across all cats/classes.
- 🔓 OPEN: cosmetic customization scope (deferred to asset creation); the 3 class special abilities (see above).

---

## 5. HP and Combat Math (Section 04 — 15/18 resolved, 3 deferred)

- **Base HP = 100**, modified only by equipment.
- **Equipment slot → stat mapping:** Weapon, Gloves, Ring → **Attack**; Shield, Body Armor, **Boots** → **Defense**; Helmet, Necklace → **HP**.
- **Damage formula:**
  ```
  Damage = max(1, (Attacker's Attack stat + Attack card bonus) − Defender's Defense stat − Guard card block value)
  ```
  The floor of 1 guarantees progress every resolved attack — stalemates are mathematically impossible.
- No counterattacks, no simultaneous damage — only the active attacker of a turn deals damage; roles alternate.
- Turn order: PvP initiator attacks first, then alternates.
- Battle duration: multi-round, no hard cap. Ends at 0 HP or an accepted withdrawal.
- **Healing:** Inn, for a Coin cost (amount TBD). Prototype value: rest = skip the turn, heal 20 HP, capped at 100.
- **Poison (Poisoned status):** 1 HP damage per tile moved while active (the per-tile bleed is the whole effect — a "one-time hit on entry" is not a separate thing). **Sources:** negative property cards *and* **Poison Swamp** hazard tiles (Section 3). No natural expiration. **Cured by:** the Church (Coin cost) **or** an allied player's **Heal** proximity action (Section 2 — free).
- **Paralysis:** caps movement to 2 tiles for 5 turns. Inflicted by negative property cards. Expires naturally after 5 turns, or early via Church (Coin cost).
- **Snared status (from Thorn Vines tiles, Section 3):** affects only the player's *next* roll — a coin-flip check die: even → roll normally for distance; odd → forced to move exactly 1 tile. Clears immediately after that roll. Lighter and shorter than Paralysis; the two are deliberately kept as distinct effects.
- 🔓 OPEN (deferred to asset creation): critical hits, damage cap/ceiling, multiple Guards per one Attack.

---

## 6. PvP Turn Structure (Section 05 — 10/12 resolved)

Full multi-round card battle (Draw/Battle/End phases — simplified from an earlier Spell/Trap concept).

- PvP initiator goes first. Both players draw a **5-card starting hand**.
- **30-second timer per turn** (distinct from the 20s normal-turn timer). Auto-ends if unused.
- **Phases:** 1) Draw Phase (draw 1) → 2) Battle Phase (set 1 Attack card face-up; opponent may respond with 1 Guard card) → 3) End Phase (passes to opponent).
- Roles (attacker/defender) alternate each turn.
- Attack resolves immediately in the Battle Phase — no lingering "Battle Lock" (that concept is dropped).
- **Withdrawal:** either player, any point mid-battle, opponent accepts/denies, **one attempt per battle**, no penalty, ends with no winner/elimination/transfer.
- **Deck empties mid-battle:** standard shuffle-when-empty (discard reshuffles into the deck).
- 🔓 OPEN (deferred): multiple Guards per one Attack (same as Section 04).

---

## 7. The 20-Card Deck (Section 06 — FULLY LOCKED)

- Deck: **10 Attack + 10 Guard**, one use per card per cycle.
- Starting hand: 5. Draw: 1 per own turn (Draw Phase).
- **Max hand size ~10** — excess discarded on draw.
- No voluntary discard. Played cards are simply removed from play (no tracked "Used" state, no inspection of past-used cards).
- Full cycle (all 20 used) resets the deck completely — nothing carries over.
- **Visibility:** hand size is hidden from opponents. Tabled cards (currently being played) **are visible** to the opponent.

---

## 8. Equipment System (Section 07 — 14/17 resolved)

"Permanent ownership, temporary match-level power": every equipped item **resets to Level 1 at the start of each match**.

- 8 slots: Ring, Necklace, Boots, Gloves, Body Armor, Helmet, Weapon, Shield (stat mapping in Section 5 above).
- Slots level **independently**.
- **Leveling sources:** primarily **Blacksmith** (Coin cost, levels all 8 slots +1 per visit — proposed default), plus property card draws as a secondary source.
- **Max level per match: proposed 3–5** (needs playtesting).
- Equipment can be acquired via Booster Packs, Campaign rewards, and events.
- Equipment loadout is chosen between matches, **locked once a match starts** (same as property placement).
- Equipment **can be traded and sold**, like properties.
- **No durability** — doesn't degrade/break, only the temporary level resets each match.
- Property effects (positive or negative) are **bounded by the match's max level cap** — can't push past it.
- **Level 1 is a hard floor** — negative property cards can't push equipment below it.
- 🔓 OPEN (deferred — rewards/assets): level-up animation/reward, equipment rarity (ties to Section 17), equipment collection screen.

---

## 9. Equipment Progression Balance (Section 08 — 6/7 resolved)

- PvP wins do **not** accelerate equipment leveling (Blacksmith/property cards only).
- Losing PvP does **not** reduce equipment level.
- Properties **can** damage equipment (negative property card effects can reduce level, bounded by the Level 1 floor above).
- 🔓 OPEN: how quickly a player can realistically reach max level within one match — genuinely needs real playtesting data, can't be answered by design discussion alone.

---

## 10. Property System (Section 09 — 18/19 resolved)

- Permanent, single-owner ownership (no co-ownership). Purchased with **Gems**.
- Owner places at game setup on a blank interior tile, ≥1 tile from any other property. **Max 2 per player.**
- **Canonical model: generic, player-placed properties** (up to 10 per board). The named properties **Fountain, Yarn Emporium, Fish Market, Catnip Garden** used by the prototype and the first art pass are a **playtest / first-art-pass stand-in** — visual + deck skins on the generic 3×3 property shell — *not* a switch to a fixed-property design. (Fountain in particular is otherwise a Campaign-only NPC location, Section 3 / Section 23.) Their card decks live in `references/game-mechanics.md` / `prototype/content.js`.
- 10–20 card effect deck per property (start smaller for playtest — see asset checklist). Prototype decks are 20 cards each: 3 special/named + 9 coin-gain + 7 coin-loss + 1 wildcard.
- Visit = ending movement there. **Only the visitor draws** (never the owner).
- Exists **only in Prized Games** — none in Campaign.
- **Leveling gate:** cumulative Coins earned by the property (rent + card draws) — replaces the old "visits" concept. Fel is the cost (Section 11).
- **Rent:** visitor pays owner Coins directly on visit (this is both the owner's benefit and the leveling-gate source).
- **Rent stays flat regardless of level** — instead, higher property levels improve **card quality/rarity**.
- Placement is **locked in for the whole game instance** once chosen (no relocation mid-match); a fresh spot is chosen each new game.
- Card draw: **exactly 1 per visit**. Deck reshuffles when exhausted (standard shuffle-when-empty).
- Property card effects **only ever affect the visitor**, never the owner.
- Can be sold only when **unplaced** (not in an active/upcoming match).
- On owner elimination: fully protected (see Section 12 below) — stays on board but goes inactive.
- 🔓 OPEN: exact Gem purchase price (deferred).

**Proposed pricing framework (unconfirmed, blocked on a missing rate):**
- Model the Gem price as a **payback period** on the property's expected rent income — the same shape as a real-money purchase in any F2P economy: `Gem price ≈ (expected rent income over N games) converted to Gems`.
- Expected rent income over N games = (rent per visit) × (~4 visits/game, same planning assumption as Section 11 above) × N games. Using the proposed 20-Coin flat rent from Section 11 and a target payback window of, say, 15–20 games (a few weeks of casual play — long enough that the property is a genuine investment, short enough to feel worth buying), that's roughly **1,200–1,600 Coins** of rent income to "pay back."
- **Blocked here**: converting that Coin figure into a Gem price requires a **Coins↔Gems (or Coins↔Fel↔Gems) exchange rate**, which isn't defined anywhere in the current doc — Gems currently only have a defined relationship to Fel ("buys Fel directly"), not to Coins, and Coins are explicitly *not* a general-purpose/tradeable currency (Section 1), so a direct Coins→Gems conversion may not even be the right mental model.
- Recommend resolving in this order before finalizing a number: (1) lock the real-money-to-Gems rate, (2) lock a Gems→Fel rate, (3) re-derive property Gem price from expected Fel-equivalent value (rent income *and* the property's role as a Fel-leveling investment) rather than from Coins directly, since Coins deliberately can't cross currency boundaries.

---

## 11. Property Economy (Section 10 — FULLY LOCKED; Gem accelerator added 2026-08-28)

- Two-currency system as described in Section 1 above.
- **Fel sinks:** property leveling cost + the 20% Prized Game pot burn. **Both remain** — the 2026-08-28 revision did *not* remove Fel from leveling (that would leave only one Fel sink and risk Fel inflation). See the Gem accelerator in Section 12.
- **Coin source:** property rent + card draws.
- **Resale market:** player-driven (owners list, buyers purchase directly — not NPC/algorithmic). Currency: **Gems**, buyer to seller, **zero-sum transfer** (no new currency created — protects against inflation). **5% resale fee** on transactions. Prices are **not fixed** — sellers set their own asking price (inherently variable, since it's player-driven).

---

## 12. Property Leveling (Section 11 — nearly locked)

| Level transition | Coins earned by property | Fel cost |
|---|---|---|
| 1 → 2 | 🔓 TBD (proposed: **450**) | 750 Fel |
| 2 → 3 | 🔓 TBD (proposed: **1,050**) | 1,750 Fel |
| 3 → 4 | 🔓 TBD (proposed: **2,100**) | 3,500 Fel |
| 4 → 5 | 🔓 TBD (proposed: **3,600**) | 6,000 Fel |

- **Level 5 is a hard cap** — no levels beyond it.
- Fel costs are fixed regardless of the match's stake tier (Fel is fungible/persistent).
- **Two things gate a level-up:** (1) the property has earned its cumulative-Coin threshold (rent + card draws — the "payment of stepping on it"), and (2) the owner pays the Fel cost.
- **Gem accelerator (added 2026-08-28):** the owner may spend a set amount of **Gems** to **waive the cumulative-Coin threshold** for one level-up — the Fel cost is **still paid**. This keeps money as an *accelerant* (skip the grind), not a *hard skip* (you still need Fel, which is earnable by winning Prized Games), so it doesn't break the anti-pay-to-win principle, and it adds a real Gem sink without removing a Fel sink. It does **not** raise the Level 5 cap or change card-quality scaling.
- 🔓 OPEN: the Coin threshold numbers (needs rent-rate and property-card-value data first — explicitly a rebalancing task, not a design question). **Starting hypothesis proposed below — not locked, needs playtesting.**
- 🔓 OPEN: the **Gem amount per tier** for the accelerator. Should scale with the tier's Fel cost converted at the (still undefined) Gems↔Fel rate, and sit high enough that grinding the Coin gate stays the default path for non-payers. Frame as a proposal only until the Gems↔Fel rate exists (same blocker as the property Gem price, Section 9/10).

**Proposed Coin thresholds — reasoning (unconfirmed, playtest hypothesis):**
1. Anchored on the design's own stated working assumption of ~3–6 visits/game/property; took a mid-range ~4 visits/game as the planning figure.
2. Reused the shape of the now-superseded ~15→110 cumulative-visits curve (its growth ratios — 2.33×, 2.0×, 1.71× — mirror the already-locked Fel cost curve almost exactly), giving cumulative visit-equivalents of **15 → 35 → 70 → 120**.
3. Proposed an average per-visit Coin value of **~30 Coins** (flat rent ~20 + average card-grant value ~10 — both themselves unanchored, since no other Coin-denominated cost exists yet in the locked doc; Inn/Blacksmith/Church/Healing are all still TBD too). This is the weakest link in the chain and the first thing a real playtest should calibrate.
4. Multiplying cumulative visits × 30 Coins/visit lands on thresholds that are a clean **60% of the matching Fel cost at every tier** (450/750, 1,050/1,750, 2,100/3,500, 3,600/6,000) — a simple, memorable ratio, though that cleanliness is a side effect of the assumed 30-Coin figure, not independent confirmation.
5. At ~4 visits/game, Level 5 lands around **~30 games** — weeks of casual play, not one match, matching the design intent.
6. **Do not treat as final** — the 30-Coin/visit assumption has no independent anchor in the current doc. First real playtest data should recalibrate it, and everything downstream moves proportionally.

---

## 13. Property Card Design (Section 12 — 🔓 LARGELY OPEN, deliberately deferred to last)

**Confirmed possible card effects:**
- Grant **Coins** (amount depends on card)
- Grant a **Prize Card** (see Section 16 — only 3 exist per game instance, seeded into eligible property decks)
- Grant/modify **equipment level** (bounded by the match max, floor at Level 1)
- Inflict **Poison** or **Paralysis** (negative effects)

🔓 OPEN (everything else): deck size per property, duplicate cards, card rarity, draw probability, positive/negative ratio, whether decks scale with property level. **This entire section is intentionally saved for last**, per the design owner's explicit sequencing choice — it's asset/content work, not core logic.

---

## 14. Dungeons (Section 13 — CUT ENTIRELY)

Does not exist. Replaced by the Prize Card system. Do not implement.

---

## 15. Game Victory Condition (Section 14 — FULLY LOCKED)

- Win: last player, **or** last allied group (**max 2 winners**), standing.
- **Max alliance size: 3 players.** If 3 allied players are the last ones standing, the game does **not** force resolution — players must PvP each other down to 2 themselves.
- **Prize Cards:** exactly 3 per game instance, seeded into property decks. **Visible to all players** at all times (not hidden). Holding one at game's end = personal claim of its full payout, **bypassing the shared-win split entirely**, even between allies. Stealable via ordinary PvP elimination (winner picks which cards to take).
- **Coins are never pooled/split**, in any win scenario — deliberate second betrayal incentive alongside Prize Cards.
- Non-Prize-Card shared-win rewards: most individual PvP wins picks first.
- Elimination: winner takes **80%** of loser's Coins, loser keeps 20%.
- **Alliance negotiation offers:** Coins and reward cards (property-type cards) — not the core PvP deck.

---

## 16. Player Elimination & Asset Protection (Section 15 — FULLY LOCKED)

- Permanently-owned real-money assets (properties, equipment) are **always protected** — never transfer via PvP, regardless of elimination.
- Only in-match Coins (80/20 split) and cards (winner's choice) transfer on elimination.
- A protected property stays on the board but goes **inactive** for the rest of that instance — no card triggers, not available to others, not NPC-controlled, not auctioned. Ownership untouched.

---

## 17. Monetization (Section 16 — nearly locked)

- **Gems** (see Section 1) buy Fel, properties, Booster Packs, **cosmetic cats, board themes, and other cosmetics**.
- 🔓 OPEN: exact Booster Pack contents/pricing (deferred — ties to Section 12/17 card content).

---

## 18. Card Rarity & Collection (Section 17 — 🔓 LARGELY OPEN, deliberately deferred to last)

Proposed tiers only: Common, Uncommon, Rare, Epic, Legendary, optionally Unique/Special. Nothing else decided. **Intentionally saved for last**, alongside Section 12.

---

## 19. Multiplayer Rules (Section 18 — FULLY LOCKED)

- **Max 5 players** per board.
- **Timers:** 20s normal turns, 30s PvP turns, both auto-skip/auto-end.
- **AFK/Disconnect/Reconnection system** (identical treatment for idle or disconnected):
  1. 20s idle → **idle warning** shown.
  2. Still unresponsive on next turn → **AI bot takes over for up to 5 of that player's own turns** (a reconnection grace period). The human can reconnect and resume control at any point during this window.
  3. Not returned by the start of turn 6 under AI control → **automatic elimination**: no rewards, Fel entry fee **not refunded**.
  - The AI-controlled character is a **normal active player** during the grace period — ordinary PvP/elimination rules apply, so another player can defeat it directly, resolving the disconnect early via the normal elimination path.
  - **Bot difficulty: mid-tier** — competent enough not to break game flow, but **deliberately easy for real players to eliminate** if targeted.
- Host leaving has no special handling — covered by the AFK system regardless of role.
- Matchmaking: **fully random** (all players start mechanically equal each match).
- Both **private (invite) and public (matchmaking)** lobbies supported.
- **Spectators:** eliminated players only, not non-participants.
- **Pause:** any player can propose (takes effect immediately); **resuming requires all players confirmed present**, with a recall notification sent to absent players.
- **Expiration:** scales with the match's stake tier — 100-500 Fel: 48h, 501-1,000 Fel: 96h, 1,001-2,000+ Fel: 1 week.
- Synchronization: handled at the design level by the idle-timer system (no player can indefinitely stall a match); underlying technical sync architecture is an implementation decision, not covered here.

---

## 20. Game Instance Lifecycle (Section 19 — FULLY LOCKED)

- **Flow:** Create Game → Configure Board → Place Properties → Invite Players → Start → Play → Elimination → Victory → Results → End.
- Properties placed at game setup, before play begins.
- Placement is **final once chosen** — no changes after seeing opponents.
- Board is **not inspectable** before the match starts.
- Board **locks once all players have placed properties and confirmed ready.**
- **No late joining** — roster fixed once the match starts.
- Eliminated players can spectate (Section 19); expiration scales with stake tier (Section 18).

---

## 21. UI/UX Architecture (Section 20 — LOCKED, screen list only)

Not a design spec — just the known screen surface area: main menu, player profile, cat/equipment/card/property collections, deck builder, property marketplace/placement, board, property interaction, PvP battle, hand, attack table, HP/status, equipment levels, results/elimination/victory screens, purchase confirmation, inventory. **Not a green light** — this phase starts only once Phases 1–6 (mechanics) are fully settled.

---

## 22. Technical Data Structure (Section 21 — LOCKED, refreshed this session)

```
Player
 ├── Account
 ├── Cat (cosmetic skin)
 ├── Cat Class (functional: ability + starter deck flavor)
 ├── Permanent Equipment
 ├── Permanent Cards
 ├── Permanent Properties
 ├── Persistent Currency (Fel)
 └── Gems (premium currency)

Game Instance
 ├── Board (fixed grid/Town Center/outer ring + procedural obstacle/path layout)
 ├── Players
 ├── Player HP
 ├── Player Status Effects (Poison, Paralysis)
 ├── Equipment Levels
 ├── Card Deck States
 ├── Property Placements
 ├── Property Levels
 ├── Property Deck States
 ├── Property Earned-Coins (drives leveling — Section 11)
 ├── Coins (personal, match-tracked but kept permanently)
 ├── Prize Card Locations (3 per instance)
 ├── Entry-Fee Pot (Fel)
 ├── Alliance State (tracked pairs/groups)
 └── Game State
```

---

## 23. Game Modes (Section 22 — nearly locked)

### Prized Game (default mode, described throughout this document)
- **Variable stake tiers** — the game creator sets any custom Fel entry fee (not a flat 500). All players in a lobby pay the same amount. Brackets (100-500 / 501-1,000 / 1,001-2,000+) are used only for expiration timing, not as selectable presets.
- Higher stakes = bigger pot only — no other gameplay difference.
- Pot: **80% to winner(s), 20% burned.**
- Property leveling is **unaffected** by stake tier — Fel is fungible regardless of source.

### Campaign (free, PvE-primary on-ramp)
- No entry fee, **no properties, no Prize Cards.**
- Same core game loop otherwise (board, dice, PvP, alliances) — **same max-3-alliance/max-2-winner caps apply even against bots.**
- **Bots are the main opponents.** Composition is flexible: however many real players queue, bots fill remaining slots.
- Board: outer ring + Town Center + Inn/Blacksmith/Church, plus Campaign-exclusive NPC locations (e.g. a **Fountain**, which is **free to use** and serves as one of several reward triggers).
- Rewards: small Coins + common-rarity cards, carried forward into Prized Games.
- Queueing for Campaign and Prized Game is **fully separate** (not simultaneous).
- 🔓 OPEN: exact Campaign reward amounts (deferred).

---

## Appendix: Full list of remaining open questions

**Blocks the final art pass (design decisions, not numbers):**
- The 3 class special abilities (Section 04) — undesigned; blocks class-ability iconography/VFX
- Cosmetic customization scope — accessories on a base cat rig, or one-off illustrations? (Section 03)

**Deferred to a dedicated numeric balance pass** (not design questions — need real playtesting/economic modeling):
- Exact Gem price for properties (Section 09) — proposed framework in-section, blocked on a Coins↔Gems rate
- Exact Coin thresholds for property leveling (Section 11) — proposed hypothesis in-section (450 / 1,050 / 2,100 / 3,600)
- Exact Gem amount per tier for the leveling accelerator (Section 11) — blocked on the Gems↔Fel rate
- How quickly max equipment level is reachable in one match (Section 08)
- Exact Campaign reward amounts (Section 22)
- Booster Pack contents/pricing (Section 16)
- Inn heal amount + cost, Blacksmith cost, Church cost (Sections 02/04) — prototype uses heal 20 / Blacksmith +2 raw stat as stand-ins
- Board hazard tile density — Poison Swamp, Thorn Vines (Section 03) — prototype uses 3 each
- Starting Coin grant (prototype uses 500, unanchored)

**Deferred to asset creation** (not blocking logic):
- Critical hits, damage cap, multi-Guard-per-Attack (Section 04/05)
- Equipment level-up animation/reward, equipment rarity, collection screen UI (Section 07)

**Deliberately saved for last** (explicit sequencing choice by the design owner):
- Section 12 (Property Card Design) — all card-content specifics
- Section 17 (Card Rarity & Collection System) — entirely undesigned

**Resolved in the 2026-08-28 unification pass** (previously open):
- Cat class count → locked to 3 (Knight/Mage/Priest)
- Board hazard tiles (Poison Swamp, Thorn Vines / Snared) → promoted to canon (Section 03/05)
- Ally-Heal proximity option → promoted to canon (Section 02)
- Opening 2-turn per-player grace period → promoted to canon (Section 02)
- Combat formula discrepancy between `classes.md` and the prototype → `classes.md` corrected to the `max(1, …)` formula

**Design revisions — 2026-08-28 (later same day)** — changes to previously-locked sections, made by the design owner:
- **Movement:** the roll now sets a **maximum**; the player moves **1..N tiles of their choice** and stops where they like (Section 02/03). Fixes the "can't reliably land on a property" friction; randomness deliberately retained. *Edits locked Section 01/02.*
- **Property leveling:** added an optional **Gem accelerator** that waives the cumulative-Coin threshold for one level-up (Fel cost still paid) — Section 11. Fel was **not** removed from leveling. *Edits locked Section 10.*
