// Cat Board Game — Core turn/movement/proximity/alliance state machine
// (design bible Section 01 "Core Game Loop" + Section 14 "Victory Condition")
//
// Scope for this vertical slice (see prototype/README.md for the full list):
//  - No equipment system — players get a fixed placeholder Attack/Defense stat
//    block as a base (all classes share it; classes.md gave card decks, not
//    base stats). The Blacksmith NPC location gives a flat +2 Attack per visit
//    as a stand-in for the locked design's equipment-leveling mechanic.
//  - Player-owned properties (Yarn Emporium/Fish Market/Catnip Garden) and the
//    Fountain NPC property, their card decks, Coins, and the flat 100-coin
//    toll rule come from cat-dice-game-dev.skill (content.js) — the combat
//    formula deliberately stayed the locked stat+card one, not that source's
//    simpler card-only formula. See prototype/README.md.
//  - No Gem-purchase system — properties are claimed free by whoever lands
//    there first, not bought. Our own call, not specified anywhere.
//  - Dice type isn't specified anywhere in the locked design; using a single d6
//    as the simplest placeholder.
//  - The 20s roll timer and 30s PvP turn timer are real but only enforced by
//    the UI layer (app.js), not this module — see pvpTurns.js for the same
//    reasoning on PvP timers.
//  - Poisoned/Thorn-Vine-snared status effects, the Blacksmith/Inn/Church NPC
//    locations, and the ally-heal proximity action are new additions on top
//    of the locked design — see prototype/README.md for exactly which parts
//    are interpretation calls vs. explicit instructions.
//  - Opening grace period: on a player's own first 2 turns, no player-targeting
//    proximity action (PvP/alliance/heal) is available, and no one else can
//    target them either — see _inGracePeriod().

import { generateBoard, PROPERTY_TYPES } from "./board.js";
import { PvpBattle } from "./pvpTurns.js";
import { BASE_HP } from "./combat.js";
import { CLASSES, PROPERTY_DECKS, PROPERTY_TOLL, STARTING_COINS } from "./content.js";

const PLACEHOLDER_STATS = { attack: 15, defense: 12 }; // stand-in for equipment-derived stats; classes.md gave card decks, not base stats, so every class shares this base for now
const CLASS_KEYS = Object.keys(CLASSES);

