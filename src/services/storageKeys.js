// Every localStorage key of the game is written here and nowhere else.
// To rename a key, add the old and new names to migrateStorage() so saved data moves with it.

export const STORAGE_KEYS = {
    currentProfile: 'currentProfile_v1',
    profileNames: 'heroProfileNames_v1',
    parentStatus: 'heroParentStatus_v1',
    phantomLastSpawn: 'phantomEvent_lastSpawn_v1',
    legacySkills: 'heroSkills_v23',
    language: 'language_v1',
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

// Runs once at startup, before the game reads its saves.
export const migrateStorage = () => {
    migrateKey(STORAGE_KEYS.legacySkills, skillsKey(1));
};
