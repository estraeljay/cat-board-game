using System;
using System.Collections.Generic;
using System.Linq;

namespace CatBoardGame.Gameplay
{
    // Direct port of prototype/pvpTurns.js's phase strings ("draw"/"battle"/
    // "end"/"finished"). An enum instead of magic strings — the compiler catches
    // a typo'd phase name at compile time instead of it silently failing a
    // string comparison at runtime like it would in JS.
    public enum BattlePhase
    {
        Draw,
        Battle,
        End,
        Finished
    }

    // JS pushes a differently-shaped plain object per event type into battle.log.
    // C# doesn't have an easy equivalent of "object literal with whatever fields
    // this event needs," so this is one class with every possible field —
    // whichever ones don't apply to a given event just stay at their default
    // (null/0). Fine for a log you read in tests/debug output; if this ever
    // needs richer per-event behavior, one subclass per event type would be the
    // more "correct" C# way to do it.
    public class BattleLogEntry
    {
        public string Event;
        public string PlayerId;
        public string AttackerId;
        public string DefenderId;
        public string AttackCard;
        public string GuardCard;
        public int Damage;
        public int DefenderHpAfter;
    }

    // Direct port of prototype/pvpTurns.js's PvpBattle class. Plain C# class,
    // no MonoBehaviour — this never touches a GameObject or scene, so it's
    // fully testable in EditMode (see Tests/EditMode/PvpBattleTests.cs).
    //
    // Simplification vs. the JS version: the JS constructor accepted a single
    // shared `cardValues` as a fallback when per-player decks weren't given
    // (leftover from early testing before class decks existed). This port
    // always requires each player's own attack/guard cards explicitly — the
    // real game always uses per-class decks (Knight/Mage/Priest), so the
    // fallback path was dead weight worth dropping rather than porting.
    public class PvpBattle
    {
        private static readonly Random Rng = new Random();

        public IReadOnlyDictionary<string, PlayerBattleState> Players => _players;
        private readonly Dictionary<string, PlayerBattleState> _players = new Dictionary<string, PlayerBattleState>();

        public string AttackerId { get; private set; }
        public string DefenderId { get; private set; }
        public BattlePhase Phase { get; private set; } = BattlePhase.Draw;
        public List<BattleLogEntry> Log { get; } = new List<BattleLogEntry>();
        public string WinnerId { get; private set; }
        public bool EndedByWithdrawal { get; private set; }

        public PlayerBattleState Attacker => _players[AttackerId];
        public PlayerBattleState Defender => _players[DefenderId];

        private readonly Dictionary<string, bool> _withdrawalUsed = new Dictionary<string, bool>();
        private (string requesterId, string opponentId)? _pendingWithdrawal;
        private Card _pendingAttackCard;
        private bool _awaitingGuard;

        public PvpBattle(
            string initiatorId, int initiatorAttack, int initiatorDefense,
            IReadOnlyList<CardValueEntry> initiatorAttackCards, IReadOnlyList<CardValueEntry> initiatorGuardCards,
            string opponentId, int opponentAttack, int opponentDefense,
            IReadOnlyList<CardValueEntry> opponentAttackCards, IReadOnlyList<CardValueEntry> opponentGuardCards)
        {
            _players[initiatorId] = MakePlayerState(initiatorId, initiatorAttack, initiatorDefense, initiatorAttackCards, initiatorGuardCards);
            _players[opponentId] = MakePlayerState(opponentId, opponentAttack, opponentDefense, opponentAttackCards, opponentGuardCards);

            AttackerId = initiatorId; // PvP initiator goes first
            DefenderId = opponentId;
            _withdrawalUsed[initiatorId] = false;
            _withdrawalUsed[opponentId] = false;
        }

        private static PlayerBattleState MakePlayerState(string id, int attack, int defense, IReadOnlyList<CardValueEntry> attackCards, IReadOnlyList<CardValueEntry> guardCards)
        {
            var player = new PlayerBattleState(id, attack, defense);
            var deck = Shuffle(BuildDeck(attackCards, guardCards));
            player.Hand.AddRange(deck.Take(5));
            player.Deck.AddRange(deck.Skip(5));
            return player;
        }

        private static List<Card> BuildDeck(IReadOnlyList<CardValueEntry> attackCards, IReadOnlyList<CardValueEntry> guardCards)
        {
            var cards = new List<Card>(attackCards.Count + guardCards.Count);
            for (int i = 0; i < attackCards.Count; i++)
                cards.Add(new Card($"A{i}", CardType.Attack, attackCards[i].Value, attackCards[i].Name));
            for (int i = 0; i < guardCards.Count; i++)
                cards.Add(new Card($"G{i}", CardType.Guard, guardCards[i].Value, guardCards[i].Name));
            return cards;
        }

        // Fisher-Yates, same algorithm as shuffle() in pvpTurns.js. Uses
        // System.Random rather than UnityEngine.Random deliberately — this class
        // has no Unity dependency at all, and System.Random is what makes it
        // possible to unit test with a fixed seed later if a test ever needs a
        // deterministic shuffle (UnityEngine.Random can't be scoped/seeded per
        // instance the same way).
        private static List<Card> Shuffle(List<Card> cards)
        {
            var deck = new List<Card>(cards);
            for (int i = deck.Count - 1; i > 0; i--)
            {
                int j = Rng.Next(i + 1);
                (deck[i], deck[j]) = (deck[j], deck[i]);
            }
            return deck;
        }

