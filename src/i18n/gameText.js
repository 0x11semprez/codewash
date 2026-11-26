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

// Theme text. A theme JSON can hold a "translations" block per language (see docs/features/themes.md).
// The order is: the theme's text in the current language, the theme's own text, then the dictionary.

// Name of a theme in the current language.
export const themeName = (theme, language) => theme?.translations?.[language]?.name || theme?.name;

// Skill text of a theme: field is name, fantasyName, actionName or taskDescription.
export const themeSkillText = (t, language, theme, skillId, field) =>
    theme?.translations?.[language]?.skills?.[skillId]?.[field] ||
    theme?.ownSkills?.[skillId]?.[field] ||
    skillText(t, skillId, field);

// Label of a pattern piece. The default pieces have their names in the dictionaries.
export const pieceLabel = (t, language, theme, name) => {
    if (!theme?.ownPatternPieces) return t(`axolotls.${name}`);
    return theme.translations?.[language]?.patternPieces?.[name] || name;
};
