# Art Asset List & Prompting Guide

The prototype is built and bug-fixed; this file tracks the art pass. Every prompt below ends
with the same **style anchor** block, plus a **projection tag**, so all generated assets —
across every category and whichever image tool is used — stay visually consistent.

Read alongside `../../../playtest-asset-checklist.md` for the *minimal first batch* and the
suggested build order. This file is the fuller production list; the checklist is what you
actually need to get a playable build on screen.

## Locked decisions (unification pass, 2026-08-28)

1. **PvP classes (Knight / Mage / Priest) are cat characters in class-themed gear** — not a
   separate non-cat character type. The class roster is **exactly 3** (locked).
2. **Two projections, both needed:**
   - **Isometric storybook diorama** — the primary in-game play view: the board while the
     player is moving and playing on it. 2:1 dimetric, soft upper-left light. Every board
     tile, building, prop, hazard, and character is authored at this one iso angle so they
     composite.
   - **Top-down** — the **map / overview screen**: a flat, schematic read of the whole
     20×20 board so players can plan routes and chases. Lower fidelity on purpose — closer
     to clean UI (flat tiles, icon + colour) than full illustration. Its job is legibility
     at a glance, not beauty.
3. **The board is a fixed 20×20 square grid** (400 tiles) with a **single-tile-wide path
   network** woven through it — obstacles (trees/crates) fill every gap wider than 1 tile.
   Square tiles. It is **not** a round-tile / node-hop track. (Earlier drafts of this file
   said "round board tiles / curved corner path" — that was wrong and is corrected here.)
4. **Properties are generic and player-placed** (up to 10 per board). The four named
   properties below (Fountain, Yarn Emporium, Fish Market, Catnip Garden) are the
   **first-art-pass / playtest set** — theme skins on one generic 3×3 property shell — not a
   fixed-property design. Build the generic shell first; the four themes are dressing on it.
5. **Class special abilities are undesigned** (reference Section 4). Do **not** finalize
   ability icons / VFX yet — frames and HUD slots can be laid out with placeholders.

**Discarded:** the 5 named "dice cat" characters (Ember/Mochi/Shadow/Clementine/Biscuit,
tied to Fire/Lucky/Steal/Snack/Chaos roll types) from the original source package. That
roll-type mechanic was never in this game — movement is a plain d6 — so those assets had
nothing to attach to.

## Style anchor

Append this exact text to the end of every image prompt in this file, unmodified:

```
flat 2D vector game illustration, thick clean rounded outlines (~4px, deep plum #241733),
soft flat cel-shading with minimal gradients, warm saturated storybook color palette, cute
chibi-rounded proportions, cozy mobile casual-game aesthetic, soft light source from upper-
left with a subtle drop shadow beneath, no photorealism, no painterly texture or noise,
crisp clean edges
```

Then add ONE projection tag, matching the asset's use:

- Play-view assets: `, 2:1 isometric (dimetric) projection, consistent iso angle`
- Map-view assets: `, flat top-down orthographic projection, schematic and legible`

A handful of assets need **both** versions (the board tiles, Town Center, property and
special-location blocks, hazards) — generate each twice, once per projection tag.

## Asset checklist

| Category | Play view (iso) | Map view (top-down) | Notes |
|---|---|---|---|
| Board tiles & path | 6 | 6 | path straight / corner / T / 4-way, plain ground, obstacle |
| Obstacles | 2 | 1 | tree + crate variant (map view can use one generic block) |
| Outer boundary ring tile | 1 | 1 | reuse path tile w/ a border treatment |
| Town Center (5×5 walled + 4 exits) | 1 | 1 | big one-off; every player starts here |
| Generic property shell (3×3 + entry tile) | 1 | 1 | the real system — themes are skins on this |
| Property theme skins (playtest set) | 4 | 4 | Fountain, Yarn Emporium, Fish Market, Catnip Garden |
| Special locations (2×2 + entry tile) | 3 | 3 | Inn, Blacksmith, Church |
| Entry-tile marker | 1 | 1 | shared, sits in front of any block; the only interactive tile |
| Hazard tiles | 2 | 2 | Poison Swamp, Thorn Vines |
| Characters (PvP class cats) | 3 | — | Knight, Mage, Priest |
| Player tokens | — | 5 | map view: 5 distinct colour pawns / paw markers |
| Property Cards | 4 frames + 12 unique special icons + 7 reusable gain/loss/wildcard icons (≈23) | — | recolor the reusable library per property |
| PvP Cards | 3 frames + 60 unique icons (≈63) | — | fully bespoke — combat is seen constantly |
| Status / currency icons | 8 | — | HP, Coin, Fel, Gem, Poison, Paralysis, Snared, Prize Card |
| Equipment slot icons | 8 (deferred) | — | text labels are fine for playtest; art waits on rarity (Section 17) |
| Turn / timer UI | component, not art | — | numeric countdown or shrinking bar (20s / 30s) |

**Rough totals:** ~55 play-view + ~30 map-view + ~94 card assets. The property-card
reusable-icon approach trades uniqueness on high-volume, rarely-seen cards for a smaller
list; the 12 named specials stay bespoke since those are the ones players remember.

## Prompt templates

### Board tiles & path (generate both projections)
Template: `A [tile type] for a cozy storybook board game, [key detail], [STYLE ANCHOR][PROJECTION TAG]`

