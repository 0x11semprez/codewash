import { BASE_ASSETS } from '../../../shared/constants/assets';

export const DIFFICULTY_CONTENT = {
    reading: {
        1: { charLength: 3 },
        2: { charLength: 4 },
        3: { charLength: 5 },
        4: { charLength: 6 },
        5: { charLength: 7 },
        6: { charLength: 8 },
        7: { useFunnyWords: true }
    },
    math: {
        1: { operations: ['+'], range: [0, 9], description: 'Single-digit addition (0-9)' },
        2: { operations: ['+'], range: [0, 20], description: 'Addition (0-20)' },
        3: { operations: ['+', '-'], range: [0, 20], description: 'Addition and subtraction (0-20)' },
        4: { operations: ['+', '-', '*'], range: [0, 20], multiplyRange: [1, 10], description: 'Add, subtract, multiply (0-20)' },
        5: { operations: ['+', '-', '*', '/'], range: [0, 20], divisionRange: [1, 10], description: 'All operations (0-20)' },
        6: { pemdas: true, range: [0, 20], description: 'Order of operations (0-20)' },
        7: { nightmare: true, description: 'Nightmare complexity' }
    },
    writing: {
        1: { targetLength: 3 },
        2: { targetLength: 4 },
        3: { targetLength: 5 },
        4: { targetLength: 6 },
        5: { targetLength: 7 },
        6: { targetLength: 8 },
        7: { targetLength: 9 }
    },
    patterns: {
        1: { axolotlCount: 2 },
        2: { axolotlCount: 3 },
        3: { axolotlCount: 4 },
        4: { axolotlCount: 5 },
        5: { axolotlCount: 6 },
        6: { axolotlCount: 7 },
        7: { axolotlCount: 8, resetSequence: true }
    },
    memory: {
        1: { pairs: 3, gridCols: 3 },
        2: { pairs: 4, gridCols: 4 },
        3: { pairs: 5, gridCols: 5 },
        4: { pairs: 6, gridCols: 4 },
        5: { pairs: 7, gridCols: 4 },
        6: { pairs: 8, gridCols: 4 },
        7: { pairs: 10, gridCols: 5 }
    },
    cleaning: {
        1: { exempt: true },
        2: { exempt: true },
        3: { exempt: true },
        4: { exempt: true },
        5: { exempt: true },
        6: { exempt: true },
        7: { exempt: true }
    }
};

export const DIFFICULTY_IMAGES = {
    1: 'assets/difficulty/Difficulty_1.svg',
    2: 'assets/difficulty/Difficulty_2.svg',
    3: 'assets/difficulty/Difficulty_3.svg',
    4: 'assets/difficulty/Difficulty_4.svg',
    5: 'assets/difficulty/Difficulty_5.svg',
    6: 'assets/difficulty/Difficulty_6.svg',
    7: 'assets/difficulty/Difficulty_7.svg'
};

export const SKILL_DATA = [
    { id: 'reading', name: 'Reading', class: 'Reading', fantasyName: 'Enchanting Table', actionName: 'Enchant!', taskDescription: "Speak the ancient words to channel enchantments and vanquish your foes!", img: BASE_ASSETS.skillIcons['Reading'], colorStyle: { background: 'linear-gradient(to bottom, #7e22ce, #3730a3)' }, accent: 'text-purple-400', boss: 'Ender Dragon', hasChallenge: true, challengeType: 'reading', mobOffset: 0 },
    { id: 'math', name: 'Math', class: 'Math', fantasyName: 'Redstone', actionName: 'Calculate!', taskDescription: "Power up your redstone circuits to activate traps and outsmart hostile mobs!", img: BASE_ASSETS.skillIcons['Math'], colorStyle: { background: 'linear-gradient(to bottom, #b91c1c, #9a3412)' }, accent: 'text-red-400', boss: 'The Wither', hasChallenge: true, challengeType: 'math', mobOffset: 4 },
    { id: 'writing', name: 'Writing', class: 'Spelling', fantasyName: 'Crafting Table', actionName: 'Craft!', taskDescription: "Spell out the recipe to forge legendary weapons and armor!", img: BASE_ASSETS.skillIcons['Writing'], colorStyle: { background: 'linear-gradient(to bottom, #0369a1, #1e40af)' }, accent: 'text-cyan-400', boss: 'The Warden', hasChallenge: true, challengeType: 'writing', mobOffset: 8 },
    { id: 'cleaning', name: 'Cleaning', class: 'Cleaning', fantasyName: 'Chest Management', actionName: 'Organize!', taskDescription: "Sort your loot and prepare your inventory for the adventures ahead!", img: BASE_ASSETS.skillIcons['Cleaning'], colorStyle: { background: 'linear-gradient(to bottom, #059669, #15803d)' }, accent: 'text-emerald-400', boss: 'Ender Chest', hasChallenge: true, challengeType: 'cleaning', mobOffset: 12 },
    { id: 'memory', name: 'Memory', class: 'Memory', fantasyName: 'Match n\' Hatch', actionName: 'Match!', taskDescription: "Find the matching pairs to hatch rare creatures for your farm!", img: BASE_ASSETS.skillIcons['Memory'], colorStyle: { background: 'linear-gradient(to bottom, #db2777, #be123c)' }, accent: 'text-pink-400', boss: 'Axolotl Mascot', hasChallenge: true, challengeType: 'memory', mobOffset: 16 },
    { id: 'patterns', name: 'Patterns', class: 'Patterns', fantasyName: 'Logic Building', actionName: 'Solve!', taskDescription: "Decipher the sequence to unlock ancient mechanisms and hidden treasures!", img: BASE_ASSETS.skillIcons['Patterns'], colorStyle: { background: 'linear-gradient(to bottom, #ea580c, #c2410c)' }, accent: 'text-orange-400', boss: 'Iron Golem', hasChallenge: true, challengeType: 'patterns', mobOffset: 20 },
];
