using System.Collections.Generic;

namespace CatBoardGame.Gameplay
{
    // Per-player state for the duration of one PvpBattle: hp/stats plus the
    // three card piles. Mutable fields (not { get; set; } properties) are fine
    // here since this class is purely internal battle bookkeeping, never exposed
    // to the Inspector — no reason for the extra property ceremony.
    public class PlayerBattleState
    {
        public string Id { get; }
        public int Hp;
        public int Attack;
        public int Defense;
        public List<Card> Deck = new List<Card>();
        public List<Card> Hand = new List<Card>();
        public List<Card> Discard = new List<Card>();

        public PlayerBattleState(string id, int attack, int defense)
        {
            Id = id;
            Hp = CombatResolver.BaseHp;
            Attack = attack;
            Defense = defense;
        }
    }
}
