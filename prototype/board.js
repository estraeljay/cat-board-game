// Cat Board Game — Board structure (design bible Section 02)
//
// Simplification for this vertical slice: no player-owned properties or the
// Coin cost gate on NPC locations yet — those are part of the economy layer,
// out of scope until the core loop is validated. Board generation here
// produces the outer ring, walled Town Center, three NPC locations
// (Blacksmith/Inn/Church), the Fountain (NPC property, no owner), three
// player-claimable properties (Yarn Emporium/Fish Market/Catnip Garden), a
// procedural single-tile-wide path network connecting them all, and a
// scattering of hazard tiles (Poison Swamp/Thorn Vine) placed on top of that
// network.
//
// Entry-tile placement for NPC locations follows the same "impassable block +
// external walkable entry tile(s)" pattern the locked design uses for
// properties ("3x3 impassable block + 1 entry tile ... above the block's
// center") — the request's wording ("entry on the lower right tile") was
// ambiguous between "one of the block's own cells" and "a tile adjacent to
// that corner"; we went with the external-adjacent reading for consistency
// with the rest of the design. Exact placement per location (see
// computeEntries below) and hazard tile counts are our own arbitrary choices,
// not specified anywhere — flagged in prototype/README.md.

const SIZE = 20;
const TC_MIN = 7; // Town Center is a 5x5 block: rows/cols 7..11
const TC_MAX = 11;
const TC_MID = 9; // middle index of the 5x5 block, used for door placement

const LOCATION_SPECS = [
  { type: "blacksmith", w: 2, h: 2 },
  { type: "inn", w: 3, h: 3 },
  { type: "church", w: 2, h: 2 },
  { type: "fountain", w: 3, h: 3 }, // NPC property, no owner
  { type: "yarnEmporium", w: 3, h: 3 }, // player-owned property
  { type: "fishMarket", w: 3, h: 3 },
  { type: "catnipGarden", w: 3, h: 3 },
];
// Fountain + the 3 named properties: sized/placed per the locked design's own
// property rule ("3x3 impassable block + 1 entry tile ... above the block's
// center") since content.js/game-mechanics.md never gave them a shape.
export const PROPERTY_TYPES = new Set(["yarnEmporium", "fishMarket", "catnipGarden"]);
const HAZARD_COUNTS = { poison: 3, thorn: 3 }; // arbitrary, not specified

function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function isRing(r, c) {
  return r === 0 || r === SIZE - 1 || c === 0 || c === SIZE - 1;
}

function isTownCenter(r, c) {
  return r >= TC_MIN && r <= TC_MAX && c >= TC_MIN && c <= TC_MAX;
}

function key(r, c) {
  return `${r},${c}`;
}

function townCenterDoors() {
  return [
    { r: TC_MIN, c: TC_MID, outside: { r: TC_MIN - 1, c: TC_MID } }, // top
    { r: TC_MAX, c: TC_MID, outside: { r: TC_MAX + 1, c: TC_MID } }, // bottom
    { r: TC_MID, c: TC_MIN, outside: { r: TC_MID, c: TC_MIN - 1 } }, // left
    { r: TC_MID, c: TC_MAX, outside: { r: TC_MID, c: TC_MAX + 1 } }, // right
  ];
}

function boxesOverlap(a, b, buffer) {
  return !(
    a.left + a.w - 1 + buffer < b.left ||
    b.left + b.w - 1 + buffer < a.left ||
    a.top + a.h - 1 + buffer < b.top ||
    b.top + b.h - 1 + buffer < a.top
  );
}

function pointInBox(p, b) {
  return p.r >= b.top && p.r <= b.top + b.h - 1 && p.c >= b.left && p.c <= b.left + b.w - 1;
}

// "Lower right" / "upper or lower center" read as tiles adjacent to (outside)
// that edge of the block, mirroring the locked design's property entry rule.
function computeEntries(type, box) {
  if (type === "inn") {
    const midCol = box.left + 1; // box.w === 3
    return [
      { r: box.top - 1, c: midCol }, // upper center
      { r: box.top + box.h, c: midCol }, // lower center
    ];
  }
  if (type === "fountain" || PROPERTY_TYPES.has(type)) {
    // Matches the locked design's own property rule exactly: "entry tile above the block's center".
    const midCol = box.left + 1; // box.w === 3
    return [{ r: box.top - 1, c: midCol }];
  }
  // blacksmith & church: single entry, adjacent to the block's lower-right corner
  return [{ r: box.top + box.h, c: box.left + box.w - 1 }];
}