function shuffleArray(items) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class Game {
  // options: { mode: "prized" | "campaign", isBot: boolean[] }
  //  - "campaign" (design bible Section 22): PvE on-ramp. No player-owned
  //    properties, no Prize Cards, bots fill the non-human seats. Same core
  //    loop, same 3-alliance / 2-winner caps.
  constructor(playerNames, playerClasses, options = {}) {
    if (playerNames.length < 2 || playerNames.length > 5) {
      throw new Error("Cat Board Game supports 2-5 players (Section 18)");
    }
    this.mode = options.mode === "campaign" ? "campaign" : "prized";
    const isBot = options.isBot || [];
    this.board = generateBoard(Math.random, { includePlayerProperties: this.mode !== "campaign" });
    const center = this.board.townCenter.center;
    this.players = playerNames.map((name, i) => ({
      id: `p${i}`,
      name,
      isBot: !!isBot[i], // Campaign: bots play these seats; mid-tier, meant to be beatable
      className: playerClasses?.[i] || CLASS_KEYS[Math.floor(Math.random() * CLASS_KEYS.length)],
      r: center.r,
      c: center.c,
      hp: BASE_HP,
      attack: PLACEHOLDER_STATS.attack,
      defense: PLACEHOLDER_STATS.defense,
      alive: true,
      allianceId: null,
      poisoned: false, // from Poison Swamp; cured at Church or by an allied player's Heal action
      snared: false, // from Thorn Vines; consumed on the player's next roll
      coins: STARTING_COINS,
      items: [], // reward-item property cards — no mechanical effect yet, no equipment system to plug into
      turnNumber: 0, // this player's own turn count — drives the opening grace period (see _inGracePeriod)
    }));
    this.alliances = new Map(); // allianceId -> Set of playerIds
    this.nextAllianceId = 1;

    // Property card decks: shuffle + draw-without-replacement + reshuffle-on-empty,
    // matching the PvP deck convention (not specified upstream — see README).
    this.propertyDecks = {};
    for (const [type, cards] of Object.entries(PROPERTY_DECKS)) {
      this.propertyDecks[type] = { drawPile: shuffleArray(cards), discard: [] };
    }
    // Yarn Emporium / Fish Market / Catnip Garden: first player to land there
    // claims it, free (no Gem-purchase system built yet) — our own call, see README.
    this.propertyOwner = {};
    for (const type of PROPERTY_TYPES) this.propertyOwner[type] = null;
    this.currentPlayerIndex = 0;
    this.phase = "awaiting-roll"; // awaiting-roll | awaiting-fork | awaiting-proximity-target |
                                  // awaiting-proximity-action | awaiting-alliance-response |
                                  // in-pvp | game-over
    this.pendingMove = null;
    this.pendingProximity = null; // { targets: [ids], activeTargetId }
    this.pendingAllianceProposal = null; // { fromId, toId }
    this.pendingWithdrawalAlliance = null; // { aId, bId } offered after a withdrawal
    this.activeBattle = null;
    this.log = [];
    this.winner = null; // { type: 'solo'|'alliance', playerIds: [...] }
  }

  get current() {
    return this.players[this.currentPlayerIndex];
  }

  _pushLog(text) {
    this.log.push(text);
  }

  alivePlayers() {
    return this.players.filter((p) => p.alive);
  }

  allianceGroupOf(playerId) {
    for (const [id, members] of this.alliances) {
      if (members.has(playerId)) return { id, members };
    }
    return null;
  }

  // --- Turn: roll + move -----------------------------------------------

  // Movement revision (2026-08-28): the roll sets a MAXIMUM. The player moves the
  // first tile automatically, then chooses "continue" or "stop" after each tile
  // (phase "awaiting-step") until they hit the max or stop — so they can land
  // exactly on a property/special entry within range. Snared (odd check die)
  // still forces exactly 1 tile with no choice.
  rollDice() {
    if (this.phase !== "awaiting-roll") throw new Error(`Cannot roll during phase ${this.phase}`);
    const player = this.current;
    player.turnNumber++;
    let maxDistance;
    let forced = false;
    if (player.snared) {
      player.snared = false;
      const check = 1 + Math.floor(Math.random() * 6);
      if (check % 2 === 0) {
        maxDistance = 1 + Math.floor(Math.random() * 6);
        this._pushLog(`${player.name} is snared by thorn vines — check roll ${check} (even): moves normally, up to ${maxDistance}.`);
      } else {
        maxDistance = 1;
        forced = true;
        this._pushLog(`${player.name} is snared by thorn vines — check roll ${check} (odd): forced to move exactly 1 tile.`);
      }
    } else {
      maxDistance = 1 + Math.floor(Math.random() * 6); // placeholder: single d6, used as a ceiling
      this._pushLog(`${player.name} rolls a ${maxDistance} — may move up to ${maxDistance} tile${maxDistance === 1 ? "" : "s"}.`);
    }
    this.pendingMove = { stepsRemaining: maxDistance, maxDistance, moved: 0, cameFrom: null, forced };
    this._advanceMovement();
    return maxDistance;
  }

  // While standing on an Inn entry tile, a player may rest instead of rolling.
  canRestAtInn() {
    return this.phase === "awaiting-roll" && this.board.entryTypeAt(this.current.r, this.current.c) === "inn";
  }

  restAtInn() {
    if (!this.canRestAtInn()) throw new Error("Not standing at an Inn to rest");
    const player = this.current;
    player.turnNumber++;
    player.hp = Math.min(BASE_HP, player.hp + 20);
    this._pushLog(`${player.name} rests at the Inn and heals to ${player.hp} HP.`);
    this._endTurn();
  }

  autoSkipTurn() {
    if (this.phase !== "awaiting-roll") throw new Error("Can only auto-skip while awaiting a roll");
    this.current.turnNumber++;
    this._pushLog(`${this.current.name} let the 20s timer run out — turn skipped (no roll, no move).`);
    this._endTurn();
  }

  // Not in the locked design — our own addition per direction: on a player's own
  // first 2 turns, they can't initiate any player-targeting action (PvP, alliance
  // proposal, ally-heal), AND no one else can target them either (checked both
  // ways in _resolveLanding — as initiator here, and by filtering `nearby` down
  // to non-grace players before building the target list).
  _inGracePeriod(player) {
    return player.turnNumber <= 2;
  }

  _applyHazard(player, r, c) {
    const hazard = this.board.hazardAt(r, c);
    if (hazard === "poison") {
      player.hp = Math.max(1, player.hp - 1); // environmental damage never eliminates on its own
      player.poisoned = true;
      this._pushLog(`${player.name} wades through a Poison Swamp — loses 1 HP (now ${player.hp}) and is poisoned.`);
    } else if (hazard === "thorn") {
      if (!player.snared) {
        player.snared = true;
        this._pushLog(`${player.name} gets caught in Thorn Vines — their next roll will be affected.`);
      }
    }
  }

  // NPC locations only trigger on landing (stopping), matching the existing
  // "passing through a property without stopping triggers nothing" rule (Section 02).
  _applyLocationEntry(player) {
    const entry = this.board.entryTypeAt(player.r, player.c);
    if (entry === "blacksmith") {
      player.attack += 2;
      this._pushLog(`${player.name} visits the Blacksmith — Attack is now ${player.attack} (+2).`);
    } else if (entry === "church") {
      if (player.poisoned) {
        player.poisoned = false;
        this._pushLog(`${player.name} visits the Church and is cured of poison.`);
      }
    } else if (entry === "fountain") {
      this._drawAndApplyPropertyCard(player, "fountain");
    } else if (PROPERTY_TYPES.has(entry)) {
      this._visitOwnedProperty(player, entry);
    }
    // Inn has no auto-effect on landing — see canRestAtInn()/restAtInn().
  }

  _visitOwnedProperty(player, type) {
    const owner = this.propertyOwner[type];
    if (owner === null) {
      this.propertyOwner[type] = player.id;
      this._pushLog(`${player.name} claims ${type} — no prior owner.`);
      this._drawAndApplyPropertyCard(player, type);
      return;
    }
    if (owner === player.id) {
      this._drawAndApplyPropertyCard(player, type);
      return;
    }
    const ownerPlayer = this.players.find((p) => p.id === owner);
    if (player.coins < PROPERTY_TOLL) {
      this._pushLog(`${player.name} can't afford the ${PROPERTY_TOLL}-coin toll at ${type} (owned by ${ownerPlayer.name}) — nothing happens.`);
      return;
    }
    player.coins -= PROPERTY_TOLL;
    ownerPlayer.coins += PROPERTY_TOLL;
    this._pushLog(`${player.name} pays a ${PROPERTY_TOLL}-coin toll to ${ownerPlayer.name} at ${type}.`);
    this._drawAndApplyPropertyCard(player, type);
  }

  _drawAndApplyPropertyCard(player, deckType) {
    const state = this.propertyDecks[deckType];
    if (state.drawPile.length === 0) {
      state.drawPile = shuffleArray(state.discard);
      state.discard = [];
    }
    const card = state.drawPile.pop();
    state.discard.push(card);
    this._applyPropertyCard(player, card);
  }

  // Draw-weighting/reshuffle timing wasn't specified upstream (flagged "FILL IN"
  // in the source content) — shuffle + draw-without-replacement + reshuffle-on-empty,
  // matching the PvP deck convention. "Special reward" and "reward item" effects
  // were also left unspecified upstream; implemented as a flat coin bonus and a
  // no-mechanical-effect inventory entry respectively — see prototype/README.md.
  _applyPropertyCard(player, card) {
    this._pushLog(`${player.name} draws "${card.name}" from the property deck.`);
    if (card.kind === "coinGain") {
      const amount = card.effect.min + Math.floor(Math.random() * (card.effect.max - card.effect.min + 1));
      player.coins += amount;
      this._pushLog(`${player.name} gains ${amount} coins (now ${player.coins}).`);
    } else if (card.kind === "coinLoss") {
      const amount = card.effect.min + Math.floor(Math.random() * (card.effect.max - card.effect.min + 1));
      player.coins = Math.max(0, player.coins - amount);
      this._pushLog(`${player.name} loses ${amount} coins (now ${player.coins}).`);
    } else if (card.kind === "wildcard") {
      if (Math.random() < 0.5) {
        player.coins += card.effect.gain;
        this._pushLog(`${player.name} wins the gamble — gains ${card.effect.gain} coins (now ${player.coins}).`);
      } else {
        player.coins = Math.max(0, player.coins - card.effect.loss);
        this._pushLog(`${player.name} loses the gamble — loses ${card.effect.loss} coins (now ${player.coins}).`);
      }
    } else if (card.kind === "debuffRemoval") {
      player.poisoned = false;
      player.snared = false;
      this._pushLog(`${player.name}'s debuffs are cleared.`);
    } else if (card.kind === "rewardItem") {
      player.items.push(card.name);
      this._pushLog(`${player.name} receives the ${card.name} (no mechanical effect yet — no item system built).`);
    } else if (card.kind === "specialReward") {
      const bonus = 500; // placeholder — upstream source itself left the exact reward-tier rule unfilled
      player.coins += bonus;
      this._pushLog(`${player.name} gets a special reward — +${bonus} coins (placeholder, now ${player.coins}).`);
    }
  }

  // Ally-heal: an allied player adjacent to a poisoned player may cure them
  // instead of (or as well as) initiating PvP. Not specified by the locked
  // design — our own extension, see prototype/README.md.
  canHeal(targetId) {
    const target = this.players.find((p) => p.id === targetId);
    if (!target || !target.poisoned) return false;
    const activeGroup = this.allianceGroupOf(this.current.id);
    return !!activeGroup && activeGroup.members.has(targetId);
  }

  _stepTo(next) {
    const player = this.current;
    this.pendingMove.cameFrom = { r: player.r, c: player.c };
    player.r = next.r;
    player.c = next.c;
    this.pendingMove.stepsRemaining--;
    this.pendingMove.moved++;
    this._applyHazard(player, player.r, player.c); // hazards trigger on pass-through, not just landing
  }

  // After each single tile moved: if steps remain and the move isn't forced,
  // pause on "awaiting-step" so the player can stop exactly where they want
  // (movement revision 2026-08-28). Otherwise keep going / resolve the landing.
  _advanceMovement() {
    const player = this.current;
    while (this.pendingMove.stepsRemaining > 0) {
      const neighbors = this.board.getWalkableNeighbors(player.r, player.c);
      const cameFrom = this.pendingMove.cameFrom;
      let options = neighbors.filter((n) => !(cameFrom && n.r === cameFrom.r && n.c === cameFrom.c));
      if (options.length === 0) options = neighbors; // dead end: forced to reverse

      if (options.length > 1) {
        this.phase = "awaiting-fork";
        this.pendingMove.options = options;
        return; // pause for player choice
      }

      this._stepTo(options[0]);
      if (this.pendingMove.stepsRemaining > 0 && !this.pendingMove.forced) {
        this.phase = "awaiting-step"; // pause: continue or stop
        return;
      }
    }
    this.pendingMove = null;
    this._resolveLanding();
  }

  chooseFork(option) {
    if (this.phase !== "awaiting-fork") throw new Error(`Not awaiting a fork choice (phase ${this.phase})`);
    const valid = this.pendingMove.options.some((o) => o.r === option.r && o.c === option.c);
    if (!valid) throw new Error("Chosen direction is not a valid path from here");
    this.pendingMove.options = null;
    this._stepTo(option);
    if (this.pendingMove.stepsRemaining > 0 && !this.pendingMove.forced) {
      this.phase = "awaiting-step";
      return;
    }
    this.pendingMove = null;
    this._resolveLanding();
  }

  // "awaiting-step": keep moving.
  continueMove() {
    if (this.phase !== "awaiting-step") throw new Error(`Not paused mid-move (phase ${this.phase})`);
    this.phase = "awaiting-roll"; // placeholder so downstream checks don't trip (same trick as chooseFork)
    this._advanceMovement();
  }

  // "awaiting-step": stop here and resolve the landing.
  stopMove() {
    if (this.phase !== "awaiting-step") throw new Error(`Not paused mid-move (phase ${this.phase})`);
    this.pendingMove = null;
    this._resolveLanding();
  }

  // --- Landing / proximity ----------------------------------------------

  _resolveLanding() {
    const player = this.current;
    this._applyLocationEntry(player);
    const nearby = this.players.filter(
      (p) => p.alive && p.id !== player.id && Math.max(Math.abs(p.r - player.r), Math.abs(p.c - player.c)) <= 1
    );
    if (nearby.length === 0) {
      this._pushLog(`${player.name} lands with no one nearby.`);
      this._endTurn();
      return;
    }
    if (this._inGracePeriod(player)) {
      this._pushLog(`${player.name} is within their opening grace period (turn ${player.turnNumber}/2) — no player-targeting action available.`);
      this._endTurn();
      return;
    }
    // Full bidirectional protection: a nearby player still within their own
    // grace window can't be targeted either, not just gated as the initiator.
    const targetable = nearby.filter((p) => !this._inGracePeriod(p));
    if (targetable.length === 0) {
      this._pushLog(`${player.name} lands nearby, but everyone there is still within their own opening grace period.`);
      this._endTurn();
      return;
    }
    this.pendingProximity = { targets: targetable.map((p) => p.id), activeTargetId: targetable[0].id };
    this.phase = targetable.length > 1 ? "awaiting-proximity-target" : "awaiting-proximity-action";
  }

  chooseProximityTarget(targetId) {
    if (this.phase !== "awaiting-proximity-target") throw new Error("Not choosing a proximity target");
    if (!this.pendingProximity.targets.includes(targetId)) throw new Error("Not a valid nearby target");
    this.pendingProximity.activeTargetId = targetId;
    this.phase = "awaiting-proximity-action";
  }

  // action: 'pvp' | 'nothing' | 'alliance' | 'heal'
  chooseProximityAction(action) {
    if (this.phase !== "awaiting-proximity-action") throw new Error(`Not awaiting a proximity action (phase ${this.phase})`);
    const player = this.current;
    const targetId = this.pendingProximity.activeTargetId;
    const target = this.players.find((p) => p.id === targetId);

    if (action === "nothing") {
      this._pushLog(`${player.name} does nothing toward ${target.name}.`);
      this._endTurn();
      return;
    }
    if (action === "heal") {
      if (!this.canHeal(targetId)) throw new Error(`${target.name} cannot be healed right now`);
      target.poisoned = false;
      this._pushLog(`${player.name} heals their ally ${target.name}, curing the poison.`);
      this._endTurn();
      return;
    }
    if (action === "pvp") {
      this._startPvp(player, target);
      return;
    }
    if (action === "alliance") {
      this.pendingAllianceProposal = { fromId: player.id, toId: target.id, context: "proximity" };
      this.phase = "awaiting-alliance-response";
      this._pushLog(`${player.name} proposes an alliance to ${target.name}.`);
      return;
    }
    throw new Error(`Unknown proximity action: ${action}`);
  }

  respondAlliance(accept) {
    if (this.phase !== "awaiting-alliance-response") throw new Error("No alliance proposal is pending");
    const { fromId, toId, context } = this.pendingAllianceProposal;
    const from = this.players.find((p) => p.id === fromId);
    const to = this.players.find((p) => p.id === toId);

    if (!accept) {
      this.pendingAllianceProposal = null;
      this._pushLog(`${to.name} declines the alliance.`);
      this._afterAllianceResolved(from, context);
      return;
    }

    if (this._fitsCap(fromId, toId)) {
      this.pendingAllianceProposal = null;
      this._formAlliance(fromId, toId);
      this._pushLog(`${to.name} accepts! ${from.name} and ${to.name} are now allied.`);
      this._endTurn();
      return;
    }

    // Merging directly would exceed the 3-player cap. Not covered by the locked
    // design: if the responder is already in a (full) alliance, offer them the
    // choice to leave it and join this one instead, rather than just failing.
    const toGroup = this.allianceGroupOf(toId);
    if (toGroup && this._fitsCapAfterLeaving(toId, fromId)) {
      this.phase = "awaiting-leave-or-decline"; // keep pendingAllianceProposal — resolved below
      return;
    }

    this.pendingAllianceProposal = null;
    this._pushLog(`${to.name} wanted to accept, but the alliance would exceed the 3-player cap — it doesn't form.`);
    this._afterAllianceResolved(from, context);
  }

  // Reached only when accepting would exceed the cap and the responder has an
  // existing alliance they could leave to make room.
  leaveAllianceAndJoin() {
    if (this.phase !== "awaiting-leave-or-decline") throw new Error("Not awaiting a leave-or-decline choice");
    const { fromId, toId, context } = this.pendingAllianceProposal;
    const from = this.players.find((p) => p.id === fromId);
    const to = this.players.find((p) => p.id === toId);
    this.pendingAllianceProposal = null;
    this._leaveAlliance(toId);
    this._formAlliance(fromId, toId);
    this._pushLog(`${to.name} leaves their current alliance and joins ${from.name} instead.`);
    this._endTurn();
  }

  declineLeaveAlliance() {
    if (this.phase !== "awaiting-leave-or-decline") throw new Error("Not awaiting a leave-or-decline choice");
    const { fromId, toId, context } = this.pendingAllianceProposal;
    const from = this.players.find((p) => p.id === fromId);
    const to = this.players.find((p) => p.id === toId);
    this.pendingAllianceProposal = null;
    this._pushLog(`${to.name} stays in their current alliance and declines ${from.name}'s proposal.`);
    this._afterAllianceResolved(from, context);
  }

  _afterAllianceResolved(from, context) {
    if (context === "proximity") {
      this._pushLog(`${from.name} may still initiate PvP this turn.`);
      this.phase = "awaiting-proximity-action";
      this.pendingProximity.declinedBy = this.pendingProximity.declinedBy || new Set();
      this.pendingProximity.declinedBy.add(this.pendingProximity.activeTargetId);
    } else {
      this._endTurn();
    }
  }

  _fitsCap(aId, bId) {
    const groupA = this.allianceGroupOf(aId);
    const groupB = this.allianceGroupOf(bId);
    const merged = new Set([...(groupA ? groupA.members : [aId]), ...(groupB ? groupB.members : [bId])]);
    return merged.size <= 3;
  }

  _fitsCapAfterLeaving(leavingId, joinTargetId) {
    const targetGroup = this.allianceGroupOf(joinTargetId);
    const targetSize = targetGroup ? targetGroup.members.size : 1;
    return targetSize + 1 <= 3;
  }

  _leaveAlliance(playerId) {
    const group = this.allianceGroupOf(playerId);
    if (!group) return;
    group.members.delete(playerId);
    this.players.find((p) => p.id === playerId).allianceId = null;
    if (group.members.size === 0) this.alliances.delete(group.id);
  }

  _formAlliance(aId, bId) {
    const groupA = this.allianceGroupOf(aId);
    const groupB = this.allianceGroupOf(bId);
    const merged = new Set([...(groupA ? groupA.members : [aId]), ...(groupB ? groupB.members : [bId])]);
    if (merged.size > 3) throw new Error("Alliance groups are capped at 3 players (Section 14)");

    const keepId = groupA ? groupA.id : groupB ? groupB.id : this.nextAllianceId++;
    if (groupA && groupB && groupA.id !== groupB.id) this.alliances.delete(groupB.id);
    this.alliances.set(keepId, merged);
    for (const pid of merged) this.players.find((p) => p.id === pid).allianceId = keepId;
  }

  // --- PvP -----------------------------------------------------------

  _startPvp(initiator, opponent) {
    this.activeBattle = new PvpBattle({
      initiatorId: initiator.id,
      opponentId: opponent.id,
      initiatorStats: { attack: initiator.attack, defense: initiator.defense },
      opponentStats: { attack: opponent.attack, defense: opponent.defense },
      initiatorCardValues: CLASSES[initiator.className],
      opponentCardValues: CLASSES[opponent.className],
    });
    this.activeBattle.players[initiator.id].hp = initiator.hp;
    this.activeBattle.players[opponent.id].hp = opponent.hp;
    this.phase = "in-pvp";
    this._pushLog(`${initiator.name} initiates PvP against ${opponent.name}!`);
  }

  syncBattleHpToPlayers() {
    if (!this.activeBattle) return;
    for (const p of this.players) {
      const bp = this.activeBattle.players[p.id];
      if (bp) p.hp = bp.hp;
    }
  }

  finishPvpIfOver() {
    if (!this.activeBattle || this.activeBattle.phase !== "finished") return false;
    this.syncBattleHpToPlayers();

    if (this.activeBattle.endedByWithdrawal) {
      const [aId, bId] = [this.activeBattle.attackerId, this.activeBattle.defenderId];
      this._pushLog(`Battle ends in withdrawal — no winner, no elimination.`);
      this.activeBattle = null;
      this.pendingWithdrawalAlliance = { aId, bId };
      this.phase = "awaiting-post-withdrawal-alliance";
      return true;
    }

    const loserId = this.activeBattle.attackerId === this.activeBattle.winnerId
      ? this.activeBattle.defenderId
      : this.activeBattle.attackerId;
    const loser = this.players.find((p) => p.id === loserId);
    loser.alive = false;
    this._pushLog(`${loser.name} is eliminated!`);

    this.activeBattle = null;
    if (this._checkVictory()) return true;
    this._endTurn();
    return true;
  }

  // After an accepted withdrawal, either party may propose an alliance before the turn ends (Section 05).
  proposeAllianceAfterWithdrawal(fromId) {
    if (this.phase !== "awaiting-post-withdrawal-alliance") throw new Error("No post-withdrawal window is open");
    const { aId, bId } = this.pendingWithdrawalAlliance;
    const toId = fromId === aId ? bId : aId;
    this.pendingWithdrawalAlliance = null;
    this.pendingAllianceProposal = { fromId, toId, context: "post-withdrawal" };
    this.phase = "awaiting-alliance-response";
  }

  skipPostWithdrawalAlliance() {
    if (this.phase !== "awaiting-post-withdrawal-alliance") throw new Error("No post-withdrawal window is open");
    this.pendingWithdrawalAlliance = null;
    this._endTurn();
  }

  // --- Victory / turn end ----------------------------------------------

  _checkVictory() {
    const alive = this.alivePlayers();
    if (alive.length === 1) {
      this.winner = { type: "solo", playerIds: [alive[0].id] };
    } else if (alive.length >= 2) {
      const groupIds = new Set(alive.map((p) => p.allianceId));
      if (groupIds.size === 1 && alive[0].allianceId !== null && alive.length <= 2) {
        this.winner = { type: "alliance", playerIds: alive.map((p) => p.id) };
      }
      // If all remaining are one alliance of 3, the design explicitly does NOT
      // force resolution — they must fight each other down to 2 (Section 14).
    }
    if (this.winner) {
      this.phase = "game-over";
      this._pushLog(
        this.winner.type === "solo"
          ? `${this.players.find((p) => p.id === this.winner.playerIds[0]).name} wins!`
          : `${this.winner.playerIds.map((id) => this.players.find((p) => p.id === id).name).join(" & ")} win together!`
      );
      return true;
    }
    return false;
  }

  _endTurn() {
    if (this._checkVictory()) return;
    this.pendingProximity = null;
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    } while (!this.current.alive);
    this.phase = "awaiting-roll";
  }
}