        private static void DrawOne(PlayerBattleState player)
        {
            if (player.Deck.Count == 0)
            {
                if (player.Discard.Count == 0) return; // both empty: nothing left to draw
                player.Deck = Shuffle(player.Discard);
                player.Discard = new List<Card>();
            }
            var card = player.Deck[0];
            player.Deck.RemoveAt(0);
            player.Hand.Add(card);
            while (player.Hand.Count > 10)
            {
                var overflow = player.Hand[0];
                player.Hand.RemoveAt(0);
                player.Discard.Add(overflow);
            }
        }

        private static Card RemoveFromHand(PlayerBattleState player, string cardId)
        {
            int idx = player.Hand.FindIndex(c => c.Id == cardId);
            if (idx == -1) throw new InvalidOperationException($"Card {cardId} not in {player.Id}'s hand");
            var card = player.Hand[idx];
            player.Hand.RemoveAt(idx);
            player.Discard.Add(card);
            return card;
        }

        private void AssertActive()
        {
            if (Phase == BattlePhase.Finished) throw new InvalidOperationException("Battle is already finished");
        }

        public void DrawPhase()
        {
            AssertActive();
            if (Phase != BattlePhase.Draw) throw new InvalidOperationException($"Expected draw phase, got {Phase}");
            DrawOne(Attacker);
            Log.Add(new BattleLogEntry { Event = "draw", PlayerId = AttackerId });
            Phase = BattlePhase.Battle;
        }

        // Not covered explicitly by the locked design, but a player can hold zero
        // attack cards (e.g. a guard-heavy hand) — the turn just passes, mirroring
        // the normal-turn auto-skip-on-timeout used elsewhere in the design.
        public void PassAttackNoCard()
        {
            AssertActive();
            if (Phase != BattlePhase.Battle) throw new InvalidOperationException($"Expected battle phase, got {Phase}");
            if (Attacker.Hand.Any(c => c.Type == CardType.Attack))
                throw new InvalidOperationException($"{AttackerId} has an attack card in hand — must play it, not pass");
            Log.Add(new BattleLogEntry { Event = "attack-passed-no-card", PlayerId = AttackerId });
            Phase = BattlePhase.End;
        }

        public Card PlayAttack(string cardId)
        {
            AssertActive();
            if (Phase != BattlePhase.Battle) throw new InvalidOperationException($"Expected battle phase, got {Phase}");
            var card = Attacker.Hand.FirstOrDefault(c => c.Id == cardId);
            if (card == null || card.Type != CardType.Attack) throw new InvalidOperationException($"{cardId} is not an attack card in hand");
            _pendingAttackCard = RemoveFromHand(Attacker, cardId);
            _awaitingGuard = true;
            return _pendingAttackCard;
        }

        // cardId == null means "defender chooses not to guard" — same convention
        // as the JS respondGuard(null) call in the no-guard path.
        public void RespondGuard(string cardId)
        {
            AssertActive();
            if (!_awaitingGuard) throw new InvalidOperationException("No pending attack to respond to");

            Card guardCard = null;
            if (cardId != null)
            {
                var found = Defender.Hand.FirstOrDefault(c => c.Id == cardId);
                if (found == null || found.Type != CardType.Guard) throw new InvalidOperationException($"{cardId} is not a guard card in hand");
                guardCard = RemoveFromHand(Defender, cardId);
            }

            int damage = CombatResolver.ComputeDamage(
                Attacker.Attack,
                _pendingAttackCard.Value,
                Defender.Defense,
                guardCard?.Value ?? 0);
            Defender.Hp = Math.Max(0, Defender.Hp - damage);

            Log.Add(new BattleLogEntry
            {
                Event = "attack-resolved",
                AttackerId = AttackerId,
                DefenderId = DefenderId,
                AttackCard = _pendingAttackCard.Id,
                GuardCard = guardCard?.Id,
                Damage = damage,
                DefenderHpAfter = Defender.Hp,
            });

            _pendingAttackCard = null;
            _awaitingGuard = false;
            Phase = BattlePhase.End;

            if (Defender.Hp <= 0)
            {
                WinnerId = AttackerId;
                Phase = BattlePhase.Finished;
            }
        }

        public void EndPhase()
        {
            AssertActive();
            if (Phase != BattlePhase.End) throw new InvalidOperationException($"Expected end phase, got {Phase}");
            (AttackerId, DefenderId) = (DefenderId, AttackerId); // roles alternate
            Phase = BattlePhase.Draw;
        }

        // Either player may request withdrawal at any point mid-battle; one
        // attempt per battle, per player.
        public void RequestWithdrawal(string playerId)
        {
            AssertActive();
            if (_withdrawalUsed[playerId]) throw new InvalidOperationException($"{playerId} already used their withdrawal attempt");
            _withdrawalUsed[playerId] = true;
            string opponentId = playerId == AttackerId ? DefenderId : AttackerId;
            _pendingWithdrawal = (playerId, opponentId);
            Log.Add(new BattleLogEntry { Event = "withdrawal-requested", PlayerId = playerId });
        }

        public void RespondWithdrawal(bool accept)
        {
            AssertActive();
            if (_pendingWithdrawal == null) throw new InvalidOperationException("No pending withdrawal request");
            if (accept)
            {
                Phase = BattlePhase.Finished;
                EndedByWithdrawal = true;
                WinnerId = null; // no winner/elimination/transfer
                Log.Add(new BattleLogEntry { Event = "withdrawal-accepted" });
            }
            else
            {
                Log.Add(new BattleLogEntry { Event = "withdrawal-denied" });
            }
            _pendingWithdrawal = null;
        }
    }
}