- Straight path: *A straight dirt path tile bordered by grass...*
- Corner path: *A 90-degree corner dirt path tile bordered by grass...*
- T-junction / 4-way: *A T-shaped (/ four-way) dirt path junction tile bordered by grass...*
- Plain ground: *A plain grass tile with no path...*
- Obstacle (tree): *A dense cluster of round storybook trees filling a square tile, impassable...*
- Obstacle (crate): *A stack of wooden crates and barrels filling a square tile, impassable...*
- Boundary ring: *A dirt path tile with a subtle carved stone border along one edge, marking the board's outer edge...*

### Town Center (both projections)
*A walled 5×5 stone town square with a central fountain or notice board, four gated exit
openings (one per side), all cats' starting point, [STYLE ANCHOR][PROJECTION TAG]*

### Generic property shell (both projections)
*An empty 3×3 fenced building plot with a single wooden gate on one side as its only
entrance, no signage, neutral and unthemed, ready to be dressed, [STYLE ANCHOR][PROJECTION TAG]*

### Property theme skins — playtest set (both projections)
Template: `A small [structure], [key visual details], on a 3×3 plot with a single front gate, [STYLE ANCHOR][PROJECTION TAG]`

- Fountain (Campaign-only NPC location): *A small ornate stone wishing fountain with gently glowing water and scattered coins...*
- Yarn Emporium: *A small cozy yarn shop with a striped awning and yarn balls in the window...*
- Fish Market: *A small open-air fish market stall with hanging nets and crates of fish...*
- Catnip Garden: *A small lush garden overflowing with catnip plants and a wooden trellis...*

### Special locations (both projections)
Template: `A small [building], [key details], on a 2×2 plot with a single front entrance, [STYLE ANCHOR][PROJECTION TAG]`

- Inn: *A snug two-storey inn with a hanging sign and warm lit windows...* (heals HP)
- Blacksmith: *A stone-and-timber forge with an anvil, chimney smoke, and a weapon rack...* (levels equipment)
- Church: *A small white chapel with a rounded stained-glass window and a bell...* (cures Poison / Paralysis)

### Entry-tile marker (both projections)
*A single square paving tile with a soft glowing paw-print inlay, marking an interactive
entrance, [STYLE ANCHOR][PROJECTION TAG]*

### Hazard tiles (both projections)
- Poison Swamp: *A single square tile of bubbling purple-green swamp muck with a faint toxic haze...*
- Thorn Vines: *A single square tile choked with tangled brown thorn vines...*

### Characters (play view / iso only)
Template: `A [cat description / markings / gear], full body, three-quarter view, [STYLE ANCHOR], 2:1 isometric (dimetric) projection, consistent iso angle`

- Knight: *A sturdy grey tabby cat in a small polished breastplate holding a round shield, heroic stance...*
- Mage: *A slender blue-grey cat in a small starry pointed hat holding a glowing wand...*
- Priest: *A white cat in small holy robes with a golden halo motif, gentle blessing pose...*

Leave a clear chest/paw area in each so a placeholder ability icon can be composited later.

### Player tokens (map view / top-down only)
*A simple rounded game pawn in solid [colour], subtle paw-print emboss on top, viewed from
above, [STYLE ANCHOR], flat top-down orthographic projection, schematic and legible* —
five colours, maximally distinct.

### Property Cards
Frame per property, then reusable + special icons — unchanged approach.

Frame template: `An empty rounded rectangular game card frame with decorative corner
flourishes themed around [property motif], accent color [property color], empty center for
icon and text, frame only, [STYLE ANCHOR]`

Icon template: `A single small icon of [card concept], centered, bold simple silhouette,
icon only, no frame, [STYLE ANCHOR]`

- Reusable coin-gain (recolor per property): *a coin stack with an upward sparkle*
- Reusable coin-loss: *a cracked, dented coin pointing down*
- Reusable wildcard: *a two-headed coin mid-flip*
- Named specials (bespoke, 12): e.g. Tuna Jackpot *a golden tuna overflowing with coins*;
  Rusty Coin Curse *a tarnished cracked coin*; plus the debuff-removal and reward-item
  cards per deck (see `game-mechanics.md`).

### PvP Cards
Frame per class, then one bespoke icon per card, scaled by power.

Frame template: `An empty rounded rectangular game card frame with [class motif] corner
flourishes, accent colors [class colors], empty center for icon and text, frame only,
[STYLE ANCHOR]`

- Knight: medieval heraldry flourishes, steel grey + deep red
- Mage: arcane rune flourishes, deep indigo + electric blue
- Priest: radiant halo flourishes, gold + soft white

Icon template: `A single small icon of [attack/guard concept], centered, bold simple
silhouette, radiating [low/medium/high] intensity, icon only, no frame, [STYLE ANCHOR]`

Scale the visual language to the card's power number: 1–3 = small, plain, calm; 4–7 = added
motion lines / glow; 8–10 = dramatic energy, larger silhouette, bright highlight — so the
whole 60-card set reads as a natural progression. Card names are in `classes.md`.

### Status / currency icons (play view UI)
Template: `A single small UI icon of [concept], centered, bold simple silhouette, icon
only, no frame, [STYLE ANCHOR]`

- HP: *a rounded heart*  · Coin: *a single round coin*  · Fel: *a faceted glowing shard*
- Gem: *a cut gemstone*  · Poison: *a dripping skull*  · Paralysis: *a jagged lightning bolt*
- Snared: *a coiled thorn vine loop*  · Prize Card: *a star-stamped sealed card* (must feel
  rare — only 3 exist per game)

### Equipment slot icons (deferred — text labels for playtest)
Ring, Necklace, Boots, Gloves, Body Armor, Helmet, Weapon, Shield. Hold until card rarity
(Section 17) is designed, since rarity treatment drives the frame/border style.
