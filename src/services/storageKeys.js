// Every localStorage key of the game is written here and nowhere else.
// To rename a key, add the old and new names to migrateStorage() so saved data moves with it.

import { MOB_NAME_RENAMES } from '../constants/game/mobs';

export const STORAGE_KEYS = {
    currentProfile: 'currentProfile_v1',
    profileNames: 'heroProfileNames_v1',
    parentStatus: 'heroParentStatus_v1',
    phantomLastSpawn: 'phantomEvent_lastSpawn_v1',
    legacySkills: 'heroSkills_v23',
    language: 'language_v1',
    errorLog: 'errorLog_v1',
};

export const skillsKey = (profileId) => `heroSkills_v23_p${profileId}`;
export const borderEffectKey = (profileId) => `borderEffect_p${profileId}`;
export const borderColorKey = (profileId) => `borderColor_p${profileId}`;

// Moves a saved value to a new key. It never overwrites a value that already exists under the new key.
export const migrateKey = (oldKey, newKey) => {
    try {
        const value = localStorage.getItem(oldKey);
        if (value === null || localStorage.getItem(newKey) !== null) return false;
        localStorage.setItem(newKey, value);
        localStorage.removeItem(oldKey);
        return true;
    } catch (error) {
        console.warn(`[storage] Cannot move "${oldKey}" to "${newKey}":`, error);
        return false;
    }
};

// The game has three profiles. Each one has its own save.
export const PROFILE_IDS = [1, 2, 3];

// Themes renamed to neutral names (see docs/adr/013). An old save keeps working with the new theme.
export const THEME_ID_RENAMES = { minecraft: 'blocks', pokemon: 'monsters', kpop: 'idols' };

// Fields of a skill save that hold a creature name.
const CREATURE_FIELDS = [
    'currentMob',
    'readingMob',
    'mathMob',
    'writingMob',
    'patternMob',
    'memoryMob',
    'currentMiniboss',
    'currentBoss',
];

// Stats that list the names of defeated creatures. Achievements read them.
const DEFEATED_LISTS = ['uniqueMobsDefeated', 'uniqueMinibossesDefeated', 'uniqueBossesDefeated'];

const renameCreature = (name) => MOB_NAME_RENAMES[name] || name;

// Updates one parsed save to the current theme ids and creature names.
// Returns the same object when nothing changes, so the caller can skip the write.
export const migrateSaveData = (save) => {
    if (!save || typeof save !== 'object' || Array.isArray(save)) return save;
    let changed = false;
    const next = { ...save };

    if (THEME_ID_RENAMES[save.theme]) {
        next.theme = THEME_ID_RENAMES[save.theme];
        changed = true;
    }

    // Old saves hold the skills at the top level, newer ones under "skills".
    const hasSkillsKey = save.skills && typeof save.skills === 'object';
    const skills = hasSkillsKey ? save.skills : save;
    const newSkills = {};
    Object.entries(skills).forEach(([skillId, skill]) => {
        // Skip values that are not skills, like "theme" in an old save.
        if (!skill || typeof skill !== 'object' || Array.isArray(skill)) return;
        const updated = { ...skill };
        CREATURE_FIELDS.forEach((field) => {
            if (typeof skill[field] === 'string' && MOB_NAME_RENAMES[skill[field]]) {
                updated[field] = renameCreature(skill[field]);
                changed = true;
            }
        });
        newSkills[skillId] = updated;
    });
    if (hasSkillsKey) next.skills = { ...save.skills, ...newSkills };
    else Object.assign(next, newSkills);

    if (save.stats && typeof save.stats === 'object') {
        const stats = { ...save.stats };
        DEFEATED_LISTS.forEach((list) => {
            if (!Array.isArray(stats[list]) || !stats[list].some((name) => MOB_NAME_RENAMES[name])) return;
            stats[list] = [...new Set(stats[list].map(renameCreature))];
            changed = true;
        });
        next.stats = stats;
    }

    return changed ? next : save;
};

// Rewrites the save of one profile with migrateSaveData. A save that cannot be read is left alone.
const migrateProfileSave = (profileId) => {
    try {
        const raw = localStorage.getItem(skillsKey(profileId));
        if (!raw) return;
        const save = JSON.parse(raw);
        const migrated = migrateSaveData(save);
        if (migrated !== save) localStorage.setItem(skillsKey(profileId), JSON.stringify(migrated));
    } catch (error) {
        console.warn(`[storage] Cannot update the save of profile ${profileId}:`, error);
    }
};

// Runs once at startup, before the game reads its saves.
export const migrateStorage = () => {
    migrateKey(STORAGE_KEYS.legacySkills, skillsKey(1));
    PROFILE_IDS.forEach(migrateProfileSave);
};
