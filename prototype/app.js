import { Game } from "./game.js";
import { CLASSES } from "./content.js";
import { TOKEN_ART, computeBlockBounds, tileBackgroundStyle } from "./assets.js";

const PLAYER_COLORS = ["#e07a5f", "#81b29a", "#f2cc8f", "#3d5a80", "#9d8df1"];
const DEFAULT_NAMES = ["Whiskers", "Mittens", "Tigerlily"];
const BOT_NAMES = ["Clawdia", "Sir Pounce", "Biscuit", "Noodle", "Pixel"];
let setupMode = "prized"; // "prized" | "campaign"
let setupPlayerCount = DEFAULT_NAMES.length;
let setupBots = [false, true, true, true, true]; // per-seat; only used in Campaign
const FAST_TEST_MODE_MS = { roll: 3000, pvp: 3000 };
const REAL_TIMER_MS = { roll: 20000, pvp: 30000 };
const BOT_STEP_MS = 550;

let game = null;
let screen = "menu"; // menu | setup | deck | shop | account | inventory (in-game when game !== null)
let deckClass = "knight"; // deck-screen selection; used as seat 1's default class
let blockBounds = {}; // per-block-type bounding boxes, for slicing facade art across tiles
let panelCollapsed = false; // right info panel hidden -> board uses full width
const PANEL_W = 340;
let testMode = false; // captured once at game start; the setup-screen checkbox is gone once play begins
let timerHandle = null;
let timerDeadline = null;

const root = document.getElementById("app");

function dirLabel(from, to) {
  if (to.r < from.r) return "North";
  if (to.r > from.r) return "South";
  if (to.c < from.c) return "West";
  if (to.c > from.c) return "East";
  return "?";
}

function clearTimer() {
  if (timerHandle) clearInterval(timerHandle);
  timerHandle = null;
  timerDeadline = null;
}

function startTimer(kind, onExpire) {
  clearTimer();
  const ms = (testMode ? FAST_TEST_MODE_MS : REAL_TIMER_MS)[kind];
  timerDeadline = Date.now() + ms;
  timerHandle = setInterval(() => {
    const remaining = Math.max(0, timerDeadline - Date.now());
    const el = document.getElementById("timer");
    if (el) el.textContent = `${Math.ceil(remaining / 1000)}s`;
    if (remaining <= 0) {
      clearTimer();
      onExpire();
    }
  }, 200);
}

function classOptionsHtml(selected) {
  return Object.entries(CLASSES)
    .map(([key, def]) => `<option value="${key}" ${key === selected ? "selected" : ""}>${def.label}</option>`)
    .join("");
}

function seatDefaultName(i) {
  if (setupMode === "campaign" && setupBots[i]) return BOT_NAMES[i] || `Bot ${i + 1}`;
  return DEFAULT_NAMES[i] || `Player ${i + 1}`;
}

function renderSetup() {
  const classKeys = Object.keys(CLASSES);
  const campaign = setupMode === "campaign";
  const rows = Array.from({ length: setupPlayerCount }, (_, i) => {
    const cls = i === 0 ? deckClass : classKeys[i % classKeys.length];
    const isBot = campaign && setupBots[i];
    return `<div class="playerSetupRow">
      <input type="text" class="setupName" value="${seatDefaultName(i)}">
      <select class="setupClass">${classOptionsHtml(cls)}</select>
      ${campaign ? `<label class="botToggle"><input type="checkbox" class="setupBot" data-i="${i}" ${isBot ? "checked" : ""}> bot</label>` : ""}
    </div>`;
  }).join("");

  root.innerHTML = `
    <button id="fsBtn">⛶ Fullscreen</button>
    <div class="setupWrap"><div>
      <div class="screenHead"><button class="backBtn" id="backBtn">← Menu</button><h1>Cat Board Game — Vertical Slice</h1></div>
      <p class="note">Board movement, proximity, PvP battles, alliances, NPC locations/hazards, property cards, and the Coin economy.</p>
      <div class="setup">
        <div class="modePick">
          <button class="modeBtn ${!campaign ? "sel" : ""}" data-mode="prized">Prized Game</button>
          <button class="modeBtn ${campaign ? "sel" : ""}" data-mode="campaign">Campaign mode</button>
        </div>
        <p class="note">${campaign
          ? "PvE on-ramp: no player-owned properties, bots fill the other seats. Same board, dice, PvP and alliance rules."
          : "Full game: player-owned properties, tolls, and the Coin economy. Hotseat / pass-and-play."}</p>
        <label>Players (2-5):</label>
        <div id="playerRows">${rows}</div>
        <div>
          <button id="addPlayerBtn" ${setupPlayerCount >= 5 ? "disabled" : ""}>+ Add player</button>
          <button id="removePlayerBtn" ${setupPlayerCount <= 2 ? "disabled" : ""}>- Remove player</button>
        </div>
        <label><input type="checkbox" id="testModeToggle"> Fast test mode (3s timers instead of 20s/30s)</label>
        <button id="startBtn">Start Game</button>
      </div>
    </div></div>
  `;
  wireChromeButtons();
  document.getElementById("backBtn").addEventListener("click", renderMenu);
  document.querySelectorAll(".modeBtn").forEach((btn) =>
    btn.addEventListener("click", () => {
      setupMode = btn.dataset.mode;
      renderSetup();
    })
  );
  document.querySelectorAll(".setupBot").forEach((cb) =>
    cb.addEventListener("change", () => {
      setupBots[Number(cb.dataset.i)] = cb.checked;
      renderSetup();
    })
  );
  document.getElementById("addPlayerBtn").addEventListener("click", () => {
    setupPlayerCount = Math.min(5, setupPlayerCount + 1);
    renderSetup();
  });
  document.getElementById("removePlayerBtn").addEventListener("click", () => {
    setupPlayerCount = Math.max(2, setupPlayerCount - 1);
    renderSetup();
  });
  document.getElementById("startBtn").addEventListener("click", () => {
    const names = Array.from(document.querySelectorAll(".setupName")).map((el) => el.value.trim());
    const classes = Array.from(document.querySelectorAll(".setupClass")).map((el) => el.value);
    const isBot = setupMode === "campaign"
      ? Array.from({ length: names.length }, (_, i) => !!setupBots[i])
      : names.map(() => false);
    if (setupMode === "campaign" && isBot.every(Boolean)) {
      alert("Campaign needs at least one human player — untick a bot.");
      return;
    }
    testMode = document.getElementById("testModeToggle").checked;
    try {
      game = new Game(names, classes, { mode: setupMode, isBot });
      blockBounds = computeBlockBounds(game.board);
      window.__game = game; // debug hook
      window.__render = render; // debug hook
      render();
    } catch (e) {
      alert(e.message);
    }
  });
}

