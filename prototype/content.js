// Cat Board Game — Class decks & property card decks
// Source: cat-dice-game-dev.skill (references/classes.md, references/game-mechanics.md),
// per the user's direction that this file is authoritative for class/card content.
//
// Combat formula stays the locked one from MASTER-DATA-SHEET.md / combat.js
// (max(1, attackStat + cardValue - defenseStat - guardValue)) — the source
// file's own "card power only, floor 0" formula was NOT adopted; only the
// per-card power values and names were pulled in, used as the card
// bonus/block terms in the existing formula. See prototype/README.md.

export const CLASSES = {
  knight: {
    label: "Knight",
    attack: [
      { value: 1, name: "Practice Swing" },
      { value: 2, name: "Shield Bash" },
      { value: 3, name: "Quick Slash" },
      { value: 4, name: "Lance Charge" },
      { value: 5, name: "Parry Riposte" },
      { value: 6, name: "Iron Cleave" },
      { value: 7, name: "Valorous Strike" },
      { value: 8, name: "Oathbreaker's Edge" },
      { value: 9, name: "Champion's Onslaught" },
      { value: 10, name: "Dragonfang Cleave" },
    ],
    guard: [
      { value: 1, name: "Raised Fists" },
      { value: 2, name: "Wooden Buckler" },
      { value: 3, name: "Steel Brace" },
      { value: 4, name: "Shield Wall" },
      { value: 5, name: "Plate Guard" },
      { value: 6, name: "Tower Shield Stance" },
      { value: 7, name: "Knight's Resolve" },
      { value: 8, name: "Unbreakable Bulwark" },
      { value: 9, name: "Aegis of Valor" },
      { value: 10, name: "Fortress Stance" },
    ],
  },
  mage: {
    label: "Mage",
    attack: [
      { value: 1, name: "Spark" },
      { value: 2, name: "Arcane Dart" },
      { value: 3, name: "Frost Bolt" },
      { value: 4, name: "Ember Burst" },
      { value: 5, name: "Lightning Jab" },
      { value: 6, name: "Void Lance" },
      { value: 7, name: "Chain Lightning" },
      { value: 8, name: "Inferno Blast" },
      { value: 9, name: "Arcane Cataclysm" },
      { value: 10, name: "Meteor Sigil" },
    ],
    guard: [
      { value: 1, name: "Mana Veil" },
      { value: 2, name: "Ward Glyph" },
      { value: 3, name: "Frost Barrier" },
      { value: 4, name: "Arcane Shield" },
      { value: 5, name: "Mirror Ward" },
      { value: 6, name: "Elemental Aegis" },
      { value: 7, name: "Runic Bulwark" },
      { value: 8, name: "Spellward Bastion" },
      { value: 9, name: "Arcane Sanctuary" },
      { value: 10, name: "Absolute Barrier" },
    ],
  },
  priest: {
    label: "Priest",
    attack: [
      { value: 1, name: "Minor Smite" },
      { value: 2, name: "Holy Spark" },
      { value: 3, name: "Radiant Jab" },
      { value: 4, name: "Sacred Flame" },
      { value: 5, name: "Purging Light" },
      { value: 6, name: "Wrath of Dawn" },
      { value: 7, name: "Divine Judgment" },
      { value: 8, name: "Zealous Strike" },
      { value: 9, name: "Righteous Fury" },
      { value: 10, name: "Seraphic Smite" },
    ],
    guard: [
      { value: 1, name: "Faint Blessing" },
      { value: 2, name: "Prayer Shield" },
      { value: 3, name: "Holy Ward" },
      { value: 4, name: "Sanctified Barrier" },
      { value: 5, name: "Guardian Light" },
      { value: 6, name: "Divine Aegis" },
      { value: 7, name: "Miracle Shield" },
      { value: 8, name: "Halo of Protection" },
      { value: 9, name: "Celestial Bulwark" },
      { value: 10, name: "Sanctuary of the Faithful" },
    ],
  },
};

// Shared shape for every property-style deck (Fountain + the 3 player-owned
// properties): 3 special/named cards, 9 coin-gain, 7 coin-loss, 1 wildcard.
// Draw weighting/reshuffle-on-empty wasn't specified upstream (flagged
// "FILL IN" in the source) — implemented as shuffle + draw-without-replacement
// + reshuffle-when-empty, matching the already-locked PvP deck convention.
function deck(entries) {
  return entries.map(([name, kind, effect]) => ({ name, kind, effect }));
}

