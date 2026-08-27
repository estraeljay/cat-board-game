using System.Linq;
using NUnit.Framework;
using CatBoardGame.Gameplay;

// Mirrors prototype/demo.html's sanity checks and simulated-battle loop —
// same inputs, same expected outputs, now as real assertions instead of a
// browser page you had to eyeball.
public class PvpBattleTests
{
    [Test]
    public void ComputeDamage_MatchesLockedFormula()
    {
        // demo.html: "Sanity check computeDamage(20,10,8,3) = ... (expect 19)"
        Assert.AreEqual(19, CombatResolver.ComputeDamage(20, 10, 8, 3));
    }

    [Test]
    public void ComputeDamage_FloorsAtOne()
    {
        // demo.html: "Sanity check floor: computeDamage(5,0,50,10) = ... (expect 1)"
        Assert.AreEqual(1, CombatResolver.ComputeDamage(5, 0, 50, 10));
    }

    [Test]
    public void SimulatedBattle_EndsWithAWinnerWithin200Rounds()
    {
        var attackCards = new[]
        {
            new CardValueEntry(8, "Attack 8"), new CardValueEntry(8, "Attack 8"),
            new CardValueEntry(9, "Attack 9"), new CardValueEntry(9, "Attack 9"),
            new CardValueEntry(10, "Attack 10"), new CardValueEntry(10, "Attack 10"),
            new CardValueEntry(11, "Attack 11"), new CardValueEntry(11, "Attack 11"),
            new CardValueEntry(12, "Attack 12"), new CardValueEntry(12, "Attack 12"),
        };
        var guardCards = new[]
        {
            new CardValueEntry(4, "Guard 4"), new CardValueEntry(4, "Guard 4"),
            new CardValueEntry(5, "Guard 5"), new CardValueEntry(5, "Guard 5"),
            new CardValueEntry(6, "Guard 6"), new CardValueEntry(6, "Guard 6"),
            new CardValueEntry(7, "Guard 7"), new CardValueEntry(7, "Guard 7"),
            new CardValueEntry(8, "Guard 8"), new CardValueEntry(8, "Guard 8"),
        };

        var battle = new PvpBattle(
            "Whiskers", 18, 10, attackCards, guardCards,
            "Mittens", 14, 14, attackCards, guardCards);

        int rounds = 0;
        while (battle.Phase != BattlePhase.Finished && rounds < 200)
        {
            rounds++;
            battle.DrawPhase();

            var attackCard = battle.Attacker.Hand.FirstOrDefault(c => c.Type == CardType.Attack);
            if (attackCard == null)
            {
                battle.PassAttackNoCard();
                battle.EndPhase();
                continue;
            }

            battle.PlayAttack(attackCard.Id);
            var guardCard = battle.Defender.Hand.FirstOrDefault(c => c.Type == CardType.Guard);
            battle.RespondGuard(guardCard?.Id);

            if (battle.Phase == BattlePhase.Finished) break;
            battle.EndPhase();
        }

        Assert.IsNotNull(battle.WinnerId, "Battle should resolve with a winner, same as the JS demo did every run.");
        Assert.Less(rounds, 200, "Battle should not hit the round cap — matching combat stats/cards should converge well before that.");
    }

    [Test]
    public void RequestWithdrawal_CannotBeUsedTwiceByTheSamePlayer()
    {
        var cards = new[] { new CardValueEntry(5, "Attack 5") };
        var battle = new PvpBattle(
            "Whiskers", 18, 10, cards, cards,
            "Mittens", 14, 14, cards, cards);

        battle.RequestWithdrawal("Whiskers");
        battle.RespondWithdrawal(false); // denied, doesn't consume the opponent's own attempt

        Assert.Throws<System.InvalidOperationException>(() => battle.RequestWithdrawal("Whiskers"));
    }
}