function boardCellPx(size) {
  // Largest square board that fits beside the info panel and within the viewport height.
  const panel = panelCollapsed ? 0 : PANEL_W;
  const avail = Math.min(window.innerWidth - panel - 28, window.innerHeight - 24);
  return Math.max(14, Math.floor(avail / size));
}

function renderBoard() {
  const b = game.board;
  const cell = boardCellPx(b.size);
  let html = `<div class="board" style="--cell:${cell}px; grid-template-columns: repeat(${b.size}, var(--cell));">`;
  for (let r = 0; r < b.size; r++) {
    for (let c = 0; c < b.size; c++) {
      const tile = b.tiles[r][c];
      const entry = b.entryTypeAt(r, c);
      const hazard = b.hazardAt(r, c);
      const occupants = game.players.filter((p) => p.alive && p.r === r && p.c === c);
      let content = "";
      if (occupants.length) {
        content = occupants
          .map((p, i) => {
            const idx = game.players.indexOf(p);
            const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
            const art = TOKEN_ART[p.className];
            if (art) {
              return `<span class="token art" style="background-image:url('${art}');outline:2px solid ${color}" title="${p.name}"></span>`;
            }
            return `<span class="token" style="background:${color}" title="${p.name}">${p.name[0]}</span>`;
          })
          .join("");
      }
      const bgStyle = tileBackgroundStyle({
        tileType: tile.type,
        entryType: entry,
        hazardType: hazard,
        r,
        c,
        blockBounds,
      });
      const isTcDoor = tile.type === "townCenter" && b.townCenter.doors.some((d) => d.r === r && d.c === c);
      const isTcDoorOutside = b.townCenter.doors.some((d) => d.outside.r === r && d.outside.c === c);
      let extraClass = entry ? ` entry-${entry}` : hazard ? ` hazard-${hazard}` : "";
      if (isTcDoor) extraClass += " tc-door";
      if (isTcDoorOutside) extraClass += " entry-townCenter";
      const ownerId = entry && game.propertyOwner && entry in game.propertyOwner ? game.propertyOwner[entry] : undefined;
      const ownerName = ownerId ? game.players.find((p) => p.id === ownerId)?.name : ownerId === null ? "unclaimed" : null;
      let title = entry ? `${entry} entrance${ownerName ? ` (${ownerName})` : ""}` : hazard ? `${hazard} hazard` : "";
      if (isTcDoor) title = "Town Center exit";
      if (isTcDoorOutside) title = "Town Center exit path";
      html += `<div class="tile ${tile.type}${extraClass}" style="${bgStyle}" title="${title}">${content}</div>`;
    }
  }
  html += "</div>";
  return html;
}

