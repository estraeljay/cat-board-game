import { Game } from "./game.js";
import { CLASSES } from "./content.js";
import { TOKEN_ART, computeBlockBounds, tileBackgroundStyle } from "./assets.js";

const PLAYER_COLORS = ["#e07a5f", "#81b29a", "#f2cc8f", "#3d5a80", "#9d8df1"];
const DEFAULT_NAMES = ["Whiskers", "Mittens", "Tigerlily"];
let setupPlayerCount = DEFAULT_NAMES.length;
const FAST_TEST_MODE_MS = { roll: 3000, pvp: 3000 };
const REAL_TIMER_MS = { roll: 20000, pvp: 30000 };

let game = null;
let blockBounds = {}; // per-block-type bounding boxes, for slicing facade art across tiles
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

function renderSetup() {
  const classKeys = Object.keys(CLASSES);
  const rows = Array.from({ length: setupPlayerCount }, (_, i) => {
    const name = DEFAULT_NAMES[i] || `Player ${i + 1}`;
    const cls = classKeys[i % classKeys.length];
    return `<div class="playerSetupRow">
      <input type="text" class="setupName" value="${name}">
      <select class="setupClass">${classOptionsHtml(cls)}</select>
    </div>`;
  }).join("");

  root.innerHTML = `
    <h1>Cat Board Game — Vertical Slice</h1>
    <p class="note">Board movement, proximity, PvP battles, alliances, NPC locations/hazards, property cards, and the Coin economy.</p>
    <div class="setup">
      <label>Players (2-5):</label>
      <div id="playerRows">${rows}</div>
      <div>
        <button id="addPlayerBtn" ${setupPlayerCount >= 5 ? "disabled" : ""}>+ Add player</button>
        <button id="removePlayerBtn" ${setupPlayerCount <= 2 ? "disabled" : ""}>- Remove player</button>
      </div>
      <label><input type="checkbox" id="testModeToggle"> Fast test mode (3s timers instead of 20s/30s)</label>
      <button id="startBtn">Start Game</button>
    </div>
  `;
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
    testMode = document.getElementById("testModeToggle").checked;
    try {
      game = new Game(names, classes);
      blockBounds = computeBlockBounds(game.board);
      window.__game = game; // debug hook
      window.__render = render; // debug hook
      render();
    } catch (e) {
      alert(e.message);
    }
  });
}

function renderBoard() {
  const b = game.board;
  const cellPx = 32;
  let html = `<div class="board" style="grid-template-columns: repeat(${b.size}, ${cellPx}px);">`;
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
        <strong>${p.name}</strong> (${classLabel}) — HP ${p.hp}, ${p.coins} coins${p.alive ? "" : " (eliminated)"}${groupTag}${statusTags}
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
    return `<div class="controls"><h2>Game Over</h2><p>${g.log[g.log.length - 1]}</p></div>`;
  }

  if (g.phase === "awaiting-roll") {
    startTimer("roll", () => {
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
    <div class="layout">
      <div class="left">${renderBoard()}</div>
      <div class="right">
        ${renderPlayers()}
        ${renderControls()}
        ${renderLog()}
      </div>
    </div>
  `;
  wireEvents();
}

function wireEvents() {
  const g = game;
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
