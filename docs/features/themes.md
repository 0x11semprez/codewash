# Themes

Issue [#21](https://github.com/0x11semprez/codewash/issues/21) (Themes mission) and issue [#53](https://github.com/0x11semprez/codewash/issues/53) (DEBT-021, missing theme images). The design choices are in [ADR-013](../adr/013-themes-as-data-folders.md).

A theme changes the look and the sound of the whole game:

- the background, the logo and the back of the memory cards,
- the names and texts of the six skill cards, and their icons,
- the enemies, mini-bosses and bosses of the battles,
- the cards of the memory game, the pieces of the pattern game, the pictures of the spelling game and the containers of the cleaning game,
- the flying bonus creature,
- the music and the sound effects.

The player picks a theme in the Cosmetics panel (the sparkle button at the top left). Each profile keeps its own theme.

The game has six themes: Blocks (the default), Idols, Monsters, Spy, Space and Ocean. Every theme has its own background, logo, card back, music and sounds. Every theme except Blocks also has its own creatures and items.

Three themes were renamed to drop the names and logos of other companies: Minecraft is now Blocks, K-Pop Demon Hunters is now Idols and Pokemon is now Monsters. Old saves move to the new names on their own (see "Saved games" below).

## Audit of the themes before this work

We read the code of every screen and mini-game and checked every file the four original themes point to. This is what did not follow the theme.

| Area | Problem found | Fix |
| --- | --- | --- |
| Missing files | `spy_logo.png`, `spy_memorycard.jpg`, `kpop_memorycard.jpg` and `pokemon_memorycard.jpg` did not exist (DEBT-021). The loading screen reported failed images. | Every theme now has a logo and a card back. A test fails when a theme points to a missing file. |
| Spy background | The Spy theme used `minecraft.png` as its background. | It uses its own picture. |
| Skill cards | The titles and texts ("Enchanting Table", "Redstone", "Crafting Table", "Power up your redstone circuits...") were the same in every theme. Only the small skill name changed. | Each theme sets its own titles, button texts and descriptions. The defaults are neutral. |
| Skill icons | The six skill icons were Minecraft pictures (blocks, a chest, an enchanted book) in every theme. | A theme can set its own icons. Every theme except Blocks does. |
| Enemies and bosses | The card looked up the Minecraft lists first. Unknown names always fell back to "Zombie". | Every name and picture comes from the theme. Unknown names show the first enemy of the theme. |
| Memory game | The cards always showed the Minecraft animals. Only the card back followed the theme. | The cards show the theme's "friends". |
| Pattern game | The pieces were always the eight axolotls. | The pieces come from the theme. |
| Spelling game (the "crafting table") | The words and pictures were always Minecraft mobs and items. | The words and pictures are built from the theme's own creatures and items. |
| Cleaning game | The containers were always Minecraft chests. | The containers come from the theme. |
| Bonus creature | The flying bonus creature was always the Minecraft Phantom. | A theme sets its own picture. |
| Music | One playlist for every theme. | A theme can list its own music. The music changes at once when the player changes theme. |
| Sound effects | One set of sounds for every theme. The memory, pattern, math and spelling games pointed at `match_success.wav` and `mismatch.wav`, which do not exist, so those sounds never played. | A theme can replace any sound. The match and mismatch sounds now point to real files. |
| Logo size | The logos had different shapes (2000 x 438, 1793 x 415, 828 x 301). The logo box only had a width, so its height changed with the theme and pushed the cards up or down. | The logo sits in a fixed 4:1 box. Every logo file is 1200 x 300. |
| Background size | The backgrounds were 1024 x 572, 1024 x 666 and 1024 x 559. | Every background is 1280 x 720. |
| Creature size | The creature picture used `max-width` and `max-height`, so a small picture stayed small and a big one filled the card. | Every creature is drawn in a fixed 200 x 200 box with `object-fit: contain`. Theme sprites are 256 x 256 squares. |
| Theme menu | A plain grid with room for four themes and no scroll bar. | The grid shows two rows and has a visible scroll bar. |
| Achievements | "Mini Master", "World Ender" and "Monster Manual" checked a fixed list of Minecraft names. | They unlock when the player beats every creature of the group in one theme. |
| Unused files | `fantasy.png`, `Scifi.png`, `pokemon_logo.svg` and an empty file named `text` were not used. | Removed. |
| Brand names and logos | The themes used the Minecraft, Pokemon and K-Pop Demon Hunters names, logos and franchise art. | Renamed to Blocks, Monsters and Idols. Their logos, backgrounds and card backs are now made from CC0 art. |
| Unused data | The `boss` and `mobType` fields of the theme and skill data were never read. | Removed. |

## How it works

Each theme has two parts:

1. A folder with its files: `public/assets/themes/<id>/`.
2. A settings file: `src/themes/<id>.json`.

The game reads every JSON file in `src/themes/` when it starts. There is no list to update in the code. The file name is the theme id, so `src/themes/ocean.json` is the theme `ocean`.

A theme can leave out any optional part. The game then uses the default part. The parts are swapped as whole groups, so a theme never mixes its own enemies with default enemies. The default creatures are the ones the game came with. The Blocks theme uses them.

The code is in `src/constants/game/themes.js` (`buildTheme`). `src/constants/game/audio.js` holds the default music and sounds. `src/services/soundManager.js` plays the sounds of the active theme (`setSoundTheme`).

A save made with another theme still works. If the saved theme no longer exists, the game uses the default theme. If a saved enemy name is not part of the current theme, the game always shows the same enemy of the current theme in its place.

## Saved games

The game renamed three themes and some default creatures. `migrateStorage()` in `src/services/storageKeys.js` runs once when the game starts and updates the save of each profile:

- the old theme ids `minecraft`, `pokemon` and `kpop` become `blocks`, `monsters` and `idols`,
- the old creature names become the new ones (for example "Creeper" becomes "Boomer"), in the skills and in the lists of defeated creatures, so achievement progress is kept.

`resolveThemeId` also accepts the old ids, so a save that was not updated still opens the right theme. The full list of renamed names is in [ADR-013](../adr/013-themes-as-data-folders.md).

## How to add a theme

You do not need to write code. You need a picture editor, a text editor and the pictures and sounds you want to use. The steps use a theme called "jungle" as an example.

### 1. Choose an id

The id is a short name in lowercase letters, with no spaces. Use dashes between words if needed. Example: `jungle`.

### 2. Create the folder

Create the folder `public/assets/themes/jungle/`.

### 3. Add the three required pictures

Put these three pictures in the folder. Use these exact file names.

| File | What it is | Size |
| --- | --- | --- |
| `background.webp` | The picture behind the game | 1280 x 720 |
| `logo.webp` | The title at the top, on a transparent background | 1200 x 300 |
| `card-back.webp` | The back of the memory cards | 400 x 600 |

PNG and JPG files work too. If you use them, write their names in the JSON file in step 4. A picture of another size still fits in its box, with no stretching. Bigger or smaller pictures can look blurry or leave empty space, so keep these sizes when you can.

### 4. Create the settings file

Create the file `src/themes/jungle.json` with a text editor and paste this:

```json
{
    "name": "Jungle",
    "order": 7,
    "background": "background.webp",
    "logo": "logo.webp",
    "cardBack": "card-back.webp",
    "skills": {
        "reading": { "name": "Reading" },
        "math": { "name": "Math" },
        "writing": { "name": "Spelling" },
        "cleaning": { "name": "Tidying" },
        "memory": { "name": "Memory" },
        "patterns": { "name": "Patterns" }
    }
}
```

Then change:

- `"name"`: the name shown in the theme menu.
- `"order"`: the position in the menu. Use the next free number (the last theme uses 6, so use 7).
- the names under `"skills"`: the small name on each skill card.

Each skill can also have a `"title"` (the big name on the card), an `"action"` (the button text) and a `"description"`. Look at `src/themes/ocean.json` for a full example.

JSON is strict. Keep the double quotes around names and texts. Put a comma between two items, and no comma after the last item of a list.

Your theme now works. It uses the default creatures, music and sounds. Steps 5 and 6 replace them.

### 5. Add your own creatures and items (optional)

Make a `sprites` folder in your theme folder. Each picture must be a square of 256 x 256 pixels with a transparent background. Then add groups to the JSON file. Each group is a list of `"Name": "file"`. The name is shown in the game and is a word to spell in the spelling game, so use letters and spaces only.

| Group | Where it shows | Minimum |
| --- | --- | --- |
| `enemies` | Battles of the reading, math, spelling and pattern skills | 2 |
| `minibosses` | Every 10 levels | 1 |
| `bosses` | Every 20 levels | 1 |
| `friends` | Fronts of the memory cards | 10 |
| `craftItems` | Extra pictures for the spelling game | none |
| `containers` | The cleaning skill | 3 |
| `patternPieces` | The pieces of the pattern game, in order. Each piece plays its own note. | 8 |

The cleaning skill also needs two settings: `"milestoneContainer"` (shown every 5 levels) and `"bossContainer"` (shown every 20 levels). Both must be names from your `containers` list.

You can also set:

- `"bonusCreature"`: the picture of the creature that flies across the screen.
- `"skillIcons"`: one picture for each skill (`reading`, `math`, `writing`, `cleaning`, `memory`, `patterns`).

### 6. Add your own music and sounds (optional)

Make `music` and `sounds` folders in your theme folder.

`"music"` is a list of music files: `["music/track-1.mp3", "music/track-2.mp3"]`. Use MP3 files under 5 MB.

`"sounds"` is a list of `"key": "file"`. Each key replaces one sound. Keys you leave out keep the default sound.

| Key | When it plays |
| --- | --- |
| `click` | Buttons |
| `cardLeft`, `cardRight` | Moving between skill cards |
| `hit` | A right answer |
| `fail` | A wrong answer |
| `death` | The player loses all hearts |
| `levelUp` | A new level |
| `notification` | A new rank or an achievement |
| `match` | A pair found in the memory game, a round won in the pattern game |
| `mismatch` | A wrong pair or a wrong piece |
| `enemyHurt` | An enemy takes a hit |
| `enemyDefeat` | An enemy is defeated |

Without `enemyHurt` and `enemyDefeat`, the default enemies play their own sounds and other enemies play none.

### 7. Add the license

Only use pictures and sounds you have the right to use. Put the license text next to them, in a file whose name starts with `LICENSE`, for example `LICENSE.txt`. Write where each file comes from in the "Credits" section below.

### 8. Check the theme

Ask a developer to run `npm test`, or run it yourself. The test `src/__tests__/themeFiles.test.js` checks every theme. When something is wrong, it names the theme and the file or setting to fix, for example:

```
logo: public/assets/themes/jungle/logo2.webp is missing
enemies > "Drone 2": use letters and spaces only
```

It checks that:

- the JSON file and the folder both exist,
- every file the JSON file names exists, has a supported type and is not too big (1 MB per picture, 5 MB per music file),
- the background, logo and card back have the right shape, and sprites are square,
- skill and sound keys are spelled right,
- each group has enough pictures,
- a license file is present when the theme has its own files.

Then start the game (`npm run dev`), open the Cosmetics panel and pick your theme.

## Picture sizes

| Picture | Size | Shape | Shown in |
| --- | --- | --- | --- |
| Background | 1280 x 720 | 16:9 | The whole screen, cropped to fill it |
| Logo | 1200 x 300 | 4:1, transparent | A fixed 4:1 box above "Level Up!" |
| Card back | 400 x 600 | 2:3 | The memory cards, cropped to fill them |
| Sprites and icons | 256 x 256 | Square, transparent | Fixed boxes, never stretched |

## What every theme shares

Some parts stay the same in every theme. They are not tied to one world, or changing them would change the rules of the game.

- The rank badges, the card border effects and the difficulty icons.
- The notes of the pattern game. Each theme maps its pieces to the same eight notes.
- The reading words and the math problems.
- The "Level Up!" title, the hearts and the achievement names.

## Known limits

- The Blocks theme keeps the creature, item and skill pictures the game came with. Their origin is not documented. Many of them look like Minecraft art. Their Minecraft names were renamed (see ADR-013), but the pictures should be replaced with CC0 art before any public release. The same goes for the default music in `public/assets/sounds/bgm/` (`calm1` to `calm3`, `piano1` to `piano3`), the default UI sounds and the per-enemy sounds in `public/assets/sounds/mob/`. No theme plays them now, because every theme lists its own music and sounds, but they are still the fallback.
- The bonus creature event and its achievement keep the internal name "phantom" in the code and in saved data, so old saves keep their progress.

## Credits

All files of the six theme folders are public domain (CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/). The license text of each Kenney pack is in the theme folder as `LICENSE-kenney-<pack>.txt`. The music and the OpenGameArt sounds have no license file in their download, so `LICENSE-music*.txt` in each folder records the title, author, page and license of each file.

We resized, cropped and converted the pictures to WebP, and re-encoded the music to MP3 at 96 kbps. The six logos are text drawn with the Kenney Future font from the Space Shooter Redux pack. The card backs and the Idols and Spy backgrounds were drawn with ImageMagick from simple shapes and the Kenney pictures listed below. The Monsters bosses and the Idols demons are built from Kenney Monster Builder parts. The Idols friends and pattern pieces are Kenney Shape Characters with a face. Some Spy robots and bosses are Toon Characters with shifted colors.

| Theme | Files | Pack or title | Author | Source | License |
| --- | --- | --- | --- | --- | --- |
| Blocks | Background, card back | New Platformer Pack | Kenney (kenney.nl) | https://opengameart.org/content/new-platformer-pack | CC0 |
| Blocks | `hit`, `death`, `level-up`, `match`, `enemy-hurt`, `enemy-defeat` sounds | New Platformer Pack | Kenney (kenney.nl) | https://opengameart.org/content/new-platformer-pack | CC0 |
| Blocks | `click`, `card-left`, `card-right`, `fail`, `notification`, `mismatch` sounds | Interface Sounds | Kenney (kenney.nl) | https://opengameart.org/content/interface-sounds | CC0 |
| Blocks | `music/flowerbed-fields.mp3` | Flowerbed Fields [Loop] | Zane Little Music | https://opengameart.org/content/flowerbed-fields-loop | CC0 |
| Blocks | `music/town-theme.mp3` | Town Theme RPG | cynicmusic | https://opengameart.org/content/town-theme-rpg | CC0 |
| Monsters | Enemies, minibosses, items, blocks, pieces, icons, background | New Platformer Pack | Kenney (kenney.nl) | https://opengameart.org/content/new-platformer-pack | CC0 |
| Monsters | Bosses (built from parts) | Monster Builder Pack | Kenney (kenney.nl) | https://opengameart.org/content/monster-builder-pack | CC0 |
| Monsters | Friends (animals) | Animal Pack Redux | Kenney (kenney.nl) | https://opengameart.org/content/animal-pack-redux | CC0 |
| Monsters | `click`, `hit`, `death`, `level-up`, `notification`, `match`, `enemy-hurt`, `enemy-defeat` sounds | New Platformer Pack | Kenney (kenney.nl) | https://opengameart.org/content/new-platformer-pack | CC0 |
| Monsters | `card-left`, `card-right`, `fail`, `mismatch` sounds | Interface Sounds | Kenney (kenney.nl) | https://opengameart.org/content/interface-sounds | CC0 |
| Monsters | `music/happy-adventure.mp3` | Happy Adventure (Loop) | TinyWorlds | https://opengameart.org/content/happy-adventure-loop | CC0 |
| Monsters | `music/green-hills.mp3` | Green Hills | Igor Gundarev | https://opengameart.org/content/green-hills | CC0 |
| Idols | Enemies, minibosses, bosses (built from parts) | Monster Builder Pack | Kenney (kenney.nl) | https://opengameart.org/content/monster-builder-pack | CC0 |
| Idols | Friends, pieces, background idols | Shape Characters | Kenney (kenney.nl) | https://opengameart.org/content/shape-characters | CC0 |
| Idols | Microphone, headphones, disc, music player, bags, suitcases, pencil icon | Generic Items | Kenney (kenney.nl) | https://opengameart.org/content/generic-items | CC0 |
| Idols | Crown, medal | Board Game Icons | Kenney (kenney.nl) | https://opengameart.org/content/board-game-icons | CC0 |
| Idols | Star, heart | New Platformer Pack | Kenney (kenney.nl) | https://opengameart.org/content/new-platformer-pack | CC0 |
| Idols | All sounds | Interface Sounds | Kenney (kenney.nl) | https://opengameart.org/content/interface-sounds | CC0 |
| Idols | `music/funky-house.mp3` | Funky House | Of Far Different Nature | https://opengameart.org/content/funky-house | CC0 |
| Idols | `music/party-sector.mp3` | Party Sector | Joth | https://opengameart.org/content/party-sector | CC0 |
| Spy | Enemies, minibosses, bosses, bonus robot | Toon Characters 1 | Kenney (kenney.nl) | https://opengameart.org/content/toon-characters-1 | CC0 |
| Spy | Gadgets, items, bags, icons | Generic Items | Kenney (kenney.nl) | https://opengameart.org/content/generic-items | CC0 |
| Spy | Pattern pieces (card suits and chess pieces), card back lock | Board Game Icons | Kenney (kenney.nl) | https://opengameart.org/content/board-game-icons | CC0 |
| Spy | `click`, `card-left`, `card-right`, `fail`, `level-up`, `notification`, `mismatch` sounds | Interface Sounds | Kenney (kenney.nl) | https://opengameart.org/content/interface-sounds | CC0 |
| Spy | `hit`, `death`, `match`, `enemy-hurt`, `enemy-defeat` sounds | Sci-Fi Sounds | Kenney (kenney.nl) | https://opengameart.org/content/sci-fi-sounds | CC0 |
| Spy | `music/spy-loop.mp3` | Spy Loop | wipics | https://opengameart.org/content/spy-loop | CC0 |
| Spy | `music/covert-action.mp3` | Covert Action | congusbongus | https://opengameart.org/content/covert-action | CC0 |
| All | Logo font (Kenney Future) | Space Shooter Redux | Kenney (kenney.nl) | https://opengameart.org/content/space-shooter-redux | CC0 |
| Space | Enemies, bosses, ships, items, pods, pieces, background, logo font, `fail`, `death` and `level-up` sounds | Space Shooter Redux | Kenney (kenney.nl) | https://opengameart.org/content/space-shooter-redux | CC0 |
| Space | `hit`, `match`, `enemy-hurt`, `enemy-defeat` sounds | Sci-Fi Sounds | Kenney (kenney.nl) | https://opengameart.org/content/sci-fi-sounds | CC0 |
| Space | `click`, `card-left`, `card-right`, `notification`, `mismatch` sounds | Interface Sounds | Kenney (kenney.nl) | https://opengameart.org/content/interface-sounds | CC0 |
| Space | `music/magic-space.mp3` | Magic Space | CodeManu | https://opengameart.org/content/magic-space | CC0 |
| Space | `music/drifting.mp3` | Drifting | Some Weirdo | https://opengameart.org/content/drifting-0 | CC0 |
| Ocean | Fish, seaweed, bubbles, rocks, background | Fish Pack 2.0 | Kenney (kenney.nl) | https://opengameart.org/content/fish-pack-0 | CC0 |
| Ocean | Ships, crew, cannons, boats, crate, sail | Pirate Pack | Kenney (kenney.nl) | https://opengameart.org/content/pirate-pack-190 | CC0 |
| Ocean | `click`, `card-left`, `card-right`, `fail`, `level-up`, `notification`, `mismatch` sounds | Interface Sounds | Kenney (kenney.nl) | https://opengameart.org/content/interface-sounds | CC0 |
| Ocean | `hit`, `death`, `match`, `enemy-hurt`, `enemy-defeat` sounds | 40 CC0 water / splash / slime SFX | rubberduck | https://opengameart.org/content/40-cc0-water-splash-slime-sfx | CC0 |
| Ocean | `music/deep-sea.mp3` | Deep Sea | Umplix | https://opengameart.org/content/deep-sea | CC0 |
| Ocean | `music/underwater-village.mp3` | Binary Underwater Village (loop) | Pro Sensory | https://opengameart.org/content/binary-underwater-village-loop | CC0 |