function renderPlayers() {
  return `<div class="players">${game.players
    .map((p, i) => {
      const groupTag = p.allianceId ? ` <span class="allianceTag">alliance ${p.allianceId}</span>` : "";
      const graceTag = p.alive && p.turnNumber <= 2 ? ` <span class="statusTag grace">grace ${p.turnNumber}/2</span>` : "";
      const statusTags = `${p.poisoned ? ` <span class="statusTag poisoned">poisoned</span>` : ""}${p.snared ? ` <span class="statusTag snared">snared</span>` : ""}${graceTag}`;
      const classLabel = CLASSES[p.className]?.label || p.className;
      return `<div class="playerRow ${p.alive ? "" : "dead"}">
        <span class="swatch" style="background:${PLAYER_COLORS[i % PLAYER_COLORS.length]}"></span>
        <strong>${p.name}</strong>${p.isBot ? ' <span class="botTag">bot</span>' : ""} (${classLabel}) — HP ${p.hp}, ${p.coins} coins${p.alive ? "" : " (eliminated)"}${groupTag}${statusTags}
      </div>`;
    })
    .join("")}</div>`;
}

function renderLog() {
  return `<div class="log">${game.log.slice(-30).map((l) => `<div>${l}</div>`).join("")}</div>`;
}

function renderControls() {
  const g = game;
  const p = g.current;

  if (g.phase === "game-over") {
    let extra = "";
    if (g.mode === "campaign") {
      const human = g.players.find((pl) => !pl.isBot);
      if (human) extra = `<p class="note">Campaign — ${human.name} carries forward ${human.coins} coins.</p>`;
    }
    return `<div class="controls"><h2>Game Over</h2><p>${g.log[g.log.length - 1]}</p>${extra}
      <button id="newGameBtn">New game</button></div>`;
  }

  if (g.phase === "awaiting-roll") {
    if (!p.isBot) startTimer("roll", () => {
      g.autoSkipTurn();
      render();
    });
    return `<div class="controls">
      <h2>${p.name}'s turn</h2>
      <p>Roll timer: <span id="timer"></span></p>
      <button id="rollBtn">Roll dice</button>
      ${g.canRestAtInn() ? `<button id="restBtn">Rest at Inn (heal 20 HP, skip turn)</button>` : ""}
    </div>`;
  }

  if (g.phase === "awaiting-fork") {
    const from = { r: p.r, c: p.c };
    return `<div class="controls">
      <h2>${p.name} — choose a direction</h2>
      ${g.pendingMove.options
        .map((o) => `<button class="forkBtn" data-r="${o.r}" data-c="${o.c}">${dirLabel(from, o)}</button>`)
        .join("")}
    </div>`;
  }

  if (g.phase === "awaiting-proximity-target") {
    const targets = g.pendingProximity.targets.map((id) => g.players.find((pl) => pl.id === id));
    return `<div class="controls">
      <h2>${p.name} — who?</h2>
      ${targets.map((t) => `<button class="targetBtn" data-id="${t.id}">${t.name}</button>`).join("")}
    </div>`;
  }

  if (g.phase === "awaiting-proximity-action") {
    const target = g.players.find((pl) => pl.id === g.pendingProximity.activeTargetId);
    const declined = g.pendingProximity.declinedBy?.has(target.id);
    return `<div class="controls">
      <h2>${p.name} near ${target.name}</h2>
      <button id="pvpBtn">Initiate PvP</button>
      <button id="nothingBtn">Do Nothing</button>
      ${declined ? "" : `<button id="allianceBtn">Propose Alliance</button>`}
      ${g.canHeal(target.id) ? `<button id="healBtn">Heal ${target.name} (cures poison)</button>` : ""}
    </div>`;
  }

  if (g.phase === "awaiting-alliance-response") {
    const from = g.players.find((pl) => pl.id === g.pendingAllianceProposal.fromId);
    const to = g.players.find((pl) => pl.id === g.pendingAllianceProposal.toId);
    return `<div class="controls">
      <h2>${to.name}: accept alliance from ${from.name}?</h2>
      <button id="acceptAllianceBtn">Accept</button>
      <button id="declineAllianceBtn">Decline</button>
    </div>`;
  }

  if (g.phase === "awaiting-leave-or-decline") {
    const from = g.players.find((pl) => pl.id === g.pendingAllianceProposal.fromId);
    const to = g.players.find((pl) => pl.id === g.pendingAllianceProposal.toId);
    const currentGroup = g.allianceGroupOf(to.id);
    const allyNames = [...currentGroup.members]
      .filter((id) => id !== to.id)
      .map((id) => g.players.find((pl) => pl.id === id).name)
      .join(", ");
    return `<div class="controls">
      <h2>${to.name} is already allied with ${allyNames} — joining ${from.name} means leaving that alliance</h2>
      <button id="leaveAndJoinBtn">Leave current alliance & join ${from.name}</button>
      <button id="declineLeaveBtn">Decline, stay allied with ${allyNames}</button>
    </div>`;
  }

  if (g.phase === "awaiting-post-withdrawal-alliance") {
    const a = g.players.find((pl) => pl.id === g.pendingWithdrawalAlliance.aId);
    const b = g.players.find((pl) => pl.id === g.pendingWithdrawalAlliance.bId);
    return `<div class="controls">
      <h2>Battle withdrawn — propose an alliance?</h2>
      <button id="proposeAId">${a.name} proposes to ${b.name}</button>
      <button id="proposeBId">${b.name} proposes to ${a.name}</button>
      <button id="skipAllianceBtn">Skip</button>
    </div>`;
  }

  return `<div class="controls">Unhandled phase: ${g.phase}</div>`;
}

