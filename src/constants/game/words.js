// Word lists for the reading and writing games.
export const READING_WORDS = {
    3: ['CAT', 'DOG', 'SUN', 'BAT', 'HAT', 'RUN', 'BIG', 'RED', 'FOX', 'MOM', 'DAD', 'CUP', 'BUS', 'PEN', 'ANT', 'BEE'],
    4: [
        'BOOK',
        'TREE',
        'FISH',
        'BALL',
        'CAKE',
        'BIRD',
        'FROG',
        'PLAY',
        'JUMP',
        'MILK',
        'DOOR',
        'DUCK',
        'STAR',
        'MOON',
        'RAIN',
    ],
    5: [
        'APPLE',
        'HOUSE',
        'WATER',
        'HAPPY',
        'MUSIC',
        'TIGER',
        'BEACH',
        'PLANT',
        'CLOUD',
        'SMILE',
        'PIZZA',
        'GRAPE',
        'HORSE',
        'SHEEP',
    ],
    6: [
        'BANANA',
        'ORANGE',
        'PURPLE',
        'GARDEN',
        'FRIEND',
        'SCHOOL',
        'FLOWER',
        'RABBIT',
        'MONKEY',
        'BUTTON',
        'CASTLE',
        'DRAGON',
        'FOREST',
    ],
    7: [
        'DIAMOND',
        'EMERALD',
        'CHICKEN',
        'RAINBOW',
        'DOLPHIN',
        'PENGUIN',
        'GIRAFFE',
        'PUMPKIN',
        'VOLCANO',
        'TORNADO',
        'MONSTER',
        'TEACHER',
    ],
    8: [
        'SKELETON',
        'ELEPHANT',
        'TREASURE',
        'CROCODILE',
        'FIREWORK',
        'BIRTHDAY',
        'SANDWICH',
        'DINOSAUR',
        'COMPUTER',
        'MUSHROOM',
        'I LOVE MOM',
    ],
};

// Humorously long words for difficulty 7 (adult assistance)

export const FUNNY_LONG_WORDS = [
    'ANTIDISESTABLISHMENTARIANISM',
    'PNEUMONOULTRAMICROSCOPICSILICOVOLCANOCONIOSIS',
    'HIPPOPOTOMONSTROSESQUIPPEDALIOPHOBIA',
    'SUPERCALIFRAGILISTICEXPIALIDOCIOUS',
    'FLOCCINAUCINIHILIPILIFICATION',
    'PSEUDOPSEUDOHYPOPARATHYROIDISM',
    'INCOMPREHENSIBILITIES',
    'HONORIFICABILITUDINITY',
];

// Spelling items with length property for writing skill

export const SPELLING_ITEMS = [
    { word: 'TNT', length: 3 },
    { word: 'BED', length: 3 },
    { word: 'BOW', length: 3 },
    { word: 'MAP', length: 3 },
    { word: 'EGG', length: 3 },
    { word: 'ICE', length: 3 },
    { word: 'AXE', length: 3 },
    { word: 'HOE', length: 3 },
    { word: 'BOOK', length: 4 },
    { word: 'CAKE', length: 4 },
    { word: 'BOAT', length: 4 },
    { word: 'DOOR', length: 4 },
    { word: 'WOOL', length: 4 },
    { word: 'SAND', length: 4 },
    { word: 'DIRT', length: 4 },
    { word: 'MILK', length: 4 },
    { word: 'APPLE', length: 5 },
    { word: 'SWORD', length: 5 },
    { word: 'TORCH', length: 5 },
    { word: 'ARROW', length: 5 },
    { word: 'CHEST', length: 5 },
    { word: 'STONE', length: 5 },
    { word: 'BUCKET', length: 6 },
    { word: 'POTION', length: 6 },
    { word: 'CARROT', length: 6 },
    { word: 'COOKIE', length: 6 },
    { word: 'HELMET', length: 6 },
    { word: 'SADDLE', length: 6 },
    { word: 'DIAMOND', length: 7 },
    { word: 'EMERALD', length: 7 },
    { word: 'REDSTONE', length: 8 },
    { word: 'OBSIDIAN', length: 8 },
    { word: 'SKELETON', length: 8 },
    { word: 'NETHERITE', length: 9 },
];

