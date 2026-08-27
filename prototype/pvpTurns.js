// Cat Board Game — PvP turn-phase state machine (design bible Section 05, 10/12 resolved)
//
// Exact card face values are content/asset work (deferred, not part of the locked
// design) — this module takes them as input so real values can be plugged in later
// without touching the state machine. Turn timers (20s/30s) are a session/UI concern
// layered on top of this state machine, not implemented here.

import { BASE_HP, computeDamage } from "./combat.js";

// Entries may be a plain number or { value, name } — name is optional (falls
// back to "Attack N"/"Guard N") so callers without named card content still work.
function buildDeck(attackValues, guardValues) {
  const cards = [];
  attackValues.forEach((entry, i) => {
    const value = typeof entry === "object" ? entry.value : entry;
    const name = typeof entry === "object" && entry.name ? entry.name : `Attack ${value}`;
    cards.push({ id: `A${i}`, type: "attack", value, name });
  });
  guardValues.forEach((entry, i) => {
    const value = typeof entry === "object" ? entry.value : entry;
    const name = typeof entry === "object" && entry.name ? entry.name : `Guard ${value}`;
    cards.push({ id: `G${i}`, type: "guard", value, name });
  });
  return cards;
}

function shuffle(cards) {
  const deck = cards.slice();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function makePlayerState(id, stats, cardValues) {
  const deck = shuffle(buildDeck(cardValues.attack, cardValues.guard));
  const hand = deck.splice(0, 5);
  return {
    id,
    hp: BASE_HP,
    attack: stats.attack,
    defense: stats.defense,
    deck,
    hand,
    discard: [],
  };
}

function drawOne(player) {
  if (player.deck.length === 0) {
    if (player.discard.length === 0) return; // both empty: nothing left to draw
    player.deck = shuffle(player.discard);
    player.discard = [];
  }
  const card = player.deck.shift();
  player.hand.push(card);
  while (player.hand.length > 10) {
    player.discard.push(player.hand.shift());
  }
}

function removeFromHand(player, cardId) {
  const idx = player.hand.findIndex((c) => c.id === cardId);
  if (idx === -1) throw new Error(`Card ${cardId} not in ${player.id}'s hand`);
  const [card] = player.hand.splice(idx, 1);
  player.discard.push(card);
  return card;
}

export class PvpBattle {
  // cardValues: shared deck for both players (back-compat). Or pass
  // initiatorCardValues/opponentCardValues separately when each player has
  // their own class deck (Knight/Mage/Priest, ...).
  constructor({ initiatorId, opponentId, initiatorStats, opponentStats, cardValues, initiatorCardValues, opponentCardValues }) {
    this.players = {
      [initiatorId]: makePlayerState(initiatorId, initiatorStats, initiatorCardValues || cardValues),
      [opponentId]: makePlayerState(opponentId, opponentStats, opponentCardValues || cardValues),
    };
    this.attackerId = initiatorId; // PvP initiator goes first
    this.defenderId = opponentId;
    this.phase = "draw";
    this.withdrawalUsed = { [initiatorId]: false, [opponentId]: false };
    this.pendingWithdrawal = null;
    this.log = [];
    this.winnerId = null;
    this.endedByWithdrawal = false;
  }

  get attacker() {
    return this.players[this.attackerId];
  }

  get defender() {
    return this.players[this.defenderId];
  }

  _assertActive() {
    if (this.phase === "finished") throw new Error("Battle is already finished");
  }

  drawPhase() {
    this._assertActive();
    if (this.phase !== "draw") throw new Error(`Expected draw phase, got ${this.phase}`);
    drawOne(this.attacker);
    this.log.push({ event: "draw", playerId: this.attackerId });
    this.phase = "battle";
  }

  // Not covered explicitly by the locked design, but a player can legitimately hold zero
  // attack cards (e.g. a guard-heavy opening hand) — the turn just passes with no attack,
  // mirroring the normal-turn auto-skip-on-timeout semantics used elsewhere in the design.
  passAttackNoCard() {
    this._assertActive();
    if (this.phase !== "battle") throw new Error(`Expected battle phase, got ${this.phase}`);
    if (this.attacker.hand.some((c) => c.type === "attack")) {
      throw new Error(`${this.attackerId} has an attack card in hand — must play it, not pass`);
    }
    this.log.push({ event: "attack-passed-no-card", playerId: this.attackerId });
    this.phase = "end";
  }

  playAttack(cardId) {
    this._assertActive();
    if (this.phase !== "battle") throw new Error(`Expected battle phase, got ${this.phase}`);
    const attacker = this.attacker;
    const card = attacker.hand.find((c) => c.id === cardId);
    if (!card || card.type !== "attack") throw new Error(`${cardId} is not an attack card in hand`);
    this._pendingAttackCard = removeFromHand(attacker, cardId);
    this._awaitingGuard = true;
    return this._pendingAttackCard;
  }

  respondGuard(cardId) {
    this._assertActive();
    if (!this._awaitingGuard) throw new Error("No pending attack to respond to");
    const defender = this.defender;
    let guardCard = null;
    if (cardId != null) {
      const found = defender.hand.find((c) => c.id === cardId);
      if (!found || found.type !== "guard") throw new Error(`${cardId} is not a guard card in hand`);
      guardCard = removeFromHand(defender, cardId);
    }

    const damage = computeDamage(
      this.attacker.attack,
      this._pendingAttackCard.value,
      this.defender.defense,
      guardCard ? guardCard.value : 0
    );
    defender.hp = Math.max(0, defender.hp - damage);

    this.log.push({
      event: "attack-resolved",
      attackerId: this.attackerId,
      defenderId: this.defenderId,
      attackCard: this._pendingAttackCard.id,
      guardCard: guardCard ? guardCard.id : null,
      damage,
      defenderHpAfter: defender.hp,
    });

    this._pendingAttackCard = null;
    this._awaitingGuard = false;
    this.phase = "end";

    if (defender.hp <= 0) {
      this.winnerId = this.attackerId;
      this.phase = "finished";
    }
  }

  endPhase() {
    this._assertActive();
    if (this.phase !== "end") throw new Error(`Expected end phase, got ${this.phase}`);
    [this.attackerId, this.defenderId] = [this.defenderId, this.attackerId]; // roles alternate
    this.phase = "draw";
  }

  // Either player may request withdrawal at any point mid-battle; one attempt per battle, per player.
  requestWithdrawal(playerId) {
    this._assertActive();
    if (this.withdrawalUsed[playerId]) throw new Error(`${playerId} already used their withdrawal attempt`);
    this.withdrawalUsed[playerId] = true;
    const opponentId = playerId === this.attackerId ? this.defenderId : this.attackerId;
    this.pendingWithdrawal = { requesterId: playerId, opponentId };
    this.log.push({ event: "withdrawal-requested", playerId });
  }

  respondWithdrawal(accept) {
    this._assertActive();
    if (!this.pendingWithdrawal) throw new Error("No pending withdrawal request");
    if (accept) {
      this.phase = "finished";
      this.endedByWithdrawal = true;
      this.winnerId = null; // no winner/elimination/transfer
      this.log.push({ event: "withdrawal-accepted" });
    } else {
      this.log.push({ event: "withdrawal-denied" });
    }
    this.pendingWithdrawal = null;
  }
}
