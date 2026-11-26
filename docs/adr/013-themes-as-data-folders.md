# ADR-013: Themes as one folder and one JSON file each

## Status

Accepted

## Date

2026-11-26

## Context

The subject asks us to fix the themes, add two new ones and document how to add a theme. People who are not developers will add themes, so the process must be as simple as we can make it.

Before this change, a theme was an entry in `THEME_CONFIG` in `src/constants/game/themes.js`. It held a background, a logo, a card back and six skill names. Everything else came from Minecraft lists in the code: enemies, bosses, memory cards, pattern pieces, spelling pictures, chests, skill titles, icons, music and sounds. The audit in [docs/features/themes.md](../features/themes.md) lists every problem we found.

Adding a theme meant editing JavaScript in two places (`THEME_CONFIG` and `THEMES_LIST`). Nothing checked that the files existed. Four files were already missing (DEBT-021).

## Decision

### One folder and one JSON file per theme

- The files of a theme live in `public/assets/themes/<id>/`, with fixed names for the three required pictures: `background.webp`, `logo.webp` and `card-back.webp`.
- The settings live in `src/themes/<id>.json`. The file name is the theme id.
- `src/constants/game/themes.js` loads every JSON file with `import.meta.glob`. Adding a theme does not touch any JavaScript file.
- `buildTheme` fills every part a theme leaves out with the default part. Parts are swapped as whole groups (all enemies, all friends, ...), so a theme never mixes its own enemies with Minecraft ones.
- The old `THEME_CONFIG` and `THEMES_LIST` exports keep their shape, so existing code and tests kept working.

We chose JSON over JavaScript because a non-developer can edit it without knowing the language, and a broken file fails one clear test. We kept the JSON in `src/` because Vite cannot import files from `public/`.

### Everything on screen comes from the theme

- `getMobForSkill`, `getRandomMob` and the other pickers take the theme. A saved name that is not part of the current theme maps to one fixed creature of the theme (`pickStable`), so the card does not change on every render.
- The spelling game builds its word list from the theme's pictures (`theme.writingPools`).
- The memory game, the pattern game, the cleaning containers, the bonus creature, the skill icons and the skill texts all read the theme.
- `soundManager.setSoundTheme` swaps the sound files and the music playlist. Keys a theme leaves out keep the default file.

### Fixed boxes for pictures

- Every theme picture has a standard size: background 1280 x 720, logo 1200 x 300, card back 400 x 600, sprites 256 x 256.
- The UI draws each picture in a fixed box with `object-fit`. A picture of the wrong size can look blurry, but it never stretches and never moves the rest of the screen.

### Theme text in other languages

The game is translated (ADR-012). Theme text belongs to the theme, so it is translated in the theme JSON, in a `"translations"` block per language: the theme name, the skill texts and the pattern piece labels. `themeSkillText`, `themeName` and `pieceLabel` in `src/i18n/gameText.js` pick the text in this order: the theme's translation, the theme's own text, then the dictionary. A new theme without translations still works in every language. Fixed UI text, badges, border effects and the default skill texts stay in the dictionaries.

### A test that guards new themes

`src/__tests__/themeFiles.test.js` checks every theme: missing files, file types, file sizes, picture shapes, names, counts and license files. Each failure names the theme and the file or setting to fix.

### Minecraft names we renamed

The subject asks us to rename Minecraft-specific values we cannot move into a theme. These are the ones we found.

| Value | Where | New value | Why not themed |
| --- | --- | --- | --- |
| "Netherite" badge | Badge tiers, border effect lock, badge picture | "Titanium" (`titanium_badge.svg`) | Badge tiers are a shared progress ladder (wood, stone, gold, iron, emerald, diamond, ..., obsidian). The other tiers are real materials. Netherite is the only one invented by Minecraft. Badges are computed from levels and never saved by name, so the rename is safe. |
| "Nether Portal" border effect | Cosmetics panel | "Shadow Portal" | Border effects are cosmetics unlocked by badges. They belong to the player, not to a world, and keep their look when the theme changes. |
| `border-netherite` CSS class | Skill card border at level 140 | `border-titanium` | Follows the badge rename. |
| "Phantom" bonus creature | Flying bonus event, loot box text "Phantom Bonus!", achievement text "Catch Phantoms" | Theme picture `bonusCreature`, "Bonus Level!", "Catch the flying bonus creature" | The picture is themed. The internal names (`PhantomEvent`, `phantomsCaught`, the storage key `phantomEvent_lastSpawn_v1`) stay, because renaming them would reset saved progress. |
| Axolotls in the pattern game | `axolotlCount`, `AXOLOTL_NOTE_MAP`, `assets/sounds/axolotl/` | `pieceCount`, `NOTE_SOUNDS`, `assets/sounds/notes/` | The pieces are themed now. The notes are shared, because the game teaches the same melody in every theme. |
| Skill titles and texts ("Enchanting Table", "Redstone", "Crafting Table", "Chest Management") | `SKILL_DATA` | Neutral defaults: "Spell Book", "Power Circuits", "Workshop", "Storage Room". The Blocks theme uses "Magic Table", "Power Lab", "Workbench" and "Chest Management". | These are themed now. The defaults are what a theme without its own texts shows. |
| Fixed Minecraft lists in achievements | "Mini Master", "World Ender", "Monster Manual" | Beat every creature of the group in any one theme | The creatures are themed, so a fixed list of Minecraft names could never be completed in Space or Ocean. |
| "Zombie" fallback | Skill card | First enemy of the theme | Themed. |