// --- PvP battle scene (full-window) ---------------------------------

function battleActorId(b) {
  if (b.pendingWithdrawal) return b.pendingWithdrawal.opponentId;
  if (b._awaitingGuard) return b.defenderId;
  return b.attackerId;
}

function battleLogLine(e) {
  const nm = (id) => game.players.find((p) => p.id === id)?.name || id;
  switch (e.event) {
    case "draw": return `${nm(e.playerId)} draws.`;
    case "attack-passed-no-card": return `${nm(e.playerId)} passes (no attack card).`;
    case "attack-resolved":
      return `${nm(e.attackerId)} hits ${nm(e.defenderId)} for ${e.damage} (${e.guardCard ? "guarded" : "no guard"}) — ${nm(e.defenderId)} at ${e.defenderHpAfter} HP.`;
    case "withdrawal-requested": return `${nm(e.playerId)} requests withdrawal.`;
    case "withdrawal-accepted": return `Withdrawal accepted — battle ends, no winner.`;
    case "withdrawal-denied": return `Withdrawal denied.`;
    default: return JSON.stringify(e);
  }
}

function fighterCard(bp, p, active) {
  const pct = Math.max(0, Math.min(100, bp.hp));
  return `<div class="fighter${active ? " active" : ""}">
    <div class="fighterHead">
      <span class="fighterName">${p.name}${p.isBot ? ' <span class="botTag">bot</span>' : ""}</span>
      <span class="muted">${CLASSES[p.className]?.label || p.className}</span>
    </div>
    <div class="hpTrack"><div class="hpFill" style="width:${pct}%"></div><span class="hpNum">${Math.max(0, bp.hp)} HP</span></div>
    <div class="deckMeta"><span title="cards left in deck">🂠 Deck ${bp.deck.length}</span><span>✋ Hand ${bp.hand.length}</span><span>🗑 ${bp.discard.length}</span></div>
  </div>`;
}

function battleSceneHtml() {
  const g = game;
  const b = g.activeBattle;
  const actorId = battleActorId(b);
  const actor = g.players.find((p) => p.id === actorId);
  const actorS = b.players[actorId];
  const foeId = actorId === b.attackerId ? b.defenderId : b.attackerId;
  const foe = g.players.find((p) => p.id === foeId);
  const foeS = b.players[foeId];
  const atkName = g.players.find((p) => p.id === b.attackerId).name;

  const table = b._awaitingGuard && b._pendingAttackCard
    ? `<div class="tableWrap">${cardHtml(b._pendingAttackCard, "attack")}<div class="muted">${atkName}'s attack</div></div>`
    : `<div class="tableWrap empty"><div class="muted">attack table</div></div>`;

  let action;
  if (b.pendingWithdrawal) {
    const req = g.players.find((p) => p.id === b.pendingWithdrawal.requesterId).name;
    action = actor.isBot
      ? `<p class="muted">${actor.name} is deciding on the withdrawal…</p>`
      : `<h3>${req} requests withdrawal</h3>
         <div class="actBtns"><button id="withdrawAcceptBtn">Accept — end, no winner</button>
         <button id="withdrawDenyBtn">Deny — fight on</button></div>`;
  } else if (b._awaitingGuard) {
    const guards = actorS.hand.filter((c) => c.type === "guard");
    action = actor.isBot
      ? `<p class="muted">${actor.name} is choosing a guard…</p>`
      : `<h3>${actor.name} — play a Guard, or take the hit</h3>
         <div class="hand">${guards.map((c) => cardHtml(c, "guard", { dataId: true, playable: true, cls: "guardBtn" })).join("")}</div>
         <div class="actBtns"><button id="noGuardBtn" class="takeHit">No Guard (take the hit)</button></div>`;
  } else {
    const attacks = actorS.hand.filter((c) => c.type === "attack");
    action = actor.isBot
      ? `<p class="muted">${actor.name} is choosing an attack…</p>`
      : attacks.length
      ? `<h3>${actor.name}'s turn — play an Attack</h3>
         <div class="hand">${attacks.map((c) => cardHtml(c, "attack", { dataId: true, playable: true, cls: "attackBtn" })).join("")}</div>`
      : `<h3>${actor.name}'s turn</h3><p class="muted">No attack cards in hand.</p>
         <div class="actBtns"><button id="skipAttackBtn" class="takeHit">Pass (no card)</button></div>`;
  }

  const fullHand = actorS.hand
    .map((c) => cardHtml(c, c.type, { small: true }))
    .join("");

  return `
    <button id="fsBtn">⛶ Fullscreen</button>
    <button id="menuBtn">☰ Menu</button>
    <div class="battleScene">
      <div class="battleTop">
        ${fighterCard(foeS, foe, false)}
        <div class="vsBadge">VS</div>
        ${fighterCard(actorS, actor, true)}
      </div>
      <div class="battleMid">
        ${table}
        <div class="battleTimer">⏱ <span id="timer"></span></div>
      </div>
      <div class="battleAction">${action}</div>
      <div class="battleBar">
        <button class="withdrawReqBtn" data-id="${actorId}" ${b.withdrawalUsed[actorId] ? "disabled" : ""}>Request withdrawal</button>
        <button id="battleLogToggle">Battle log</button>
      </div>
      <div class="handStrip"><span class="muted">${actor.name}'s hand</span><div class="handStripCards">${fullHand}</div></div>
      <div class="battleLog" id="battleLogBox" hidden>${b.log.slice(-14).map((e) => `<div>${battleLogLine(e)}</div>`).join("")}</div>
    </div>`;
}

