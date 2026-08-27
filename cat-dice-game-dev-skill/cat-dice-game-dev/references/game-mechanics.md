# Property Card Decks — Source of Truth

Scope of this file: the **NPC and player-owned property card decks**, plus the flat toll
rule. For the rest of the game's rules — turn loop, movement (a single d6 along the path
network), board structure, PvP combat, economy, equipment, multiplayer — see
`game-design-reference.md`, which is authoritative.

> This file was formerly `game-mechanics.md` for a dice-roll game concept that is no longer
> in scope. Everything below is the board game. If you're looking for dice/roll/scoring
> rules: there aren't any beyond "roll one d6, move that many tiles" — see Section 2 of the
> reference.

The four decks below (Fountain + Yarn Emporium + Fish Market + Catnip Garden) are the
**first-art-pass / playtest stand-in property set** — skins on the generic player-placed
property system (reference Section 10), not a fixed-property redesign. Fountain is otherwise
a Campaign-only NPC location. The live copy of this data is `prototype/content.js`.

## NPC Properties

Board tiles with an NPC that trigger an effect when a player's piece lands/steps on them.
Each NPC Property has its own themed deck of Property Cards; landing on the tile draws one
card at random from that deck and applies its effect immediately.

### Fountain

Draws one card from a 20-card deck on landing. 3 named/special cards, 17 coin-effect cards.

| # | Card | Type | Effect |
|---|------|------|--------|
| 1 | Gift of the Fountain | Special reward | Grants a bonus reward-tier card `<!-- FILL IN: exact rule — draw again from a specific pool? -->` |
| 2 | Fountain Blessing | Debuff removal | Removes all active debuff stats from the player |
| 3 | Mystical Headdress | Reward item | Grants the Mystical Headdress item `<!-- FILL IN: stat/cosmetic effect -->` |
| 4 | Coin Toss Fortune | Coin gain | +100–400 coins |
| 5 | Lucky Splash | Coin gain | +50–150 coins |
| 6 | Wishing Well Windfall | Coin gain | +300–700 coins |
| 7 | Nine Lives' Luck | Coin gain | +200–600 coins |
| 8 | Merchant's Blessing | Coin gain | +400–900 coins |
| 9 | Glimmering Ripple | Coin gain | +150–350 coins |
| 10 | Fountain's Favor | Coin gain | +500–1000 coins |
| 11 | Silver Whisker Find | Coin gain | +100–500 coins |
| 12 | Copper Rain | Coin gain | +100–200 coins |
| 13 | Slippery Ledge | Coin loss | −50–150 coins |
| 14 | Greedy Koi | Coin loss | −100–250 coins |
| 15 | Rusty Coin Curse | Coin loss | −150–300 coins |
| 16 | Overflow Tax | Coin loss | −100–200 coins |
| 17 | Wishing Fee | Coin loss | −50–100 coins |
| 18 | Soggy Wallet | Coin loss | −200–300 coins |
| 19 | Stray Cat Toll | Coin loss | −100–300 coins |
| 20 | Fountain's Gamble | Wildcard | 50/50 — either +500 coins or −300 coins |

Deck composition: 9 coin-gain, 7 coin-loss, 1 wildcard, 1 debuff-removal, 2 reward-tier.
`<!-- FILL IN: draw weighting — uniform random across all 20, or weighted toward common
coin cards with the 3 special cards rarer? Also confirm whether the deck reshuffles after
each draw or depletes like a real deck. -->`

## Player-Owned Properties

Unlike the neutral NPC Properties above, these tiles can be owned by a player. Landing on
one draws a card from that property's 20-card deck, using the same structure as Fountain
(3 special/named + 9 coin-gain + 7 coin-loss + 1 wildcard) so the underlying `PropertyCard`
system can be shared across every property tile in the game, owned or not.

**Toll rule (confirmed):** when a player who does *not* own the property lands on it, they
pay a flat **100 coin toll to the property's owner** — this stays flat forever, it does not
scale with property level. The toll must be paid *before* the card draw — resolve the toll
first, then draw. If the player can't afford the 100 coin toll, nothing happens: no partial
payment, no coins change hands, and no card is drawn — the property visit is simply a
no-op. Landing on a property you own yourself only triggers the card draw, no toll.

**Leveling (confirmed scope):** leveling up a property does not change the toll and does
not modify the base 20 cards — it unlocks additional special-effect cards that get added
into that property's deck. The base 20 documented below stay exactly as they are at every
level; leveling only grows the deck. The actual level-up unlock cards themselves are a
planned future addition — not designed yet, intentionally left out below.

### Yarn Emporium