// Comprehensive writing word index from all mobs (excluding axolotls), blocks, and items

export const WRITING_WORD_INDEX = [
    // Mobs from friendly
    { word: 'skysprite', displayName: 'Sky Sprite', length: 10, imagePath: 'assets/mobs/friendly/allay.webp' },
    { word: 'armadillo', displayName: 'Armadillo', length: 9, imagePath: 'assets/mobs/friendly/armadillo.png' },
    { word: 'bunny', displayName: 'Bunny', length: 5, imagePath: 'assets/mobs/friendly/bunny.png' },
    { word: 'camel', displayName: 'Camel', length: 5, imagePath: 'assets/mobs/friendly/camel.webp' },
    { word: 'cat', displayName: 'Cat', length: 3, imagePath: 'assets/mobs/friendly/cat.png' },
    { word: 'chicken', displayName: 'Chicken', length: 7, imagePath: 'assets/mobs/friendly/chicken.png' },
    { word: 'coppergolem', displayName: 'Copper Golem', length: 12, imagePath: 'assets/mobs/friendly/coppergolem.png' },
    { word: 'cow', displayName: 'Cow', length: 3, imagePath: 'assets/mobs/friendly/cow.png' },
    { word: 'fish', displayName: 'Fish', length: 4, imagePath: 'assets/mobs/friendly/fish.png' },
    { word: 'frog', displayName: 'Frog', length: 4, imagePath: 'assets/mobs/friendly/frog.webp' },
    { word: 'glowsquid', displayName: 'Glow Squid', length: 10, imagePath: 'assets/mobs/friendly/glowsquid.webp' },
    { word: 'goat', displayName: 'Goat', length: 4, imagePath: 'assets/mobs/friendly/goat.png' },
    { word: 'horse', displayName: 'Horse', length: 5, imagePath: 'assets/mobs/friendly/horse.png' },
    { word: 'irongolem', displayName: 'Iron Golem', length: 10, imagePath: 'assets/mobs/friendly/irongolem.png' },
    { word: 'mushroomcow', displayName: 'Mushroom Cow', length: 12, imagePath: 'assets/mobs/friendly/mooshroom.png' },
    { word: 'nautilus', displayName: 'Nautilus', length: 8, imagePath: 'assets/mobs/friendly/nautilus.webp' },
    { word: 'panda', displayName: 'Panda', length: 5, imagePath: 'assets/mobs/friendly/panda.png' },
    { word: 'pig', displayName: 'Pig', length: 3, imagePath: 'assets/mobs/friendly/pig.png' },
    { word: 'polarbear', displayName: 'Polar Bear', length: 10, imagePath: 'assets/mobs/friendly/polarbear.png' },
    { word: 'sheep', displayName: 'Sheep', length: 5, imagePath: 'assets/mobs/friendly/sheep.png' },
    { word: 'sniffer', displayName: 'Sniffer', length: 7, imagePath: 'assets/mobs/friendly/sniffer.webp' },
    { word: 'snowgolem', displayName: 'Snow Golem', length: 10, imagePath: 'assets/mobs/friendly/snowgolem.png' },
    { word: 'squid', displayName: 'Squid', length: 5, imagePath: 'assets/mobs/friendly/squid.webp' },
    { word: 'strider', displayName: 'Strider', length: 7, imagePath: 'assets/mobs/friendly/strider.webp' },
    { word: 'turtle', displayName: 'Turtle', length: 6, imagePath: 'assets/mobs/friendly/turtle.png' },
    { word: 'wolf', displayName: 'Wolf', length: 4, imagePath: 'assets/mobs/friendly/wolf.png' },

    // Mobs from hostile
    { word: 'blaze', displayName: 'Blaze', length: 5, imagePath: 'assets/mobs/hostile/blaze.webp' },
    { word: 'swamparcher', displayName: 'Swamp Archer', length: 12, imagePath: 'assets/mobs/hostile/bogged.png' },
    { word: 'breeze', displayName: 'Breeze', length: 6, imagePath: 'assets/mobs/hostile/breeze.webp' },
    { word: 'boomer', displayName: 'Boomer', length: 6, imagePath: 'assets/mobs/hostile/creeper.png' },
    { word: 'drowned', displayName: 'Drowned', length: 7, imagePath: 'assets/mobs/hostile/drowned.png' },
    { word: 'shadowwalker', displayName: 'Shadow Walker', length: 13, imagePath: 'assets/mobs/hostile/enderman.png' },
    { word: 'sorcerer', displayName: 'Sorcerer', length: 8, imagePath: 'assets/mobs/hostile/evoker.png' },
    { word: 'skyghost', displayName: 'Sky Ghost', length: 9, imagePath: 'assets/mobs/hostile/ghast.webp' },
    { word: 'guardian', displayName: 'Guardian', length: 8, imagePath: 'assets/mobs/hostile/guardian.webp' },
    { word: 'tuskbeast', displayName: 'Tusk Beast', length: 10, imagePath: 'assets/mobs/hostile/hoglin.png' },
    { word: 'lavacube', displayName: 'Lava Cube', length: 9, imagePath: 'assets/mobs/hostile/magmacube.png' },
    { word: 'parched', displayName: 'Parched', length: 7, imagePath: 'assets/mobs/hostile/parched.png' },
    { word: 'phantom', displayName: 'Phantom', length: 7, imagePath: 'assets/mobs/hostile/phantom.webp' },
    { word: 'pigwarrior', displayName: 'Pig Warrior', length: 11, imagePath: 'assets/mobs/hostile/piglin.png' },
    { word: 'pillager', displayName: 'Pillager', length: 8, imagePath: 'assets/mobs/hostile/pillager.png' },
    { word: 'skeleton', displayName: 'Skeleton', length: 8, imagePath: 'assets/mobs/hostile/skeleton.png' },
    { word: 'slime', displayName: 'Slime', length: 5, imagePath: 'assets/mobs/hostile/slime.png' },
    { word: 'spider', displayName: 'Spider', length: 6, imagePath: 'assets/mobs/hostile/spider.png' },
    { word: 'witch', displayName: 'Witch', length: 5, imagePath: 'assets/mobs/hostile/witch.png' },
    { word: 'zombie', displayName: 'Zombie', length: 6, imagePath: 'assets/mobs/hostile/zombie.png' },

    // Mobs from miniboss
    { word: 'treespirit', displayName: 'Tree Spirit', length: 11, imagePath: 'assets/mobs/miniboss/creaking.png' },
    {
        word: 'elderguardian',
        displayName: 'Elder Guardian',
        length: 14,
        imagePath: 'assets/mobs/miniboss/elderguardian.webp',
    },
    { word: 'ravager', displayName: 'Ravager', length: 7, imagePath: 'assets/mobs/miniboss/ravager.png' },
    {
        word: 'darkskeleton',
        displayName: 'Dark Skeleton',
        length: 13,
        imagePath: 'assets/mobs/miniboss/witherskeleton.png',
    },

    // Mobs from boss
    { word: 'voiddragon', displayName: 'Void Dragon', length: 11, imagePath: 'assets/mobs/boss/enderdragon.webp' },
    { word: 'darkhero', displayName: 'Dark Hero', length: 9, imagePath: 'assets/mobs/boss/darkhero.png' },
    { word: 'warden', displayName: 'Warden', length: 6, imagePath: 'assets/mobs/boss/warden.webp' },
    { word: 'skullking', displayName: 'Skull King', length: 10, imagePath: 'assets/mobs/boss/wither.png' },

    // Items (including former blocks)
    { word: 'axe', displayName: 'Axe', length: 3, imagePath: 'assets/items/axe.webp' },
    { word: 'bed', displayName: 'Bed', length: 3, imagePath: 'assets/items/bed.png' },
    { word: 'boat', displayName: 'Boat', length: 4, imagePath: 'assets/items/boat.png' },
    { word: 'book', displayName: 'Book', length: 4, imagePath: 'assets/items/book.webp' },
    { word: 'bow', displayName: 'Bow', length: 3, imagePath: 'assets/items/bow.png' },
    { word: 'bundle', displayName: 'Bundle', length: 6, imagePath: 'assets/items/bundle.png' },
    { word: 'cake', displayName: 'Cake', length: 4, imagePath: 'assets/items/cake.png' },
    { word: 'egg', displayName: 'Egg', length: 3, imagePath: 'assets/items/egg.png' },
    { word: 'hoe', displayName: 'Hoe', length: 3, imagePath: 'assets/items/hoe.webp' },
    { word: 'map', displayName: 'Map', length: 3, imagePath: 'assets/items/map.png' },
    { word: 'milk', displayName: 'Milk', length: 4, imagePath: 'assets/items/milk.png' },
    { word: 'tnt', displayName: 'TNT', length: 3, imagePath: 'assets/items/tnt.png' },
    { word: 'barrel', displayName: 'Barrel', length: 6, imagePath: 'assets/items/chests/barrel.png' },
    { word: 'chest', displayName: 'Chest', length: 5, imagePath: 'assets/items/chests/chest.webp' },
    { word: 'magicchest', displayName: 'Magic Chest', length: 11, imagePath: 'assets/items/chests/ender_chest.webp' },
    { word: 'shellbox', displayName: 'Shell Box', length: 9, imagePath: 'assets/items/chests/shulker_box.png' },
    {
        word: 'trapped_chest',
        displayName: 'Trapped Chest',
        length: 13,
        imagePath: 'assets/items/chests/trapped_chest.webp',
    },
    { word: 'dirt', displayName: 'Dirt', length: 4, imagePath: 'assets/items/dirt.png' },
    { word: 'door', displayName: 'Door', length: 4, imagePath: 'assets/items/door.png' },
    { word: 'ice', displayName: 'Ice', length: 3, imagePath: 'assets/items/ice.png' },
    { word: 'sand', displayName: 'Sand', length: 4, imagePath: 'assets/items/sand.png' },
    { word: 'wool', displayName: 'Wool', length: 4, imagePath: 'assets/items/wool.png' },
];

