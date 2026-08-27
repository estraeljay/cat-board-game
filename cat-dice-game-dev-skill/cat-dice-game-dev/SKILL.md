---
name: cat-dice-game-dev
description: Unity project-conventions companion for the Cat Board Game (a real-money-property, card-battle multiplayer board game — cats move a single d6 along a path-network board, fight multi-round PvP card battles, and form/betray alliances). Use this skill for Unity-specific work on this project: C# gameplay code structure, ScriptableObject content patterns (cats, classes, properties, cards, equipment), scene/prefab setup, EditMode/PlayMode tests, and iOS/Android build & release. Also trigger when the user asks to "add a new cat," "add a new property," "add a class," or scaffold game content, or mentions folder/asset organization for this game. For the game's RULES (what a mechanic does, what's locked vs open) defer to the catgame-coding-assistant skill and game-design-reference.md — this skill covers HOW the Unity project is structured, not WHAT the rules are.
compatibility: Unity 2022 LTS or newer, C#
---

# Cat Board Game — Unity Dev Companion

This skill encodes the **Unity project conventions** for the Cat Board Game so gameplay
code, content, tests, and builds stay consistent as the project grows. It is the companion
to `catgame-coding-assistant` (game rules / design reference) — use both together: rules
from there, project structure from here.

> There is no dice-roll/scoring game here. Movement is one d6 along a path network; that's
> the extent of "dice." Earlier versions of this skill described a Yahtzee-style dice game —
> that concept was dropped. See `UNIFICATION-NOTES.md` at the package root.

## Before doing anything

1. `references/game-design-reference.md` — the authoritative ruleset (board, combat, PvP
   turns, equipment, properties, economy, multiplayer). Same file the
   `catgame-coding-assistant` skill uses. Find the rule before implementing it.
2. `references/classes.md` — the Knight/Mage/Priest attack & guard card sets, and the
   canonical combat formula, before implementing combat.
3. `references/game-mechanics.md` — the NPC / player-owned **property card decks** and the
   flat toll rule.
4. `references/art-asset-list.md` — before generating or requesting any game art: the full
   asset checklist, the two locked projections (top-down map view + isometric play view),
   and the shared style-anchor prompt every asset must use.
5. `references/coding-conventions.md` — folder layout and C# style before creating scripts.
6. If a reference file still has `<!-- FILL IN -->` placeholders, treat those rules as
   unconfirmed — ask rather than inventing game logic.

Prior art already in the repo: `prototype/` (validated JS vertical slice) and `unity-port/`
(the C# port in progress — PvP battle state machine ported and tested, board/movement layer
next). Port *from* the prototype; don't re-derive.

## Architecture pattern

Keep gameplay *data* and gameplay *behavior* separate so new content doesn't require new
code:

- **Content** → `ScriptableObject` assets: `CatDefinition` (cosmetic skin + which class),
  `ClassDefinition` (the class's 10+10 PvP card list + its special ability hook),
  `PropertyDefinition` (theme/skin + its card deck), `PvpCardDefinition` /
  `PropertyCardDefinition` (name + value/effect), `EquipmentDefinition` (slot + stat).
  New content = new asset, not new code.
- **Logic** → plain C# classes, no `MonoBehaviour`: `CombatResolver` (the locked damage
  formula), `PvpBattle` (draw/battle/end state machine), board/path generation, the normal
  turn loop, economy math, alliance/elimination/victory resolution. All unit-testable
  without PlayMode — the Unity port already does this.
- **Presentation** → `MonoBehaviour`s and prefabs subscribe to C# events fired by the logic
  layer (`OnDamageDealt`, `OnTurnEnded`, …) rather than being called directly.

This keeps "add a cat / class / property" a content task. Flag explicitly if a request
breaks the data-only pattern (e.g. a class ability that needs new branching logic — the 3
class abilities are still undesigned, reference Section 4).

## Common workflows

### Add a new cat (cosmetic skin)
1. Create a `CatDefinition` asset (`Cat_<Name>`), set its sprite/animation refs per
   `references/coding-conventions.md`, and point it at an existing `ClassDefinition`.
2. No code change — skins are purely cosmetic.

### Add / edit a property (playtest set)
1. Create/duplicate a `PropertyDefinition` (`Property_<Name>`) and fill its 20-card deck
   (3 special + 9 coin-gain + 7 coin-loss + 1 wildcard) — see `references/game-mechanics.md`
   and `prototype/content.js` for the existing four.
2. Remember these are skins on the generic player-placed property system, not fixed board
   features (reference Section 10).

### Add a class
1. `ClassDefinition` asset with 10 Attack + 10 Guard cards, power 1–10 per type, no
   duplicate powers. The roster is currently locked at 3 — adding a 4th is a design
   decision, not a content task; confirm before doing it.

### Debugging
Reproduce with a fixed RNG seed (see `references/game-mechanics.md`) before touching code.
Log whole result structs (`RollResult`, battle state) rather than individual values so
generation bugs and resolution bugs stay distinguishable.

## Testing

Follow `references/testing.md`. Pure logic (combat math, board gen, economy) gets EditMode
tests with no Unity runtime; prefabs/animation/scene state get PlayMode tests. Write the
EditMode test first — if the logic can't be tested without PlayMode, it's too coupled to a
`MonoBehaviour`.

## Build & release

Follow `references/build-deploy.md` before any build that lands on a real device or a
store — don't skip steps because "it's just a test build."