function placeLocation(type, w, h, placedBoxes, seedRandom) {
  const maxAttempts = 500;
  for (let i = 0; i < maxAttempts; i++) {
    const top = 1 + Math.floor(seedRandom() * (SIZE - 2 - h));
    const left = 1 + Math.floor(seedRandom() * (SIZE - 2 - w));
    const box = { top, left, w, h };
    if (placedBoxes.some((b) => boxesOverlap(box, b, 1))) continue;
    const entries = computeEntries(type, box);
    const valid = entries.every(
      (e) => inBounds(e.r, e.c) && !isRing(e.r, e.c) && !placedBoxes.some((b) => pointInBox(e, b))
    );
    if (!valid) continue;
    return { type, box, entries };
  }
  throw new Error(`Could not find a placement for ${type} on the board`);
}

function neighbors4(r, c) {
  return [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ].filter(([rr, cc]) => inBounds(rr, cc));
}

function wouldCreate2x2Open(pathSet, r, c) {
  // Reject a carve that would leave any 2x2 square (containing this cell) fully open —
  // "any blank gap wider than 1 tile is filled with obstacles" (Section 02).
  const offsets = [
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    [
      [0, -1],
      [0, 0],
      [1, -1],
      [1, 0],
    ],
    [
      [-1, 0],
      [-1, 1],
      [0, 0],
      [0, 1],
    ],
    [
      [-1, -1],
      [-1, 0],
      [0, -1],
      [0, 0],
    ],
  ];
  for (const square of offsets) {
    let allOpen = true;
    for (const [dr, dc] of square) {
      const rr = r + dr;
      const cc = c + dc;
      const isThisCell = rr === r && cc === c;
      const open = isThisCell || pathSet.has(key(rr, cc));
      if (!open) {
        allOpen = false;
        break;
      }
    }
    if (allOpen) return true;
  }
  return false;
}

