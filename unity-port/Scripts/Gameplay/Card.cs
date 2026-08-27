namespace CatBoardGame.Gameplay
{
    public enum CardType
    {
        Attack,
        Guard
    }

    // A dealt card instance. Plain class, not a struct — Deck/Hand/Discard lists
    // hold references to the *same* card object as it moves between them, same
    // as the JS prototype passing one object reference around. A struct would
    // copy on every list move, which is wrong here (Id/Type/Value/Name never
    // change, but identity — "is this the same physical card" — matters).
    public class Card
    {
        public string Id { get; }
        public CardType Type { get; }
        public int Value { get; }
        public string Name { get; }

        public Card(string id, CardType type, int value, string name)
        {
            Id = id;
            Type = type;
            Value = value;
            Name = name;
        }
    }

    // One named card's power value — e.g. { Value = 4, Name = "Ember Burst" }.
    // This is the shape a CardDefinition ScriptableObject will hand PvpBattle
    // once class decks are wired up as data assets (see art/content integration
    // phase) instead of hardcoded arrays like the test file below uses.
    //
    // A struct here (not a class) is fine and slightly cheaper: unlike Card,
    // these never need reference identity — they're just "a value and a name"
    // read once when a deck is built, then discarded.
    public readonly struct CardValueEntry
    {
        public readonly int Value;
        public readonly string Name;

        public CardValueEntry(int value, string name)
        {
            Value = value;
            Name = name;
        }
    }
}
