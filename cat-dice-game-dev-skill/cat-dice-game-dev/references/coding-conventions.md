# Coding & Project Conventions

<!-- Defaults below assume a fresh Unity 2022 LTS project with URP, targeting iOS + Android.
Update this file (and the SKILL.md frontmatter `compatibility` line) if that's wrong. -->

## Unity setup

- Unity version: 2022 LTS (update if different)
- Render pipeline: URP — good mobile performance/quality tradeoff
- Input: New Input System recommended over the legacy Input Manager (cleaner touch handling,
  easier to add controller support later if ever needed)

## Folder structure

```
Assets/
  _Project/
    Scripts/
      Data/           # ScriptableObject definitions (CatDefinition, ClassDefinition,
                      #   PropertyDefinition, EquipmentDefinition, PvpCardDefinition)
      Gameplay/       # Board/path gen, turn loop, CombatResolver, PvpBattle,
                      #   economy, property, alliance/elimination logic (plain C#)
      UI/
      Editor/         # Custom inspectors, content-scaffolding menu items
    Prefabs/
      Board/          # tiles, Town Center, property/special-location blocks, hazards
      Cats/
      Cards/
      UI/
    Art/
      Sprites/
      Animations/
    Audio/
    ScriptableObjects/
      Cats/
      Classes/
      Properties/
      Equipment/
    Scenes/
  Tests/
    EditMode/
    PlayMode/
```

Keep all project-specific content under `_Project/` — the leading underscore sorts it to the
top of the Assets window, keeping it visually separated from any imported third-party assets.

## C# style

- PascalCase for classes, methods, and public members; camelCase for local variables
- Private serialized fields: `[SerializeField] private int _rollCount;` — leading underscore,
  camelCase. Pick this or plain camelCase and stay consistent project-wide.
- One class per file; filename matches the class name exactly
- Prefer `[SerializeField] private` over public fields for anything exposed in the Inspector
- No `MonoBehaviour` for pure logic (combat math, board/path generation, economy calc,
  RNG) — plain C# classes only, so they're testable without the Unity runtime (see
  `testing.md`). The Unity port already follows this: `CombatResolver`, `PvpBattle`, etc.
  are plain C#.

## Naming conventions

- `CatDefinition` assets: `Cat_<Name>` (e.g. `Cat_Whiskers`)
- `ClassDefinition` assets: `Class_<Name>` (`Class_Knight`, `Class_Mage`, `Class_Priest`)
- `PropertyDefinition` assets: `Property_<Name>` (e.g. `Property_FishMarket`)
- `PvpCardDefinition` / `PropertyCardDefinition` assets: `Card_<Name>`
- Animation clips: `<CatName>_<Action>` (e.g. `Whiskers_Idle`, `Whiskers_Move`)
- Scenes: `<Number>_<Name>` for ordered scenes (e.g. `01_MainMenu`, `02_Board`)