function startPvpTimerIfHuman() {
  const b = game.activeBattle;
  const actor = game.players.find((p) => p.id === battleActorId(b));
  if (!actor || actor.isBot) return;
  // Design: 30s PvP turn auto-ends if unused. Only the defender's "no guard" is a
  // clean auto-resolvable no-action state — the attacker always ends their turn manually.
  startTimer("pvp", () => {
    if (b._awaitingGuard) {
      b.respondGuard(null);
      if (b.phase === "finished") game.finishPvpIfOver();
      render();
    }
  });
}

function render() {
  clearTimer();

  // PvP takes over the whole window. Auto-advance the mechanical sub-phases first.
  if (game && game.phase === "in-pvp" && game.activeBattle) {
    const b = game.activeBattle;
    if (b.phase === "draw") { b.drawPhase(); return render(); }
    if (!b.pendingWithdrawal && b.phase === "end") { b.endPhase(); return render(); }
    if (b.phase === "finished") { game.finishPvpIfOver(); return render(); }
    root.innerHTML = battleSceneHtml();
    wireEvents();
    wireChromeButtons();
    document.getElementById("battleLogToggle")?.addEventListener("click", () => {
      const box = document.getElementById("battleLogBox");
      if (box) box.hidden = !box.hidden;
    });
    startPvpTimerIfHuman();
    scheduleBotStep();
    return;
  }

  root.innerHTML = `
    <button id="fsBtn">⛶ Fullscreen</button>
    <button id="menuBtn">☰ Menu</button>
    <button id="panelBtn">${panelCollapsed ? "☰ Show panel" : "✕ Hide panel"}</button>
    <div class="layout">
      <div class="left">${renderBoard()}</div>
      <div class="right${panelCollapsed ? " collapsed" : ""}">
        ${renderPlayers()}
        ${renderControls()}
        ${renderLog()}
      </div>
    </div>
  `;
  wireEvents();
  wireChromeButtons();
  scheduleBotStep();
}

// --- Campaign-mode bot driver -------------------------------------------
// Mid-tier AI, deliberately beatable (design bible Section 18). Runs one
// action per tick, then render() re-schedules if a bot still owns the
// pending decision. Whoever "owns" a decision depends on the phase — for
// alliance responses and PvP guards it's not necessarily game.current.

let botTimer = null;
let botErrRun = 0; // consecutive bot-step failures — bail out instead of hot-looping

function botDeciderId() {
  const g = game;
  switch (g.phase) {
    case "awaiting-roll":
    case "awaiting-fork":
    case "awaiting-proximity-target":
    case "awaiting-proximity-action":
    case "awaiting-post-withdrawal-alliance":
      return g.current.id;
    case "awaiting-alliance-response":
    case "awaiting-leave-or-decline":
      return g.pendingAllianceProposal?.toId ?? null;
    case "in-pvp": {
      const b = g.activeBattle;
      if (!b) return null;
      if (b.pendingWithdrawal) return b.pendingWithdrawal.opponentId;
      if (b._awaitingGuard) return b.defenderId;
      return b.attackerId;
    }
    default:
      return null;
  }
}

function scheduleBotStep() {
  clearTimeout(botTimer);
  if (!game || game.phase === "game-over") return;
  const id = botDeciderId();
  const p = id && game.players.find((x) => x.id === id);
  if (!p || !p.isBot || !p.alive) return;
  botTimer = setTimeout(() => {
    try {
      botAct();
      botErrRun = 0;
    } catch (e) {
      botErrRun++;
      console.error(`bot step failed (${botErrRun}):`, e);
      if (botErrRun > 4) { game.log.push(`[bot driver stalled: ${e.message}]`); return; }
    }
    render();
  }, testMode ? 200 : BOT_STEP_MS);
}

function nearestOpponent(g, from) {
  const foes = g.players.filter(
    (p) => p.alive && p.id !== from.id && (from.allianceId == null || p.allianceId !== from.allianceId)
  );
  let best = null;
  let bestD = Infinity;
  for (const f of foes) {
    const d = Math.abs(f.r - from.r) + Math.abs(f.c - from.c);
    if (d < bestD) { bestD = d; best = f; }
  }
  return best;
}

