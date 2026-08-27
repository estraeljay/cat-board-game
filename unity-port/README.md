# Unity port — staging area

Files here aren't inside a Unity project yet (none exists in this repo yet — see
Phase 0/1 of the porting walkthrough). Once you create one, copy folders straight
across, keeping the same relative layout:

```
unity-port/Scripts/Gameplay/*.cs  ->  Assets/_Project/Scripts/Gameplay/
unity-port/Tests/EditMode/*.cs    ->  Assets/Tests/EditMode/
```

## What's ported so far

Direct C# port of `prototype/combat.js` + `prototype/pvpTurns.js` (the PvP
battle state machine), plus an EditMode test file that mirrors the sanity
checks and simulated-battle loop from `prototype/demo.html`.

- `CombatResolver.cs` — the locked damage formula
- `Card.cs` — `CardType` enum + `Card` class + `CardValueEntry` struct
- `PlayerBattleState.cs` — per-player hp/stats/deck/hand/discard
- `PvpBattle.cs` — the draw/battle/end/finished phase state machine

Not ported yet: `board.js`, `content.js`, `game.js` (the board/movement/property
layer) — next steps once this piece is verified working in Unity.

## Getting the tests running (once you have a Unity project)

1. Create the project, add the `_Project` and `Tests` folders per
   `cat-dice-game-dev-skill/cat-dice-game-dev/references/coding-conventions.md`.
2. Copy the two folders above into place.
3. Open **Window → General → Test Runner**, switch to the **EditMode** tab.
   If it asks you to create a test assembly, let it — that generates the
   `.asmdef` file the test runner needs to find `PvpBattleTests.cs`. If your
   `Gameplay` scripts also end up in their own assembly, the test assembly
   will need an assembly reference to it (Test Runner offers this automatically
   the first time compilation fails on a missing reference — just click through it).
4. Click **Run All**. All 4 tests should pass with zero code changes — they're
   asserting the exact same behavior your JS prototype already validated.

## Deliberate simplifications vs. the JS source

- Dropped the JS constructor's "shared `cardValues` fallback" (used a single
  deck for both players when per-player decks weren't given) — a leftover from
  testing before class decks existed. The real game always uses per-class
  decks, so every C# call site passes both players' decks explicitly.
- `BattlePhase` is a C# `enum` instead of the JS phase strings
  (`"draw"/"battle"/"end"/"finished"`) — same states, but a typo in a phase
  name is now a compile error instead of a silent runtime bug.
