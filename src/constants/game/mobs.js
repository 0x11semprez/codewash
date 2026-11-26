// Mobs, chests, bosses and minibosses, with their sprite paths.
export const FRIENDLY_MOBS = {
    Allay: 'assets/mobs/friendly/allay.webp',
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
    Mooshroom: 'assets/mobs/friendly/mooshroom.png',
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
    Bogged: 'assets/mobs/hostile/bogged.png',
    Breeze: 'assets/mobs/hostile/breeze.webp',
    Creeper: 'assets/mobs/hostile/creeper.png',
    Drowned: 'assets/mobs/hostile/drowned.png',
    Enderman: 'assets/mobs/hostile/enderman.png',
    Evoker: 'assets/mobs/hostile/evoker.png',
    Ghast: 'assets/mobs/hostile/ghast.webp',
    Guardian: 'assets/mobs/hostile/guardian.webp',
    Hoglin: 'assets/mobs/hostile/hoglin.png',
    'Magma Cube': 'assets/mobs/hostile/magmacube.png',
    Parched: 'assets/mobs/hostile/parched.png',
    Phantom: 'assets/mobs/hostile/phantom.webp',
    Piglin: 'assets/mobs/hostile/piglin.png',
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
    'Shulker Box': 'assets/items/chests/shulker_box.png',
    'Ender Chest': 'assets/items/chests/ender_chest.webp',
};

// Special chests that appear at milestone levels (used for cleaning skill)

export const SPECIAL_CHESTS = ['Ender Chest', 'Shulker Box'];

export const BOSS_MOBS = {
    'Ender Dragon': 'assets/mobs/boss/enderdragon.webp',
    Herobrine: 'assets/mobs/boss/Herobrine.png',
    Warden: 'assets/mobs/boss/warden.webp',
    Wither: 'assets/mobs/boss/wither.png',
};

export const MINIBOSS_MOBS = {
    Creaking: 'assets/mobs/miniboss/creaking.png',
    'Elder Guardian': 'assets/mobs/miniboss/elderguardian.webp',
    Ravager: 'assets/mobs/miniboss/ravager.png',
    'Wither Skeleton': 'assets/mobs/miniboss/witherskeleton.png',
};

// Difficulty content framework - 7 tiers of content per skill
// This structure holds different configurations for each difficulty level

export const MOB_KEYS = Object.keys(HOSTILE_MOBS);
