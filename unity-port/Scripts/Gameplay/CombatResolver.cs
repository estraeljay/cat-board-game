namespace CatBoardGame.Gameplay
{
    // Design bible Section 04 (locked formula). Static class, no MonoBehaviour —
    // pure math, so it runs in an EditMode test with zero Unity runtime involved.
    // Direct port of prototype/combat.js.
    public static class CombatResolver
    {
        public const int BaseHp = 100;

        public static int ComputeDamage(int attackerAttack, int attackCardBonus, int defenderDefense, int guardBlockValue)
        {
            int raw = (attackerAttack + attackCardBonus) - defenderDefense - guardBlockValue;
            return System.Math.Max(1, raw);
        }
    }
}
