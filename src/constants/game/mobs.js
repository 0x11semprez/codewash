// Mobs, chests, bosses and minibosses, with their sprite paths.
export const FRIENDLY_MOBS = {
    Allay: 'assets/mobs/friendly/allay.gif',
    Armadillo: 'assets/mobs/friendly/armadillo.png',
    Bunny: 'assets/mobs/friendly/bunny.png',
    Camel: 'assets/mobs/friendly/camel.gif',
    Cat: 'assets/mobs/friendly/cat.png',
    Chicken: 'assets/mobs/friendly/chicken.png',
    'Copper Golem': 'assets/mobs/friendly/coppergolem.png',
    Cow: 'assets/mobs/friendly/cow.png',
    Fish: 'assets/mobs/friendly/fish.png',
    Frog: 'assets/mobs/friendly/frog.gif',
    'Glow Squid': 'assets/mobs/friendly/glowsquid.gif',
    Goat: 'assets/mobs/friendly/goat.png',
    Horse: 'assets/mobs/friendly/horse.png',
    'Iron Golem': 'assets/mobs/friendly/irongolem.png',
    Mooshroom: 'assets/mobs/friendly/mooshroom.png',
    Nautilus: 'assets/mobs/friendly/nautilus.gif',
    Panda: 'assets/mobs/friendly/panda.png',
    Pig: 'assets/mobs/friendly/pig.png',
    'Polar Bear': 'assets/mobs/friendly/polarbear.png',
    Sheep: 'assets/mobs/friendly/sheep.png',
    Sniffer: 'assets/mobs/friendly/sniffer.gif',
    'Snow Golem': 'assets/mobs/friendly/snowgolem.png',
    Squid: 'assets/mobs/friendly/squid.gif',
    Strider: 'assets/mobs/friendly/strider.gif',
    Turtle: 'assets/mobs/friendly/turtle.png',
    Wolf: 'assets/mobs/friendly/wolf.png',
};

export const HOSTILE_MOBS = {
    Blaze: 'assets/mobs/hostile/blaze.gif',
    Bogged: 'assets/mobs/hostile/bogged.png',
    Breeze: 'assets/mobs/hostile/breeze.webp',
    Creeper: 'assets/mobs/hostile/creeper.png',
    Drowned: 'assets/mobs/hostile/drowned.png',
    Enderman: 'assets/mobs/hostile/enderman.png',
    Evoker: 'assets/mobs/hostile/evoker.png',
    Ghast: 'assets/mobs/hostile/ghast.gif',
    Guardian: 'assets/mobs/hostile/guardian.gif',
    Hoglin: 'assets/mobs/hostile/hoglin.png',
    'Magma Cube': 'assets/mobs/hostile/magmacube.png',
    Parched: 'assets/mobs/hostile/parched.png',
    Phantom: 'assets/mobs/hostile/phantom.gif',
    Piglin: 'assets/mobs/hostile/piglin.png',
    Pillager: 'assets/mobs/hostile/pillager.png',
    Skeleton: 'assets/mobs/hostile/skeleton.png',
    Slime: 'assets/mobs/hostile/slime.png',
    Spider: 'assets/mobs/hostile/spider.png',
    Witch: 'assets/mobs/hostile/witch.png',
    Zombie: 'assets/mobs/hostile/zombie.png',
};

export const CHEST_BLOCKS = {
    Chest: 'assets/items/chests/chest.gif',
    'Trapped Chest': 'assets/items/chests/trapped_chest.gif',
    Barrel: 'assets/items/chests/barrel.png',
    Bundle: 'assets/items/bundle.png',
    'Shulker Box': 'assets/items/chests/shulker_box.png',
    'Ender Chest': 'assets/items/chests/ender_chest.gif',
};

// Special chests that appear at milestone levels (used for cleaning skill)

export const SPECIAL_CHESTS = ['Ender Chest', 'Shulker Box'];

export const BOSS_MOBS = {
    'Ender Dragon': 'assets/mobs/boss/enderdragon.gif',
    Herobrine: 'assets/mobs/boss/Herobrine.png',
    Warden: 'assets/mobs/boss/warden.gif',
    Wither: 'assets/mobs/boss/wither.png',
};

export const MINIBOSS_MOBS = {
    Creaking: 'assets/mobs/miniboss/creaking.png',
    'Elder Guardian': 'assets/mobs/miniboss/elderguardian.gif',
    Ravager: 'assets/mobs/miniboss/ravager.png',
    'Wither Skeleton': 'assets/mobs/miniboss/witherskeleton.png',
};

// Difficulty content framework - 7 tiers of content per skill
// This structure holds different configurations for each difficulty level

export const MOB_KEYS = Object.keys(HOSTILE_MOBS);