export function generateBoard(seedRandom = Math.random, { includePlayerProperties = true } = {}) {
  const townCenterBox = { top: TC_MIN, left: TC_MIN, w: TC_MAX - TC_MIN + 1, h: TC_MAX - TC_MIN + 1 };
  const placedBoxes = [townCenterBox];
  const locations = [];
  // Campaign mode has no player-owned properties (design bible Section 22) — only
  // the Fountain, Inn/Blacksmith/Church, and hazards.
  const specs = includePlayerProperties
    ? LOCATION_SPECS
    : LOCATION_SPECS.filter((s) => !PROPERTY_TYPES.has(s.type));
  for (const spec of specs) {
    const loc = placeLocation(spec.type, spec.w, spec.h, placedBoxes, seedRandom);
    locations.push(loc);
    placedBoxes.push(loc.box);
  }

  const tiles = [];
  for (let r = 0; r < SIZE; r++) {
    const row = [];
    for (let c = 0; c < SIZE; c++) {
      if (isTownCenter(r, c)) row.push({ type: "townCenter", walkable: true });
      else if (isRing(r, c)) row.push({ type: "ring", walkable: true });
      else row.push({ type: "obstacle", walkable: false });
    }
    tiles.push(row);
  }
  for (const loc of locations) {
    for (let r = loc.box.top; r < loc.box.top + loc.box.h; r++) {
      for (let c = loc.box.left; c < loc.box.left + loc.box.w; c++) {
        tiles[r][c] = { type: loc.type, walkable: false };
      }
    }
  }

  const isBlocked = (r, c) => placedBoxes.some((b) => pointInBox({ r, c }, b));

  const pathSet = new Set();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (isRing(r, c)) pathSet.add(key(r, c));
    }
  }
  const doorList = townCenterDoors();
  const entryTypeByKey = new Map(); // "r,c" -> location type, for O(1) landing-effect lookups
  for (const d of doorList) {
    const { r, c } = d.outside;
    tiles[r][c] = { type: "path", walkable: true };
    pathSet.add(key(r, c));
  }
  for (const loc of locations) {
    for (const e of loc.entries) {
      tiles[e.r][e.c] = { type: "path", walkable: true };
      pathSet.add(key(e.r, e.c));
      entryTypeByKey.set(key(e.r, e.c), loc.type);
    }
  }

  // Randomized frontier growth (Prim's-style) seeded from the ring + all
  // location entry tiles, with a no-2x2-open constraint so every carved area
  // stays exactly one tile wide.
  const frontier = new Set();
  function addFrontierAround(r, c) {
    for (const [rr, cc] of neighbors4(r, c)) {
      if (isBlocked(rr, cc)) continue;
      if (pathSet.has(key(rr, cc))) continue;
      frontier.add(key(rr, cc));
    }
  }
  for (const k of pathSet) {
    const [r, c] = k.split(",").map(Number);
    addFrontierAround(r, c);
  }

  while (frontier.size > 0) {
    const arr = Array.from(frontier);
    const pick = arr[Math.floor(seedRandom() * arr.length)];
    frontier.delete(pick);
    const [r, c] = pick.split(",").map(Number);
    if (pathSet.has(pick)) continue;
    if (wouldCreate2x2Open(pathSet, r, c)) continue; // leave as obstacle
    pathSet.add(pick);
    tiles[r][c] = { type: "path", walkable: true };
    addFrontierAround(r, c);
  }

  // The no-2x2-open constraint can occasionally strand a seed (a door or NPC
  // entry) behind cells that all got rejected during growth, leaving it
  // disconnected from the rest of the network. Repair by carving a direct
  // route to the nearest already-connected cell for any seed left stranded
  // (this rare repair ignores the 2x2 constraint — correctness over aesthetics).
  function repairStrandedSeeds(seeds) {
    const mainComponent = new Set();
    const seedQueue = [];
    for (const k of pathSet) {
      const [r, c] = k.split(",").map(Number);
      if (isRing(r, c)) {
        mainComponent.add(k);
        seedQueue.push([r, c]);
      }
    }
    let qi = 0;
    while (qi < seedQueue.length) {
      const [r, c] = seedQueue[qi++];
      for (const [rr, cc] of neighbors4(r, c)) {
        const nk = key(rr, cc);
        if (pathSet.has(nk) && !mainComponent.has(nk)) {
          mainComponent.add(nk);
          seedQueue.push([rr, cc]);
        }
      }
    }

    for (const [sr, sc] of seeds) {
      const sk = key(sr, sc);
      if (mainComponent.has(sk)) continue;
      // BFS over the full grid (blocked cells excluded) for the nearest mainComponent cell.
      const prev = new Map();
      const visited = new Set([sk]);
      const queue = [[sr, sc]];
      let qj = 0;
      let target = null;
      while (qj < queue.length) {
        const [r, c] = queue[qj++];
        if (mainComponent.has(key(r, c)) && key(r, c) !== sk) {
          target = [r, c];
          break;
        }
        for (const [rr, cc] of neighbors4(r, c)) {
          if (isBlocked(rr, cc)) continue;
          const nk = key(rr, cc);
          if (visited.has(nk)) continue;
          visited.add(nk);
          prev.set(nk, [r, c]);
          queue.push([rr, cc]);
        }
      }
      if (!target) continue; // shouldn't happen — nothing to connect to
      let cur = target;
      while (cur) {
        const ck = key(cur[0], cur[1]);
        if (!pathSet.has(ck)) {
          pathSet.add(ck);
          tiles[cur[0]][cur[1]] = { type: "path", walkable: true };
        }
        mainComponent.add(ck);
        if (ck === sk) break;
        cur = prev.get(ck);
      }
    }
  }
  repairStrandedSeeds([...doorList.map((d) => [d.outside.r, d.outside.c]), ...locations.flatMap((l) => l.entries.map((e) => [e.r, e.c]))]);

  // Hazard tiles: scattered on top of already-carved plain path cells (never
  // on ring, entries, or block cells) — passable-but-triggering, per Section 02's
  // general path network plus the hazard-specific "no need to stop" rule.
  const entryKeys = new Set(entryTypeByKey.keys());
  const hazardByKey = new Map();
  function placeHazards(hazardType, count) {
    const candidates = Array.from(pathSet).filter((k) => {
      if (entryKeys.has(k)) return false;
      if (hazardByKey.has(k)) return false;
      const [r, c] = k.split(",").map(Number);
      return !isRing(r, c);
    });
    for (let i = 0; i < count && candidates.length > 0; i++) {
      const idx = Math.floor(seedRandom() * candidates.length);
      const [k] = candidates.splice(idx, 1);
      hazardByKey.set(k, hazardType);
    }
  }
  placeHazards("poison", HAZARD_COUNTS.poison);
  placeHazards("thorn", HAZARD_COUNTS.thorn);

  return {
    size: SIZE,
    tiles,
    locations,
    townCenter: { min: TC_MIN, max: TC_MAX, mid: TC_MID, doors: doorList, center: { r: TC_MID, c: TC_MID } },
    isWalkable: (r, c) => inBounds(r, c) && tiles[r][c].walkable,
    entryTypeAt: (r, c) => entryTypeByKey.get(key(r, c)) || null,
    hazardAt: (r, c) => hazardByKey.get(key(r, c)) || null,
    getWalkableNeighbors(r, c) {
      const result = [];
      const inTC = isTownCenter(r, c);
      for (const [rr, cc] of neighbors4(r, c)) {
        if (!inBounds(rr, cc) || !tiles[rr][cc].walkable) continue;
        const neighborInTC = isTownCenter(rr, cc);
        if (inTC !== neighborInTC) {
          // Crossing the Town Center wall is only legal exactly at a door <-> its outside tile.
          // (Blacksmith/Inn/Church are fully impassable, so no equivalent check is needed for
          // them — their interior cells simply aren't walkable, ruling out any bypass.)
          const isDoorCrossing = doorList.some(
            (d) => (d.r === r && d.c === c && d.outside.r === rr && d.outside.c === cc) ||
                   (d.r === rr && d.c === cc && d.outside.r === r && d.outside.c === c)
          );
          if (!isDoorCrossing) continue;
        }
        result.push({ r: rr, c: cc });
      }
      return result;
    },
  };
}
