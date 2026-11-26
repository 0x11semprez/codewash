// Small helpers that build dictionary keys for game data (achievements, skills, mobs).
// Ids stay in the constants files; the visible text lives in the dictionaries.

// Name of an achievement, or of its current tier when tierIndex >= 0.
export const achievementName = (t, achievement, tierIndex = -1) =>
    achievement.isTiered && tierIndex >= 0
        ? t(`achievements.${achievement.id}.tiers.${tierIndex}`)
        : t(`achievements.${achievement.id}.name`);

export const achievementDescription = (t, achievement) => t(`achievements.${achievement.id}.description`);

// Skill text: field is name, fantasyName, actionName or taskDescription.
export const skillText = (t, skillId, field) => t(`skills.${skillId}.${field}`);

// Mob names are Minecraft proper nouns and stay as they are; only the aura adjective is translated.
export const mobNameWithAura = (t, mob, aura) => (aura ? t('mobs.withAura', { mob, aura: t(`auras.${aura}`) }) : mob);
