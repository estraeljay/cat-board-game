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
    const cls = classKeys[i % classKeys.length];
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
      <h1>Cat Board Game — Vertical Slice</h1>
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

  if (g.phase === "in-pvp") {
    return renderPvp();
  }

  return `<div class="controls">Unhandled phase: ${g.phase}</div>`;
}

function renderPvp() {
  const battle = game.activeBattle;
  if (!battle) return "";

  if (battle.phase === "draw") {
    battle.drawPhase();
    return renderPvp();
  }

  if (battle.pendingWithdrawal) {
    const { requesterId, opponentId } = battle.pendingWithdrawal;
    const opp = game.players.find((p) => p.id === opponentId);
    const req = game.players.find((p) => p.id === requesterId);
    return `<div class="controls">
      <h2>PvP: ${req.name} requests withdrawal</h2>
      <p>${opp.name}, accept?</p>
      <button id="withdrawAcceptBtn">Accept</button>
      <button id="withdrawDenyBtn">Deny</button>
      ${battlePanel(battle)}
    </div>`;
  }

  if (battle.phase === "end") {
    battle.endPhase();
    return renderPvp();
  }

  const attacker = game.players.find((p) => p.id === battle.attackerId);
  const defender = game.players.find((p) => p.id === battle.defenderId);
  const attackerState = battle.players[battle.attackerId];
  const defenderState = battle.players[battle.defenderId];

  startTimer("pvp", () => {
    // Design: 30s PvP turn auto-ends if unused. "No guard" is a clean, well-defined
    // no-action state for the defender, so that side auto-resolves on timeout.
    // The attacker's side has no such clean default (skipping while holding a
    // playable attack card isn't modeled) — ending that turn is always a manual
    // "Pass (no card)" click, never forced by the timer.
    if (battle._awaitingGuard) {
      battle.respondGuard(null);
      if (battle.phase === "finished") game.finishPvpIfOver();
      render();
    }
  });

  let actionHtml;
  if (battle._awaitingGuard) {
    const guards = defenderState.hand.filter((c) => c.type === "guard");
    actionHtml = `<h2>${defender.name} — guard against ${attacker.name}'s attack?</h2>
      ${guards.map((c) => `<button class="guardBtn" data-id="${c.id}">${c.name} (${c.value})</button>`).join("")}
      <button id="noGuardBtn">No Guard</button>`;
  } else {
    const attacks = attackerState.hand.filter((c) => c.type === "attack");
    actionHtml = `<h2>${attacker.name}'s turn — play an attack card</h2>
      ${attacks.length
        ? attacks.map((c) => `<button class="attackBtn" data-id="${c.id}">${c.name} (${c.value})</button>`).join("")
        : `<p>No attack card in hand.</p><button id="skipAttackBtn">Pass (no card)</button>`}`;
  }

  return `<div class="controls">
    <p>PvP turn timer: <span id="timer"></span></p>
    ${actionHtml}
    <div class="withdrawRow">
      <button class="withdrawReqBtn" data-id="${attacker.id}" ${battle.withdrawalUsed[attacker.id] ? "disabled" : ""}>${attacker.name} requests withdrawal</button>
      <button class="withdrawReqBtn" data-id="${defender.id}" ${battle.withdrawalUsed[defender.id] ? "disabled" : ""}>${defender.name} requests withdrawal</button>
    </div>
    ${battlePanel(battle)}
  </div>`;
}

function battlePanel(battle) {
  return `<div class="battlePanel">
    ${Object.values(battle.players)
      .map((bp) => `<div>${game.players.find((p) => p.id === bp.id).name}: HP ${bp.hp}, hand ${bp.hand.length}</div>`)
      .join("")}
    <div class="battleLog">${battle.log.slice(-8).map((e) => `<div>${JSON.stringify(e)}</div>`).join("")}</div>
  </div>`;
}

function render() {
  clearTimer();
  root.innerHTML = `
    <button id="fsBtn">⛶ Fullscreen</button>
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
    renderSetup();
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

window.__renderSetup = renderSetup; // debug hook
renderSetup();
