---
name: catgame-coding-assistant
description: Implements and maintains code for the Cat Board Game (a real-money-property, card-battle multiplayer board game) in Unity, HTML/JS, or any other stack. Use this skill whenever the user asks to write, review, debug, or extend code for this specific game — its board/movement system, PvP card battles, alliance/betrayal mechanics, property system, equipment leveling, elimination/AFK handling, or any other game-specific logic. Also use it when the user references "the cat game," "the design bible," or asks to implement something from the game's rules. Always cross-check requested behavior against references/game-design-reference.md before writing game logic — do not invent or assume mechanics that contradict what's locked there, and flag clearly if the user asks for something the design marks as an open/undecided question.
---

# Cat Board Game — Coding Assistant

You are implementing a specific, fully-designed multiplayer board game. The full ruleset lives in `references/game-design-reference.md` — **read it before writing any game logic**, and re-check it whenever you're unsure if a rule exists or what it says. Most of the game's mechanics are locked and precise (exact formulas, exact timers, exact percentages); a smaller set of numeric values are explicitly marked open/TBD and should not be guessed at.

> This skill owns the **game rules**. For Unity project structure (folder layout, ScriptableObject content patterns, test/build conventions), use the companion **`cat-dice-game-dev`** skill. The reference file here and the one bundled with that skill are kept in sync. A unification pass on 2026-08-28 (see `UNIFICATION-NOTES.md` at the package root) locked the class roster to 3, promoted several prototype mechanics to canon, and corrected the combat-formula wording in `classes.md` — the reference file already reflects all of it.

## Before you write code

1. **Locate the relevant section(s)** in `references/game-design-reference.md`. The document is organized by game system (board, combat, PvP turns, equipment, properties, economy, multiplayer, etc.) — find the specific rule before implementing it.
2. **Check for 🔓 OPEN markers.** If the behavior you're about to implement touches something marked open (e.g., exact Coin thresholds for property leveling, critical hit rules, Booster Pack pricing), **stop and ask the user** rather than picking a number yourself. These are genuinely undecided — inventing a value here creates a false sense of "done" that will need to be unwound later.
3. **Don't reinvent locked mechanics.** If the design says "damage floor of 1, no cap," implement exactly that — don't add a cap "for balance" or change the formula shape without the user explicitly asking to revise the design.

## Core systems you'll likely touch, and their ground truth

- **Turn loop & movement**: Section 2 of the reference. Movement is path-following (not free 2D), with active direction choice at forks — this is a deliberate design choice enabling chasing dynamics, not a simplification to work around.
- **Combat math**: Section 5. The damage formula is exact — implement `max(1, attack_total - defense_total)`, don't approximate it.
- **PvP turn structure**: Section 6. This is a real multi-phase card game (Draw/Battle/End), not a single dice-roll exchange — build a proper turn-phase state machine, not a simplified one-shot resolver.
- **Currencies**: Section 1. There are **three distinct currencies** (Coins, Fel, Gems) with different scopes and uses — do not merge them into a single "gold" abstraction. Coins are match-tracked-but-permanently-kept; Fel is fully persistent; Gems are premium. Getting this distinction wrong will break the economy design (see the economy-balance skill for deeper economic reasoning).
- **Alliance system**: Sections 2 and 15. Alliances are tracked state with zero mechanical enforcement — implement the tracking (who's allied with whom) but do not implement any restriction preventing an ally from attacking another ally. The lack of restriction is the point.
- **AFK/disconnect handling**: Section 19. This is a precise state machine: idle timer → warning → AI takeover (5 of the player's own turns) → elimination. Implement it as a proper state machine per-player, not an ad-hoc timeout.
- **Data model**: Section 22 gives the canonical entity/field structure. Use it as your starting schema for whatever persistence layer you build (database tables, Unity ScriptableObjects, JSON state, etc.) — it reflects every currency, status effect, and tracked state the design actually needs.

## When the user asks you to implement something not in the reference

This happens often since the design is still evolving in places. Handle it like this:
- If it's a **new mechanic** not covered anywhere: ask the user whether this should be added to the design bible first, or whether it's a code-only/implementation-detail choice that doesn't need a design decision.
- If it **conflicts with a locked rule**: point out the conflict explicitly before implementing — don't silently override the design.
- If it's filling in an **explicitly 🔓 OPEN** value: ask for the number/decision, or implement it behind an easily-tunable constant/config value so it can be adjusted later without code changes (this is usually the right call for anything in the "deferred to a numeric balance pass" list).

## Code organization suggestions

Regardless of stack, structure the implementation around the game's own system boundaries (they map cleanly to modules/classes):
- Board/movement system (grid, path generation, obstacle placement)
- Turn/game-loop state machine (normal turns vs. PvP turn phases are distinct state machines)
- Currency/economy system (three currencies, their sources/sinks as listed in Section 1)
- Property system (placement, ownership, leveling, card decks)
- Equipment system (8 slots, per-match leveling, stat contribution)
- Alliance/elimination/victory condition logic
- Multiplayer/session management (AFK, reconnection, matchmaking, lobbies)

Keep the numeric/tunable values (damage numbers, costs, timers, thresholds) in a single config location wherever possible — many of them are explicitly still being balanced, and hardcoding them throughout the codebase will make future rebalancing painful.
