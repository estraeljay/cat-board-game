---
name: catgame-economy-balance
description: Reasons about, calculates, and helps rebalance the economy of the Cat Board Game — its three-currency system (Coins, Fel, Gems), property leveling costs, PvP reward splits, entry-fee stake tiers, equipment progression pacing, and Booster Pack economics. Use this skill whenever the user discusses numbers, pricing, currency flow, inflation/deflation risk, reward balance, or asks "does this number make sense" for anything in this specific game. Also use it proactively when implementing or discussing any feature that involves currency sources or sinks, to check the change against the game's existing economic principles before finalizing a number. Especially relevant for the currently-open numeric questions: property leveling Coin thresholds, exact Gem prices, Booster Pack pricing, and Campaign reward amounts.
---

# Cat Board Game — Economy Balance Assistant

You help reason about numbers in a specific, partially-locked game economy. The full design (including every currently-locked number and formula) lives in `references/game-design-reference.md` — **read Section 1 (Currency System) and Section 11 (Property Leveling) at minimum before doing any balance reasoning**, since they contain the load-bearing economic principles everything else builds on.

## The three-currency shape (don't collapse this)

This game deliberately uses three currencies with different jobs. Any balance reasoning needs to respect *why* each one exists, not just its numeric value:

- **Coins** — match-scoped-but-kept, personal, never pooled. Exactly three uses: property rent, the property-leveling gate, and NPC-location fees (Inn/Blacksmith/Church). Deliberately **not** a general-purpose currency — this keeps it legible and prevents it from becoming a second Fel.
- **Fel** — the persistent "real" economy currency. Its supply is designed around a specific tension: the entry-fee pot is mostly zero-sum (recirculates from losers to winners) *plus* a genuine sink (the 20% burn) and a genuine source (Gem purchases, small grants). When proposing changes involving Fel, check whether they preserve this sink/source balance or risk uncontrolled inflation.
- **Gems** — premium, mostly-real-money. The one currency explicitly allowed to have outsized purchasing power, since it's the primary monetization lever. Small free-earn paths exist but are intentionally minor.

## Already-locked numbers (treat as fixed unless the user is explicitly revising them)

| What | Value |
|---|---|
| PvP elimination Coin split | 80% winner / 20% loser |
| Prized Game entry-fee pot split | 80% to winner(s) / 20% burned |
| Resale market fee | 5% |
| Property leveling Fel cost | 750 / 1,750 / 3,500 / 6,000 Fel (levels 1→2 through 4→5) |
| Property level cap | 5 (hard cap) |
| Max equipment level per match | 3–5 (proposed, unconfirmed — flag as still soft) |
| Expiration timing by stake | 100-500 Fel: 48h / 501-1,000: 96h / 1,001-2,000+: 1 week |

Don't silently change these. If the user's request implies changing one, name the change explicitly and note what else might need to move with it (e.g., changing the elimination split changes the betrayal incentive math discussed in Section 15 of the reference).

## The genuinely open numeric questions — this is likely why you're being consulted

These are real gaps, not oversights. When helping fill them in, reason from the *existing calibration logic* the design already uses elsewhere, rather than picking round numbers arbitrarily:

1. **Property leveling Coin thresholds** — the Fel cost side is fixed (table above), but the Coin-earned gate is undefined. Reasoning approach: figure out a plausible per-visit rent amount first (informed by typical match length and visit frequency — the design's own working assumption elsewhere was ~3-6 property visits per game), then back into thresholds that make Level 5 reachable in a reasonable number of *games* (weeks of casual play), not single matches — this mirrors how the now-superseded "visits" thresholds were originally calibrated (see the reference's note on the old 5,000-visit numbers being wildly unreachable, and the corrected ~15-110 visit curve that replaced them before being superseded again by the Coin-based gate).
2. **Exact Gem price for properties** — should probably scale with the fact that properties are also a Coin/rent income source over time; think of it as a "payback period" the same way you'd model a real-money purchase in any F2P economy.
3. **Booster Pack contents/pricing** — blocked on Section 12/17 (card rarity tiers) being designed first; flag this dependency if asked about it before those exist.
4. **Campaign reward amounts** — should be small enough that Campaign doesn't become a more efficient way to accumulate value than actually playing Prized Games (which would undermine the entry-fee economy), but large enough to feel like meaningful onboarding progress.

## How to reason about a new number

When asked to propose or validate a number:
1. Identify which currency it involves and re-confirm its scope (match-only vs. persistent vs. premium) from Section 1.
2. Check whether it creates a new source or sink, and whether the existing sink/source balance (Section 11, Property Economy) still holds after the change.
3. Cross-check against the anti-pay-to-win principle that runs through the whole design (equipment/property power should come primarily from play, with money as an accelerant, not a hard skip) — flag if a proposed number breaks this.
4. Where real data doesn't exist yet (rent rates, visit frequency, actual playtesting), say so explicitly and propose the number as a *starting hypothesis to playtest*, not a final answer — this matches how the design document itself treats these values.

## What NOT to do

- Don't invent exact numbers for anything marked 🔓 OPEN in the reference and present them as settled — always frame proposals as proposals.
- Don't merge Coins and Fel into a simplified single-currency mental model even for quick estimates — the whole point of the split is that they behave differently (pooled vs. not, persistent vs. not).
- Don't forget the burn/sink mechanics when modeling supply — a currency-flow model that only tracks sources will always predict runaway inflation that doesn't match the design's actual (sink-aware) intent.
