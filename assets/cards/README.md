# Card assets

## Templates (generated — edit these)

| File | What |
|---|---|
| `frame-attack.svg` | Blank Attack card frame — red/steel border, empty power crest (top), empty icon panel (middle), empty name banner (bottom) |
| `frame-guard.svg` | Blank Guard card frame — blue/silver, same empty zones |
| `card-back.svg` | Card back (paw emblem) |

The prototype uses `frame-attack.svg` / `frame-guard.svg` **right now** as the background
behind every card in the Deck screen and the PvP battle scene. The power number and card
name are drawn on top by the app (`cardHtml` in `prototype/app.js`), so a frame with clean
empty zones is all that's needed. Card proportion is **3 : 4** (portrait).

Edit the frames in any vector/image editor, keep the same filename, and the prototype picks
up the change on reload.

## Finished per-card art (when you make it)

Drop finished card art here using these exact paths and the app will be wired to prefer it
over the plain frame:

```
pvp/knight/attack-1.svg   … attack-10.svg      (10 files)
pvp/knight/guard-1.svg    … guard-10.svg       (10 files)
pvp/mage/attack-1.svg …   pvp/mage/guard-10.svg
pvp/priest/attack-1.svg … pvp/priest/guard-10.svg
```

`<power>` is the card's printed value (1 = weakest … 10 = strongest). Card names by
class/power are in `cat-dice-game-dev-skill/cat-dice-game-dev/references/classes.md` and
`prototype/content.js`. A full-card image (art + frame + baked-in number/name) or an
icon-only image both work — say which when you send them and I'll wire `cardHtml`
accordingly.

`.svg` or `.png`; 3:4 portrait; ~900×1200 for raster.
