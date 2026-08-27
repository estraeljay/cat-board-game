# Testing Conventions

Uses Unity Test Framework (`com.unity.test-framework`), included by default in modern Unity
projects via Package Manager.

## EditMode tests

For anything that doesn't need the Unity runtime: the combat formula, PvP battle state
machine, board/path generation, economy calculations, RNG seeding.

- Location: `Assets/Tests/EditMode/`
- One test file per class under test (`CombatResolverTests.cs` tests `CombatResolver`).
  `unity-port/Tests/EditMode/PvpBattleTests.cs` is the existing example.
- For anything RNG-driven (board regeneration, card draws, scripted random playthroughs),
  test over a large sample and assert invariants hold every time — e.g. "every door/entry
  is reachable after 150 regenerations", "coins never go negative" — rather than asserting
  an exact outcome on a single seed. The JS prototype's test notes in `prototype/README.md`
  are a good model for what to cover.

## PlayMode tests

For anything touching prefabs, animation, or scene state.

- Location: `Assets/Tests/PlayMode/`
- Keep these to integration-level checks — does the board prefab spawn, does a card/move
  animation complete — rather than re-testing logic already covered by an EditMode test

## What NOT to test

- Unity engine behavior itself (don't write a test asserting `Transform.Translate` works)
- Visual/animation polish — that's manual QA, not an automated assertion
