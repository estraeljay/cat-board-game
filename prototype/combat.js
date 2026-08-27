// Cat Board Game — Combat math (design bible Section 04, fully locked)

export const BASE_HP = 100;

export function computeDamage(attackerAttack, attackCardBonus, defenderDefense, guardBlockValue) {
  return Math.max(1, (attackerAttack + attackCardBonus) - defenderDefense - guardBlockValue);
}
