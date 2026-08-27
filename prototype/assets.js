// Optional art layer for the prototype.
//
// Drop PNGs into ../assets/ using the filenames in ../assets/README.md and they show up on
// the board automatically. Every entry is a plain guess at a URL — if the file isn't there,
// the browser loads nothing and the flat CSS colour underneath shows through, so this file
// never needs editing just to add art. Edit it only to point at a *different* path or add a
// brand-new tile type.

const BASE = "../assets";

// File extension for the generated art. The first Higgsfield batch used Recraft V4.1
// in vector mode, which returns .svg — change to "png" if you swap in raster art.
const EXT = "svg";

// Single-tile sprites: one image fills one 1x1 tile.
export const TILE_ART = {
  path: `${BASE}/board/topdown/path.${EXT}`,
  obstacle: `${BASE}/board/topdown/obstacle.${EXT}`,
  ring: `${BASE}/board/topdown/boundary-ring.${EXT}`,
  "hazard-poison": `${BASE}/hazards/topdown/poison-swamp.${EXT}`,
  "hazard-thorn": `${BASE}/hazards/topdown/thorn-vines.${EXT}`,
  entry: `${BASE}/board/topdown/entry-marker.${EXT}`,
};

// Multi-tile block facades: one image is sliced across the whole w×h footprint of the block.
export const BLOCK_ART = {
  townCenter: `${BASE}/board/topdown/town-center.${EXT}`,
  blacksmith: `${BASE}/special-locations/topdown/blacksmith.${EXT}`,
  inn: `${BASE}/special-locations/topdown/inn.${EXT}`,
  church: `${BASE}/special-locations/topdown/church.${EXT}`,
  fountain: `${BASE}/properties/topdown/fountain.${EXT}`,
  yarnEmporium: `${BASE}/properties/topdown/yarn-emporium.${EXT}`,
  fishMarket: `${BASE}/properties/topdown/fish-market.${EXT}`,
  catnipGarden: `${BASE}/properties/topdown/catnip-garden.${EXT}`,
};

// Player tokens, keyed by class. Falls back to a coloured dot with the name initial.
export const TOKEN_ART = {
  knight: `${BASE}/characters/knight.${EXT}`,
  mage: `${BASE}/characters/mage.${EXT}`,
  priest: `${BASE}/characters/priest.${EXT}`,
};

// Scan the finished board once and record the bounding box of each block type, so a block
// facade image can be positioned as a CSS slice per tile. Block types are singletons in the
// current prototype (one Inn, one Fountain, ...), so a single min/max sweep is enough.
export function computeBlockBounds(board) {
  const bounds = {};
  for (let r = 0; r < board.size; r++) {
    for (let c = 0; c < board.size; c++) {
      const t = board.tiles[r][c].type;
      if (!(t in BLOCK_ART)) continue;
      const b = (bounds[t] ??= { minR: r, minC: c, maxR: r, maxC: c });
      b.minR = Math.min(b.minR, r);
      b.minC = Math.min(b.minC, c);
      b.maxR = Math.max(b.maxR, r);
      b.maxC = Math.max(b.maxC, c);
    }
  }
  return bounds;
}

// Returns a CSS `background-*` string for one tile, or "" to leave the colour fallback.
export function tileBackgroundStyle({ tileType, entryType, hazardType, r, c, blockBounds }) {
  if (entryType) return bg(TILE_ART.entry);

  if (hazardType) {
    const url = TILE_ART[`hazard-${hazardType}`];
    return url ? bg(url) : "";
  }

  if (tileType in BLOCK_ART) {
    const b = blockBounds?.[tileType];
    const url = BLOCK_ART[tileType];
    if (!b || !url) return "";
    const cols = b.maxC - b.minC + 1;
    const rows = b.maxR - b.minR + 1;
    const x = cols > 1 ? ((c - b.minC) / (cols - 1)) * 100 : 0;
    const y = rows > 1 ? ((r - b.minR) / (rows - 1)) * 100 : 0;
    return `background-image:url('${url}');background-size:${cols * 100}% ${rows * 100}%;` +
      `background-position:${x}% ${y}%;background-repeat:no-repeat;`;
  }

  const url = TILE_ART[tileType];
  return url ? bg(url) : "";
}

function bg(url) {
  return `background-image:url('${url}');background-size:cover;background-position:center;background-repeat:no-repeat;`;
}
