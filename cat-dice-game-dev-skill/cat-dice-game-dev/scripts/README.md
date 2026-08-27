# Scaffolding scripts

Empty for now — there's no Unity project yet to scaffold against (see `unity-port/README.md`
for porting status). Once the `ScriptableObject` definition classes exist
(`CatDefinition`, `ClassDefinition`, `PropertyDefinition`, `EquipmentDefinition`,
`PvpCardDefinition`), this is the right place for a Unity Editor menu script
(`Assets/_Project/Scripts/Editor/`) that creates a new cat / class / property / card asset
from a template — so "add a new cat" or "add a new property" stays a one-click action
instead of manual asset duplication.