function botAct() {
  const g = game;
  const me = g.players.find((x) => x.id === botDeciderId());
  if (!me) return;

  switch (g.phase) {
    case "awaiting-roll": {
      if (g.canRestAtInn() && me.hp <= 55) g.restAtInn();
      else g.rollDice();
      return;
    }
    case "awaiting-fork": {
      const opts = g.pendingMove.options;
      const target = Math.random() < 0.4 ? nearestOpponent(g, me) : null;
      let pick = opts[Math.floor(Math.random() * opts.length)];
      if (target) {
        pick = opts.reduce((a, b) => {
          const da = Math.abs(a.r - target.r) + Math.abs(a.c - target.c);
          const db = Math.abs(b.r - target.r) + Math.abs(b.c - target.c);
          return db < da ? b : a;
        });
      }
      g.chooseFork(pick);
      return;
    }
    case "awaiting-proximity-target": {
      const ids = g.pendingProximity.targets;
      const players = ids.map((id) => g.players.find((p) => p.id === id));
      const weakest = players.reduce((a, b) => (b.hp < a.hp ? b : a));
      g.chooseProximityTarget(weakest.id);
      return;
    }
    case "awaiting-proximity-action": {
      const tId = g.pendingProximity.activeTargetId;
      const t = g.players.find((p) => p.id === tId);
      const declined = g.pendingProximity.declinedBy?.has(tId);
      const allied = me.allianceId != null && me.allianceId === t.allianceId;
      if (g.canHeal(tId) && Math.random() < 0.7) { g.chooseProximityAction("heal"); return; }
      if (!allied && me.hp > t.hp + 10 && Math.random() < 0.35) { g.chooseProximityAction("pvp"); return; }
      if (!allied && me.allianceId == null && !declined && Math.random() < 0.15) { g.chooseProximityAction("alliance"); return; }
      g.chooseProximityAction("nothing");
      return;
    }
    case "awaiting-alliance-response": {
      g.respondAlliance(Math.random() < 0.55);
      return;
    }
    case "awaiting-leave-or-decline": {
      g.declineLeaveAlliance(); // bots stay in their current alliance
      return;
    }
    case "awaiting-post-withdrawal-alliance": {
      g.skipPostWithdrawalAlliance();
      return;
    }
    case "in-pvp": {
      const b = g.activeBattle;
      if (!b) return;
      if (b.pendingWithdrawal) {
        const meState = b.players[me.id];
        b.respondWithdrawal(meState.hp < 25 ? Math.random() < 0.5 : Math.random() < 0.35);
        if (b.phase === "finished") g.finishPvpIfOver();
        return;
      }
      if (b._awaitingGuard) {
        const guards = b.players[me.id].hand.filter((c) => c.type === "guard");
        const incoming = b._pendingAttackCard?.value ?? 0;
        let pick = null;
        if (guards.length) {
          pick = incoming >= 6
            ? guards.reduce((a, c) => (c.value > a.value ? c : a))
            : guards.reduce((a, c) => (c.value < a.value ? c : a));
        }
        b.respondGuard(pick ? pick.id : null);
        if (b.phase === "finished") g.finishPvpIfOver();
        return;
      }
      // attacker's move
      const meState = b.players[me.id];
      if (meState.hp < 22 && !b.withdrawalUsed[me.id] && Math.random() < 0.4) {
        b.requestWithdrawal(me.id);
        return;
      }
      const attacks = meState.hand.filter((c) => c.type === "attack");
      if (attacks.length) {
        const best = attacks.reduce((a, c) => (c.value > a.value ? c : a));
        b.playAttack(best.id);
      } else {
        b.passAttackNoCard();
      }
      return;
    }
  }
}

function wireChromeButtons() {
  const fs = document.getElementById("fsBtn");
  if (fs) {
    fs.textContent = document.fullscreenElement ? "⛶ Exit fullscreen" : "⛶ Fullscreen";
    fs.addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.();
    });
  }
  const pb = document.getElementById("panelBtn");
  if (pb) {
    pb.addEventListener("click", () => {
      panelCollapsed = !panelCollapsed;
      if (game) render(); else renderSetup();
    });
  }
  const mb = document.getElementById("menuBtn");
  if (mb) {
    mb.addEventListener("click", () => {
      if (game && game.phase !== "game-over" && !confirm("Leave the current game and return to the menu?")) return;
      renderMenu();
    });
  }
}

// Re-fit the board to the window on resize / fullscreen toggle (debounced).
let _resizeT;
function onViewportChange() {
  clearTimeout(_resizeT);
  _resizeT = setTimeout(() => { if (game) render(); }, 120);
}
window.addEventListener("resize", onViewportChange);
document.addEventListener("fullscreenchange", onViewportChange);

