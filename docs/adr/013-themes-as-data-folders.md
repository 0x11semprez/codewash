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
| Skill titles and texts ("Enchanting Table", "Redstone", "Crafting Table", "Chest Management") | `SKILL_DATA` | Neutral defaults: "Spell Book", "Power Circuits", "Workshop", "Storage Room" | These are themed now. The Minecraft theme keeps the original wording. The defaults are what a theme without its own texts shows. |
| Fixed Minecraft lists in achievements | "Mini Master", "World Ender", "Monster Manual" | Beat every creature of the group in any one theme | The creatures are themed, so a fixed list of Minecraft names could never be completed in Space or Ocean. |
| "Zombie" fallback | Skill card | First enemy of the theme | Themed. |

We kept the achievement title "World Ender". It is an ordinary English phrase and the achievement id `world_ender` is saved in player data.

## Consequences

### Positive

- A non-developer adds a theme with a folder, three pictures and one JSON file. Creatures, music and sounds are optional.
- Every mini-game, every picture and every sound follows the theme, including the spelling ("crafting table") game.
- Changing the theme does not move or stretch anything on screen.
- Broken themes fail CI with a message that says what to fix. DEBT-021 is fixed and cannot come back unnoticed.
- The match and mismatch sounds play again. They pointed to files that did not exist.

### Negative

- The default theme is still Minecraft, with the Minecraft logo and art from the original project. The K-Pop Demon Hunters and Pokemon themes also use third-party names. This needs a decision before any public release.
- K-Pop Demon Hunters, Pokemon and Spy only have a background, a logo, a card back and skill names. Their creatures, music and sounds come from the default theme.
- JSON cannot hold comments, so the guide lives in `docs/features/themes.md` and not in the file itself.
- The Space and Ocean themes add about 6 MB to the repository, mostly music.