// Difficulty pools with overlapping character ranges.
// Pools 6 and 7 do not exist: getWordForDifficulty uses pool 5 for them.
export const WRITING_POOL_RANGES = {
    1: [3, 5], // Easy
    2: [5, 7], // Normal
    3: [6, 8], // Medium
    4: [7, 10], // Hard
    5: [9, 15], // Expert
};

// Splits a word index into the five difficulty pools. An empty pool gets the whole index,
// so a small theme still has a word for every difficulty.
export const buildWritingPools = (wordIndex) =>
    Object.fromEntries(
        Object.entries(WRITING_POOL_RANGES).map(([pool, [min, max]]) => {
            const words = wordIndex.filter((w) => w.length >= min && w.length <= max);
            return [pool, words.length > 0 ? words : [...wordIndex]];
        }),
    );

export const WRITING_DIFFICULTY_POOLS = buildWritingPools(WRITING_WORD_INDEX);

// Writing items organized by length for quick lookup

export const WRITING_ITEMS_BY_LENGTH = {
    3: SPELLING_ITEMS.filter((i) => i.length === 3),
    4: SPELLING_ITEMS.filter((i) => i.length === 4),
    5: SPELLING_ITEMS.filter((i) => i.length === 5),
    6: SPELLING_ITEMS.filter((i) => i.length === 6),
    7: SPELLING_ITEMS.filter((i) => i.length === 7),
    8: SPELLING_ITEMS.filter((i) => i.length === 8),
    9: SPELLING_ITEMS.filter((i) => i.length >= 9),
};

export const HOMOPHONES = {
    SEE: ['SEA', 'C'],
    TO: ['TWO', 'TOO', '2'],
    FOR: ['FOUR', '4'],
    SUN: ['SON'],
    RED: ['READ'],
    NO: ['KNOW'],
    ARE: ['R', 'OUR'],
    YOU: ['U', 'EWE'],
    EYE: ['I'],
    BEE: ['BE'],
    ONE: ['WON', '1'],
};