function wireEvents() {
  const g = game;
  document.getElementById("newGameBtn")?.addEventListener("click", () => {
    clearTimeout(botTimer);
    clearTimer();
    game = null;
    renderMenu();
  });
  document.getElementById("rollBtn")?.addEventListener("click", () => {
    g.rollDice();
    render();
  });
  document.getElementById("restBtn")?.addEventListener("click", () => {
    g.restAtInn();
    render();
  });
  document.getElementById("healBtn")?.addEventListener("click", () => {
    g.chooseProximityAction("heal");
    render();
  });
  document.querySelectorAll(".forkBtn").forEach((btn) =>
    btn.addEventListener("click", () => {
      g.chooseFork({ r: Number(btn.dataset.r), c: Number(btn.dataset.c) });
      render();
    })
  );
  document.querySelectorAll(".targetBtn").forEach((btn) =>
    btn.addEventListener("click", () => {
      g.chooseProximityTarget(btn.dataset.id);
      render();
    })
  );
  document.getElementById("pvpBtn")?.addEventListener("click", () => {
    g.chooseProximityAction("pvp");
    render();
  });
  document.getElementById("nothingBtn")?.addEventListener("click", () => {
    g.chooseProximityAction("nothing");
    render();
  });
  document.getElementById("allianceBtn")?.addEventListener("click", () => {
    g.chooseProximityAction("alliance");
    render();
  });
  document.getElementById("acceptAllianceBtn")?.addEventListener("click", () => {
    g.respondAlliance(true);
    render();
  });
  document.getElementById("declineAllianceBtn")?.addEventListener("click", () => {
    g.respondAlliance(false);
    render();
  });
  document.getElementById("leaveAndJoinBtn")?.addEventListener("click", () => {
    g.leaveAllianceAndJoin();
    render();
  });
  document.getElementById("declineLeaveBtn")?.addEventListener("click", () => {
    g.declineLeaveAlliance();
    render();
  });
  document.getElementById("proposeAId")?.addEventListener("click", () => {
    g.proposeAllianceAfterWithdrawal(g.pendingWithdrawalAlliance.aId);
    render();
  });
  document.getElementById("proposeBId")?.addEventListener("click", () => {
    g.proposeAllianceAfterWithdrawal(g.pendingWithdrawalAlliance.bId);
    render();
  });
  document.getElementById("skipAllianceBtn")?.addEventListener("click", () => {
    g.skipPostWithdrawalAlliance();
    render();
  });

  document.querySelectorAll(".attackBtn").forEach((btn) =>
    btn.addEventListener("click", () => {
      g.activeBattle.playAttack(btn.dataset.id);
      render();
    })
  );
  document.querySelectorAll(".guardBtn").forEach((btn) =>
    btn.addEventListener("click", () => {
      g.activeBattle.respondGuard(btn.dataset.id);
      if (g.activeBattle.phase === "finished") g.finishPvpIfOver();
      render();
    })
  );
  document.getElementById("noGuardBtn")?.addEventListener("click", () => {
    g.activeBattle.respondGuard(null);
    if (g.activeBattle.phase === "finished") g.finishPvpIfOver();
    render();
  });
  document.getElementById("skipAttackBtn")?.addEventListener("click", () => {
    g.activeBattle.passAttackNoCard();
    render();
  });
  document.querySelectorAll(".withdrawReqBtn").forEach((btn) =>
    btn.addEventListener("click", () => {
      g.activeBattle.requestWithdrawal(btn.dataset.id);
      render();
    })
  );
  document.getElementById("withdrawAcceptBtn")?.addEventListener("click", () => {
    g.activeBattle.respondWithdrawal(true);
    if (g.activeBattle.phase === "finished") g.finishPvpIfOver();
    render();
  });
  document.getElementById("withdrawDenyBtn")?.addEventListener("click", () => {
    g.activeBattle.respondWithdrawal(false);
    render();
  });
}

// --- Menu / navigation shell -----------------------------------------

function goto(s) {
  screen = s;
  if (s === "setup") renderSetup();
  else if (s === "deck") renderDeck();
  else if (s === "shop") renderStub("🛒 Shop", shopBody());
  else if (s === "account") renderStub("👤 Account", accountBody());
  else if (s === "inventory") renderStub("🎒 Inventory", inventoryBody());
  else renderMenu();
}

function renderMenu() {
  screen = "menu";
  game = null;
  clearTimer();
  clearTimeout(botTimer);
  root.innerHTML = `
    <button id="fsBtn">⛶ Fullscreen</button>
    <div class="menuWrap"><div class="menu">
      <h1>🐾 Cat Board Game</h1>
      <p class="note">Vertical-slice prototype — core loop, PvP card battles, alliances, and Campaign vs bots.</p>
      <div class="menuBtns">
        <button class="menuBtn big" data-go="setup">▶ Play</button>
        <button class="menuBtn" data-go="deck">🃏 Deck</button>
        <button class="menuBtn" data-go="shop">🛒 Shop</button>
        <button class="menuBtn" data-go="account">👤 Account</button>
        <button class="menuBtn" data-go="inventory">🎒 Inventory</button>
      </div>
    </div></div>`;
  wireChromeButtons();
  document.querySelectorAll(".menuBtn").forEach((b) => b.addEventListener("click", () => goto(b.dataset.go)));
}

