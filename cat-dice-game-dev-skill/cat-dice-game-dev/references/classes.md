# Classes — Source of Truth

**Combat formula (canonical — see `game-design-reference.md` Section 5):**

```
Damage = max(1, (Attacker's Attack stat + Attack card bonus) − Defender's Defense stat − Guard card block value)
```

The per-card **power values in this file are the `Attack card bonus` / `Guard card block
value` terms** in that formula — *not* the whole damage number. An earlier draft of this
file stated a simpler `Attacker's Attack power − Defender's Guard power, floored at 0`; that
was **superseded** and is not what the prototype (`prototype/combat.js`) or the Unity port
(`unity-port/Scripts/Gameplay/CombatResolver.cs`) implement. The `max(1, …)` floor of 1 is
deliberate — it makes a stalemate mathematically impossible.

Three playable classes: Knight, Mage, Priest (locked — the class roster is exactly these
three). Each has its own 20-card set — 10 Attack cards and 10 Guard cards — with power
values on a clean 1–10 spread per card type (no duplicate power values within a class/type,
weakest to strongest). Power is capped at 10 per the design brief; don't add cards above
that without an explicit decision to raise the cap, since every class was balanced against
a shared 1–10 ceiling.

Unless a card is later given a special ability, a card's power is simply its bonus/block
term in the formula above.

## Knight

Melee, sword-and-shield, chivalric.

| Power | Attack card | Power | Guard card |
|---|---|---|---|
| 1 | Practice Swing | 1 | Raised Fists |
| 2 | Shield Bash | 2 | Wooden Buckler |
| 3 | Quick Slash | 3 | Steel Brace |
| 4 | Lance Charge | 4 | Shield Wall |
| 5 | Parry Riposte | 5 | Plate Guard |
| 6 | Iron Cleave | 6 | Tower Shield Stance |
| 7 | Valorous Strike | 7 | Knight's Resolve |
| 8 | Oathbreaker's Edge | 8 | Unbreakable Bulwark |
| 9 | Champion's Onslaught | 9 | Aegis of Valor |
| 10 | Dragonfang Cleave | 10 | Fortress Stance |

## Mage

Arcane, elemental, ranged spellcasting.

| Power | Attack card | Power | Guard card |
|---|---|---|---|
| 1 | Spark | 1 | Mana Veil |
| 2 | Arcane Dart | 2 | Ward Glyph |
| 3 | Frost Bolt | 3 | Frost Barrier |
| 4 | Ember Burst | 4 | Arcane Shield |
| 5 | Lightning Jab | 5 | Mirror Ward |
| 6 | Void Lance | 6 | Elemental Aegis |
| 7 | Chain Lightning | 7 | Runic Bulwark |
| 8 | Inferno Blast | 8 | Spellward Bastion |
| 9 | Arcane Cataclysm | 9 | Arcane Sanctuary |
| 10 | Meteor Sigil | 10 | Absolute Barrier |

## Priest

Holy, radiant, faith-driven.

| Power | Attack card | Power | Guard card |
|---|---|---|---|
| 1 | Minor Smite | 1 | Faint Blessing |
| 2 | Holy Spark | 2 | Prayer Shield |
| 3 | Radiant Jab | 3 | Holy Ward |
| 4 | Sacred Flame | 4 | Sanctified Barrier |
| 5 | Purging Light | 5 | Guardian Light |
| 6 | Wrath of Dawn | 6 | Divine Aegis |
| 7 | Divine Judgment | 7 | Miracle Shield |
| 8 | Zealous Strike | 8 | Halo of Protection |
| 9 | Righteous Fury | 9 | Celestial Bulwark |
| 10 | Seraphic Smite | 10 | Sanctuary of the Faithful |
