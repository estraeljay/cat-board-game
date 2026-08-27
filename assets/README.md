# Assets

Drop generated art in here and the prototype picks it up automatically. **Nothing is
required** — every missing file falls back to the prototype's built-in flat colours, so you
can add assets one at a time and re-check the playtest after each.

Generate everything with the shared **style anchor** and **projection tag** from
[`cat-dice-game-dev-skill/cat-dice-game-dev/references/art-asset-list.md`](../cat-dice-game-dev-skill/cat-dice-game-dev/references/art-asset-list.md).
That file is the full brief — this README is just the file-drop contract.

## Format

- **PNG, transparent background** where the shape isn't a full square (characters, props,
  facades). Full-square tiles (path, obstacle, swamp) can be opaque.
- Single-tile sprites: **512×512** is plenty. Multi-tile block facades: **square**, sized
  to the block (e.g. a 3×3 property → one 1536×1536 image; the prototype slices it across
  the 9 tiles). Town Center is 5×5 → one 2560×2560 image.
- Keep filenames **exactly** as listed below (lowercase, hyphenated). The prototype looks
  for these literal paths.

## Where each file goes

### `board/topdown/` — the map / overview view (used by the current prototype)
| File | What |
|---|---|
| `path.png` | walkable path tile |
| `obstacle.png` | tree/crate filler (impassable) |
| `boundary-ring.png` | outer permanent-path ring tile |
| `entry-marker.png` | the single interactive entry tile in front of any block |
| `town-center.png` | 5×5 walled start block (sliced across 25 tiles) |

### `special-locations/topdown/`
`inn.png` · `blacksmith.png` · `church.png` — each a 2×2 block facade.

### `properties/topdown/`
`fountain.png` · `yarn-emporium.png` · `fish-market.png` · `catnip-garden.png` — each a
3×3 block facade. (These four are the playtest stand-in set on the generic property shell —
see the art brief / `MASTER-DATA-SHEET.md` §10.)

### `hazards/topdown/`
`poison-swamp.png` · `thorn-vines.png` — single-tile hazards.

### `characters/`
`knight.png` · `mage.png` · `priest.png` — the 3 class cats, used as the player tokens on
the board. Transparent PNG, roughly square, character centred.

## Not wired into the prototype yet (generate when ready, folders are here)

- `board/iso/`, `properties/iso/`, `special-locations/iso/`, `hazards/iso/` — the isometric
  storybook play view. The prototype currently renders the top-down grid only; the iso view
  is a later prototype enhancement.
- `cards/pvp/frames/`, `cards/pvp/icons/`, `cards/property/frames/`, `cards/property/icons/`
  — PvP and property card art (~94 pieces; see the brief).
- `icons/` — HP, Coin, Fel, Gem, Poison, Paralysis, Snared, Prize Card.
- `tokens/` — abstract top-down colour pawns, if you'd rather not use character art on the
  board.

## How pickup works

`prototype/assets.js` maps each name above to a path. The board renderer sets it as a CSS
`background-image`; if the file isn't there, the browser loads nothing and the flat colour
underneath shows through. No build step, no manifest to edit — just match the filenames.