function renderStub(title, bodyHtml) {
  root.innerHTML = `
    <button id="fsBtn">⛶ Fullscreen</button>
    <div class="menuWrap"><div class="screenCard">
      <div class="screenHead"><button class="backBtn" id="backBtn">← Menu</button><h1>${title}</h1></div>
      ${bodyHtml}
    </div></div>`;
  wireChromeButtons();
  document.getElementById("backBtn").addEventListener("click", renderMenu);
}

function shopBody() {
  const items = [
    ["Booster Pack", "Random cards — rarity mix TBD (Section 12/17)"],
    ["500 Fel", "Persistent currency — property leveling, entry fees"],
    ["Cosmetic Cat", "New skin for an existing class"],
    ["Board Theme", "Cosmetic board reskin"],
  ];
  return `<p class="note">Gems buy Fel, properties, Booster Packs, cosmetic cats and board themes (Section 16). Real-money purchases aren't wired into this prototype.</p>
    <div class="shopGrid">${items
      .map(([n, d]) => `<div class="shopItem"><b>${n}</b><span class="muted">${d}</span><button disabled>Buy (— Gems)</button></div>`)
      .join("")}</div>`;
}

function accountBody() {
  return `<p class="note">No persistence in the prototype — these reset every load.</p>
    <div class="statGrid">
      <div><b>Fel</b><span class="muted">—</span></div>
      <div><b>Gems</b><span class="muted">—</span></div>
      <div><b>Campaign coins carried</b><span class="muted">—</span></div>
      <div><b>Prized wins</b><span class="muted">0</span></div>
      <div><b>Default class</b><span class="muted">${CLASSES[deckClass]?.label || deckClass}</span></div>
    </div>`;
}

function inventoryBody() {
  const cats = Object.values(CLASSES).map((c) => c.label).join(", ");
  return `<p class="note">Permanent collection (Section 21). Placeholder — no collection system in the prototype.</p>
    <div class="invGrid">
      <div><b>Cats / Classes</b><span class="muted">${cats} (all unlocked here)</span></div>
      <div><b>Equipment</b><span class="muted">8 slots — none (no equipment system yet)</span></div>
      <div><b>Cards</b><span class="muted">Each class's 10 Attack + 10 Guard starter deck — see 🃏 Deck</span></div>
      <div><b>Properties</b><span class="muted">None owned</span></div>
    </div>`;
}

// --- Card component --------------------------------------------------

function cardHtml(card, type, opts = {}) {
  const frame = `../assets/cards/frame-${type}.svg`;
  const extra = [opts.cls, opts.playable ? "playable" : "", opts.small ? "small" : ""].filter(Boolean).join(" ");
  const id = opts.dataId ? ` data-id="${card.id}"` : "";
  return `<div class="card card-${type} ${extra}"${id} style="background-image:url('${frame}')" title="${card.name} (${card.value})">
      <span class="cardVal">${card.value}</span>
      <span class="cardName">${card.name}</span>
    </div>`;
}

// --- Deck screen ---------------------------------------------------

function renderDeck() {
  screen = "deck";
  const classKeys = Object.keys(CLASSES);
  const def = CLASSES[deckClass];
  root.innerHTML = `
    <button id="fsBtn">⛶ Fullscreen</button>
    <div class="menuWrap"><div class="screenCard wide">
      <div class="screenHead"><button class="backBtn" id="backBtn">← Menu</button><h1>🃏 Deck — ${def.label}</h1></div>
      <p class="note">Every class has a fixed 10 Attack + 10 Guard starter deck (design bible Section 06). In the full game you'll build a custom deck from your card collection (Section 17) — for now, choose the class loadout you'll play.</p>
      <div class="classPick">
        ${classKeys.map((k) => `<button class="classBtn ${k === deckClass ? "sel" : ""}" data-k="${k}">${CLASSES[k].label}</button>`).join("")}
      </div>
      <h3>Attack · 10 cards</h3>
      <div class="cardGrid">${def.attack.map((c) => cardHtml(c, "attack")).join("")}</div>
      <h3>Guard · 10 cards</h3>
      <div class="cardGrid">${def.guard.map((c) => cardHtml(c, "guard")).join("")}</div>
      <div class="deckFoot"><button id="useLoadoutBtn" class="menuBtn big">Play as ${def.label} →</button></div>
    </div></div>`;
  wireChromeButtons();
  document.getElementById("backBtn").addEventListener("click", renderMenu);
  document.querySelectorAll(".classBtn").forEach((b) =>
    b.addEventListener("click", () => { deckClass = b.dataset.k; renderDeck(); })
  );
  document.getElementById("useLoadoutBtn").addEventListener("click", () => goto("setup"));
}

window.__renderMenu = renderMenu; // debug hook
window.__render = render; // debug hook
renderMenu();
