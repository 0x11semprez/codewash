// Mobs, chests, bosses and minibosses, with their sprite paths.
export const FRIENDLY_MOBS = {
    'Sky Sprite': 'assets/mobs/friendly/allay.webp',
    Armadillo: 'assets/mobs/friendly/armadillo.png',
    Bunny: 'assets/mobs/friendly/bunny.png',
    Camel: 'assets/mobs/friendly/camel.webp',
    Cat: 'assets/mobs/friendly/cat.png',
    Chicken: 'assets/mobs/friendly/chicken.png',
    'Copper Golem': 'assets/mobs/friendly/coppergolem.png',
    Cow: 'assets/mobs/friendly/cow.png',
    Fish: 'assets/mobs/friendly/fish.png',
    Frog: 'assets/mobs/friendly/frog.webp',
    'Glow Squid': 'assets/mobs/friendly/glowsquid.webp',
    Goat: 'assets/mobs/friendly/goat.png',
    Horse: 'assets/mobs/friendly/horse.png',
    'Iron Golem': 'assets/mobs/friendly/irongolem.png',
    'Mushroom Cow': 'assets/mobs/friendly/mooshroom.png',
    Nautilus: 'assets/mobs/friendly/nautilus.webp',
    Panda: 'assets/mobs/friendly/panda.png',
    Pig: 'assets/mobs/friendly/pig.png',
    'Polar Bear': 'assets/mobs/friendly/polarbear.png',
    Sheep: 'assets/mobs/friendly/sheep.png',
    Sniffer: 'assets/mobs/friendly/sniffer.webp',
    'Snow Golem': 'assets/mobs/friendly/snowgolem.png',
    Squid: 'assets/mobs/friendly/squid.webp',
    Strider: 'assets/mobs/friendly/strider.webp',
    Turtle: 'assets/mobs/friendly/turtle.png',
    Wolf: 'assets/mobs/friendly/wolf.png',
};

export const HOSTILE_MOBS = {
    Blaze: 'assets/mobs/hostile/blaze.webp',
    'Swamp Archer': 'assets/mobs/hostile/bogged.png',
    Breeze: 'assets/mobs/hostile/breeze.webp',
    Boomer: 'assets/mobs/hostile/creeper.png',
    Drowned: 'assets/mobs/hostile/drowned.png',
    'Shadow Walker': 'assets/mobs/hostile/enderman.png',
    Sorcerer: 'assets/mobs/hostile/evoker.png',
    'Sky Ghost': 'assets/mobs/hostile/ghast.webp',
    Guardian: 'assets/mobs/hostile/guardian.webp',
    'Tusk Beast': 'assets/mobs/hostile/hoglin.png',
    'Lava Cube': 'assets/mobs/hostile/magmacube.png',
    Parched: 'assets/mobs/hostile/parched.png',
    Phantom: 'assets/mobs/hostile/phantom.webp',
    'Pig Warrior': 'assets/mobs/hostile/piglin.png',
    Pillager: 'assets/mobs/hostile/pillager.png',
    Skeleton: 'assets/mobs/hostile/skeleton.png',
    Slime: 'assets/mobs/hostile/slime.png',
    Spider: 'assets/mobs/hostile/spider.png',
    Witch: 'assets/mobs/hostile/witch.png',
    Zombie: 'assets/mobs/hostile/zombie.png',
};

export const CHEST_BLOCKS = {
    Chest: 'assets/items/chests/chest.webp',
    'Trapped Chest': 'assets/items/chests/trapped_chest.webp',
    Barrel: 'assets/items/chests/barrel.png',
    Bundle: 'assets/items/bundle.png',
    'Shell Box': 'assets/items/chests/shulker_box.png',
    'Magic Chest': 'assets/items/chests/ender_chest.webp',
};

// Special chests that appear at milestone levels (used for cleaning skill)

export const SPECIAL_CHESTS = ['Magic Chest', 'Shell Box'];

export const BOSS_MOBS = {
    'Void Dragon': 'assets/mobs/boss/enderdragon.webp',
    'Dark Hero': 'assets/mobs/boss/darkhero.png',
    Warden: 'assets/mobs/boss/warden.webp',
    'Skull King': 'assets/mobs/boss/wither.png',
};

export const MINIBOSS_MOBS = {
    'Tree Spirit': 'assets/mobs/miniboss/creaking.png',
    'Elder Guardian': 'assets/mobs/miniboss/elderguardian.webp',
    Ravager: 'assets/mobs/miniboss/ravager.png',
    'Dark Skeleton': 'assets/mobs/miniboss/witherskeleton.png',
};

// Difficulty content framework - 7 tiers of content per skill
// This structure holds different configurations for each difficulty level

export const MOB_KEYS = Object.keys(HOSTILE_MOBS);

// Old names of the default creatures, renamed to neutral names (see docs/adr/013).
// migrateStorage() uses this list to update saved games, so progress is kept.
export const MOB_NAME_RENAMES = {
    Creeper: 'Boomer',
    Enderman: 'Shadow Walker',
    Ghast: 'Sky Ghost',
    Hoglin: 'Tusk Beast',
    'Magma Cube': 'Lava Cube',
    Piglin: 'Pig Warrior',
    Bogged: 'Swamp Archer',
    Evoker: 'Sorcerer',
    'Ender Dragon': 'Void Dragon',
    Herobrine: 'Dark Hero',
    'Wither Skeleton': 'Dark Skeleton',
    Wither: 'Skull King',
    Creaking: 'Tree Spirit',
    Allay: 'Sky Sprite',
    Mooshroom: 'Mushroom Cow',
    'Ender Chest': 'Magic Chest',
    'Shulker Box': 'Shell Box',
};