| # | Card | Type | Effect |
|---|------|------|--------|
| 1 | Emporium's Gift | Special reward | Grants a bonus reward-tier card |
| 2 | Cozy Wind-Down | Debuff removal | Removes all active debuffs |
| 3 | Knitted Charm | Reward item | Grants the Knitted Charm item |
| 4 | Spool of Fortune | Coin gain | +100–300 coins |
| 5 | Ball of Luck | Coin gain | +50–150 coins |
| 6 | Tangle of Treasure | Coin gain | +200–500 coins |
| 7 | Weaver's Windfall | Coin gain | +300–600 coins |
| 8 | Sale Rack Score | Coin gain | +100–250 coins |
| 9 | Cat's Favorite Toy | Coin gain | +150–350 coins |
| 10 | Grand Opening Bonus | Coin gain | +400–700 coins |
| 11 | Loose Thread Find | Coin gain | +50–200 coins |
| 12 | Discount Basket | Coin gain | +100–200 coins |
| 13 | Snagged Sweater | Coin loss | −50–150 coins |
| 14 | Overpriced Yarn | Coin loss | −100–250 coins |
| 15 | Moth-Eaten Stock | Coin loss | −150–300 coins |
| 16 | Register Mishap | Coin loss | −100–200 coins |
| 17 | Tangled Mess | Coin loss | −50–100 coins |
| 18 | Refund Denied | Coin loss | −150–250 coins |
| 19 | Shoplifting Cat | Coin loss | −100–300 coins |
| 20 | Emporium Clearance | Wildcard | 50/50 — either +400 or −250 coins |

### Fish Market

| # | Card | Type | Effect |
|---|------|------|--------|
| 1 | Market's Bounty | Special reward | Grants a bonus reward-tier card |
| 2 | Fresh Catch Blessing | Debuff removal | Removes all active debuffs |
| 3 | Pearl-Studded Collar | Reward item | Grants the Pearl-Studded Collar item |
| 4 | Morning Catch | Coin gain | +100–400 coins |
| 5 | Bargain Bin Find | Coin gain | +50–150 coins |
| 6 | Tuna Jackpot | Coin gain | +300–700 coins |
| 7 | Fisherman's Tip | Coin gain | +150–350 coins |
| 8 | Net Full of Coins | Coin gain | +400–800 coins |
| 9 | Lucky Bait | Coin gain | +100–300 coins |
| 10 | Market Day Surge | Coin gain | +500–900 coins |
| 11 | Salty Bonus | Coin gain | +100–250 coins |
| 12 | Crab Trap Treasure | Coin gain | +150–400 coins |
| 13 | Spoiled Catch | Coin loss | −100–250 coins |
| 14 | Fish Thief | Coin loss | −150–300 coins |
| 15 | Slippery Deck | Coin loss | −50–150 coins |
| 16 | Overfishing Fine | Coin loss | −200–300 coins |
| 17 | Broken Net | Coin loss | −100–200 coins |
| 18 | Seagull Raid | Coin loss | −50–100 coins |
| 19 | Market Tax | Coin loss | −100–300 coins |
| 20 | Market Gamble | Wildcard | 50/50 — either +600 or −300 coins |

### Catnip Garden

| # | Card | Type | Effect |
|---|------|------|--------|
| 1 | Garden's Gift | Special reward | Grants a bonus reward-tier card |
| 2 | Herbal Cleanse | Debuff removal | Removes all active debuffs |
| 3 | Crown of Petals | Reward item | Grants the Crown of Petals item |
| 4 | Blooming Fortune | Coin gain | +100–300 coins |
| 5 | Sunny Patch Find | Coin gain | +50–150 coins |
| 6 | Garden Harvest | Coin gain | +200–500 coins |
| 7 | Buzzing Bee's Blessing | Coin gain | +150–350 coins |
| 8 | Hidden Coin Bed | Coin gain | +300–600 coins |
| 9 | Fragrant Windfall | Coin gain | +100–250 coins |
| 10 | Overgrown Treasure | Coin gain | +400–700 coins |
| 11 | Petal Shower | Coin gain | +50–200 coins |
| 12 | Green Thumb Bonus | Coin gain | +100–300 coins |
| 13 | Wilted Patch | Coin loss | −50–150 coins |
| 14 | Garden Pest | Coin loss | −100–250 coins |
| 15 | Trampled Blooms | Coin loss | −150–300 coins |
| 16 | Weed Whacker Fee | Coin loss | −100–200 coins |
| 17 | Thorny Mishap | Coin loss | −50–100 coins |
| 18 | Stray Cat Digging | Coin loss | −100–200 coins |
| 19 | Overwatered Loss | Coin loss | −150–300 coins |
| 20 | Garden's Gamble | Wildcard | 50/50 — either +500 or −300 coins |

## RNG & reproducibility

- Use a seeded RNG so bugs are reproducible: `System.Random` with a stored/loggable seed,
  or `Random.InitState()` if sticking with UnityEngine.Random.
- Log the seed alongside any bug report or crash log involving a die roll, a card draw,
  procedural board/path generation, or a scripted random playthrough. The JS prototype
  already leans on this (100+ scripted random playthroughs, 150+ board regenerations).