export const PROPERTY_DECKS = {
  fountain: deck([
    ["Gift of the Fountain", "specialReward", {}],
    ["Fountain Blessing", "debuffRemoval", {}],
    ["Mystical Headdress", "rewardItem", {}],
    ["Coin Toss Fortune", "coinGain", { min: 100, max: 400 }],
    ["Lucky Splash", "coinGain", { min: 50, max: 150 }],
    ["Wishing Well Windfall", "coinGain", { min: 300, max: 700 }],
    ["Nine Lives' Luck", "coinGain", { min: 200, max: 600 }],
    ["Merchant's Blessing", "coinGain", { min: 400, max: 900 }],
    ["Glimmering Ripple", "coinGain", { min: 150, max: 350 }],
    ["Fountain's Favor", "coinGain", { min: 500, max: 1000 }],
    ["Silver Whisker Find", "coinGain", { min: 100, max: 500 }],
    ["Copper Rain", "coinGain", { min: 100, max: 200 }],
    ["Slippery Ledge", "coinLoss", { min: 50, max: 150 }],
    ["Greedy Koi", "coinLoss", { min: 100, max: 250 }],
    ["Rusty Coin Curse", "coinLoss", { min: 150, max: 300 }],
    ["Overflow Tax", "coinLoss", { min: 100, max: 200 }],
    ["Wishing Fee", "coinLoss", { min: 50, max: 100 }],
    ["Soggy Wallet", "coinLoss", { min: 200, max: 300 }],
    ["Stray Cat Toll", "coinLoss", { min: 100, max: 300 }],
    ["Fountain's Gamble", "wildcard", { gain: 500, loss: 300 }],
  ]),
  yarnEmporium: deck([
    ["Emporium's Gift", "specialReward", {}],
    ["Cozy Wind-Down", "debuffRemoval", {}],
    ["Knitted Charm", "rewardItem", {}],
    ["Spool of Fortune", "coinGain", { min: 100, max: 300 }],
    ["Ball of Luck", "coinGain", { min: 50, max: 150 }],
    ["Tangle of Treasure", "coinGain", { min: 200, max: 500 }],
    ["Weaver's Windfall", "coinGain", { min: 300, max: 600 }],
    ["Sale Rack Score", "coinGain", { min: 100, max: 250 }],
    ["Cat's Favorite Toy", "coinGain", { min: 150, max: 350 }],
    ["Grand Opening Bonus", "coinGain", { min: 400, max: 700 }],
    ["Loose Thread Find", "coinGain", { min: 50, max: 200 }],
    ["Discount Basket", "coinGain", { min: 100, max: 200 }],
    ["Snagged Sweater", "coinLoss", { min: 50, max: 150 }],
    ["Overpriced Yarn", "coinLoss", { min: 100, max: 250 }],
    ["Moth-Eaten Stock", "coinLoss", { min: 150, max: 300 }],
    ["Register Mishap", "coinLoss", { min: 100, max: 200 }],
    ["Tangled Mess", "coinLoss", { min: 50, max: 100 }],
    ["Refund Denied", "coinLoss", { min: 150, max: 250 }],
    ["Shoplifting Cat", "coinLoss", { min: 100, max: 300 }],
    ["Emporium Clearance", "wildcard", { gain: 400, loss: 250 }],
  ]),
  fishMarket: deck([
    ["Market's Bounty", "specialReward", {}],
    ["Fresh Catch Blessing", "debuffRemoval", {}],
    ["Pearl-Studded Collar", "rewardItem", {}],
    ["Morning Catch", "coinGain", { min: 100, max: 400 }],
    ["Bargain Bin Find", "coinGain", { min: 50, max: 150 }],
    ["Tuna Jackpot", "coinGain", { min: 300, max: 700 }],
    ["Fisherman's Tip", "coinGain", { min: 150, max: 350 }],
    ["Net Full of Coins", "coinGain", { min: 400, max: 800 }],
    ["Lucky Bait", "coinGain", { min: 100, max: 300 }],
    ["Market Day Surge", "coinGain", { min: 500, max: 900 }],
    ["Salty Bonus", "coinGain", { min: 100, max: 250 }],
    ["Crab Trap Treasure", "coinGain", { min: 150, max: 400 }],
    ["Spoiled Catch", "coinLoss", { min: 100, max: 250 }],
    ["Fish Thief", "coinLoss", { min: 150, max: 300 }],
    ["Slippery Deck", "coinLoss", { min: 50, max: 150 }],
    ["Overfishing Fine", "coinLoss", { min: 200, max: 300 }],
    ["Broken Net", "coinLoss", { min: 100, max: 200 }],
    ["Seagull Raid", "coinLoss", { min: 50, max: 100 }],
    ["Market Tax", "coinLoss", { min: 100, max: 300 }],
    ["Market Gamble", "wildcard", { gain: 600, loss: 300 }],
  ]),
  catnipGarden: deck([
    ["Garden's Gift", "specialReward", {}],
    ["Herbal Cleanse", "debuffRemoval", {}],
    ["Crown of Petals", "rewardItem", {}],
    ["Blooming Fortune", "coinGain", { min: 100, max: 300 }],
    ["Sunny Patch Find", "coinGain", { min: 50, max: 150 }],
    ["Garden Harvest", "coinGain", { min: 200, max: 500 }],
    ["Buzzing Bee's Blessing", "coinGain", { min: 150, max: 350 }],
    ["Hidden Coin Bed", "coinGain", { min: 300, max: 600 }],
    ["Fragrant Windfall", "coinGain", { min: 100, max: 250 }],
    ["Overgrown Treasure", "coinGain", { min: 400, max: 700 }],
    ["Petal Shower", "coinGain", { min: 50, max: 200 }],
    ["Green Thumb Bonus", "coinGain", { min: 100, max: 300 }],
    ["Wilted Patch", "coinLoss", { min: 50, max: 150 }],
    ["Garden Pest", "coinLoss", { min: 100, max: 250 }],
    ["Trampled Blooms", "coinLoss", { min: 150, max: 300 }],
    ["Weed Whacker Fee", "coinLoss", { min: 100, max: 200 }],
    ["Thorny Mishap", "coinLoss", { min: 50, max: 100 }],
    ["Stray Cat Digging", "coinLoss", { min: 100, max: 200 }],
    ["Overwatered Loss", "coinLoss", { min: 150, max: 300 }],
    ["Garden's Gamble", "wildcard", { gain: 500, loss: 300 }],
  ]),
};

export const PROPERTY_TOLL = 100; // flat, confirmed — never scales with level
export const STARTING_COINS = 500; // not specified anywhere — arbitrary placeholder, easy to retune