We kept the achievement title "World Ender". It is an ordinary English phrase and the achievement id `world_ender` is saved in player data.

### Themes renamed to drop brand names

Three themes used the names, logos and art of other companies. We renamed them and replaced their pictures with CC0 or drawn ones.

| Old theme | New theme | Old id | New id |
| --- | --- | --- | --- |
| Minecraft | Blocks | `minecraft` | `blocks` |
| Pokemon | Monsters | `pokemon` | `monsters` |
| K-Pop Demon Hunters | Idols | `kpop` | `idols` |

We renamed the default id too. The id is saved in each profile, so `migrateStorage()` rewrites old ids at startup, and `resolveThemeId` also maps an old id to the new theme. No save is lost, so there was no reason to keep the `minecraft` id.

### Default creatures renamed

The default creatures (used by the Blocks theme) had Minecraft names. We renamed the names that only exist in Minecraft. The names are saved in each profile (the current enemy of each skill and the lists of defeated creatures that achievements read), so `migrateStorage()` renames them in the save too, and achievement progress is kept. The map is `MOB_NAME_RENAMES` in `src/constants/game/mobs.js`. File names of the pictures did not change, except `Herobrine.png`, which is now `darkhero.png`.

| Old name | New name |
| --- | --- |
| Creeper | Boomer |
| Enderman | Shadow Walker |
| Ghast | Sky Ghost |
| Hoglin | Tusk Beast |
| Magma Cube | Lava Cube |
| Piglin | Pig Warrior |
| Bogged | Swamp Archer |
| Evoker | Sorcerer |
| Ender Dragon | Void Dragon |
| Herobrine | Dark Hero |
| Wither | Skull King |
| Wither Skeleton | Dark Skeleton |
| Creaking | Tree Spirit |
| Allay | Sky Sprite |
| Mooshroom | Mushroom Cow |
| Ender Chest | Magic Chest |
| Shulker Box | Shell Box |

We kept names that are ordinary English words or common fantasy creatures: Zombie, Skeleton, Spider, Slime, Witch, Blaze, Breeze, Drowned, Guardian, Elder Guardian, Parched, Phantom, Pillager, Ravager, Warden, the golems, Glow Squid, Sniffer, Strider and the farm animals. Renaming them would not remove a brand name, and it would change more saves and spelling words for no gain.

## Consequences

### Positive

- A non-developer adds a theme with a folder, three pictures and one JSON file. Creatures, music and sounds are optional.
- No theme uses the name, logo or art of another company. Old saves move to the renamed themes and creatures on their own.
- Every mini-game, every picture and every sound follows the theme, including the spelling ("crafting table") game.
- Changing the theme does not move or stretch anything on screen.
- Broken themes fail CI with a message that says what to fix. DEBT-021 is fixed and cannot come back unnoticed.
- The match and mismatch sounds play again. They pointed to files that did not exist.

### Negative

- Known limit: Blocks keeps the original creature, item and skill icon images. Only their names changed. Many look like Minecraft art. The team keeps them on purpose and will justify it at the defense.
- The default UI sounds and the per-enemy sounds come from the original project. No theme plays them any more, but they stay as the fallback. The six old music files named after Minecraft soundtrack files (`calm1` to `piano3`) were deleted, and the default music is now the Blocks playlist.
- JSON cannot hold comments, so the guide lives in `docs/features/themes.md` and not in the file itself.
- The six theme folders add about 17 MB to the repository, mostly music.
