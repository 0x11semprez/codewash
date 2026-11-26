import { useState, useRef, useCallback, useEffect } from 'react';
import { SKILL_DATA, BASE_ASSETS, getTheme } from '../constants/gameData';
import {
    getRandomMob,
    getRandomFriendlyMob,
    getRandomMiniboss,
    getRandomBoss,
    getEncounterType,
    getMobForSkill,
    generateMathProblem,
    getReadingWord,
    getWordForDifficulty,
    calculateDamage,
    calculateMobHealth,
    calculateXPReward,
    calculateXPToLevel,
} from '../utils/gameUtils';
import { getRandomAura } from '../utils/mobDisplayUtils';
import {
    playClick,
    playDeath,
    playFail,
    playLevelUp,
    playNotification,
    playSuccessfulHit,
    playMobHurt,
    playMobDeath,
    playAchievement,
} from '../services/soundManager';
import { getNewlyUnlockedAchievements, getNewTierAchievements, addUniqueToArray } from '../utils/achievementUtils';

const BOSS_HEALING_ANIMATION_DURATION = 600;

// The writing game shows pictures from the active theme (theme.writingPools).
const generateChallenge = (type, diff, theme) => {
    if (type === 'math') return generateMathProblem(diff);
    if (type === 'patterns') return { type: 'patterns', question: 'Simon Says!', answer: 'WIN' };
    if (type === 'reading') {
        const word = getReadingWord(diff);
        return { type, question: word, answer: word };
    }
    if (type === 'writing') {
        const wordData = getWordForDifficulty(diff, Math.random, theme.writingPools);
        const answer = wordData.displayName.toUpperCase();
        return { type, question: 'Spell it!', answer, images: [wordData.image], displayName: wordData.displayName };
    }
    if (type === 'memory') return { type: 'memory', question: 'Find Pairs!', answer: 'WIN' };
    return { type: 'manual', question: 'Task Complete?', answer: 'yes' };
};

export const useBattle = (skills, setSkills, stats, setStats, theme = getTheme()) => {
    const [battlingSkillId, setBattlingSkillId] = useState(null);
    const [battleDifficulty, setBattleDifficulty] = useState(null);
    const [challengeData, setChallengeData] = useState(null);
    const [playerHealth, setPlayerHealth] = useState(10);
    const [damageNumbers, setDamageNumbers] = useState([]);
    const [showDeathOverlay, setShowDeathOverlay] = useState(false);
    const [showLevelRestored, setShowLevelRestored] = useState(false);
    const [lootBox, setLootBox] = useState(null);
    const [bossHealing, setBossHealing] = useState(null);
    const [achievementToast, setAchievementToast] = useState(null);
    const pendingAchievementChecksRef = useRef([]);
    const challengeDataRef = useRef(null);
    const damageIdRef = useRef(0);

    useEffect(() => {
        challengeDataRef.current = challengeData;
    }, [challengeData]);
    useEffect(() => {
        if (lootBox) setTimeout(() => setLootBox(null), 4000);
    }, [lootBox]);
    useEffect(() => {
        if (achievementToast) setTimeout(() => setAchievementToast(null), 6000);
    }, [achievementToast]);

    const checkAchievements = useCallback((oldStats, newStats, oldSkills, newSkills) => {
        const newlyUnlocked = getNewlyUnlockedAchievements(oldStats, newStats, oldSkills, newSkills);
        const newTiers = getNewTierAchievements(oldStats, newStats, oldSkills, newSkills);
        if (newlyUnlocked.length > 0) {
            setAchievementToast({ achievementId: newlyUnlocked[0], tierIndex: null });
            playAchievement();
        } else if (newTiers.length > 0) {
            setAchievementToast({ achievementId: newTiers[0].achievementId, tierIndex: newTiers[0].tierIndex });
            playAchievement();
        }
    }, []);

    useEffect(() => {
        const pendingChecks = pendingAchievementChecksRef.current;
        pendingAchievementChecksRef.current = [];
        pendingChecks.forEach(({ oldStats, newStats, oldSkills, newSkills }) => {
            checkAchievements(oldStats, newStats, oldSkills, newSkills);
        });
    }, [stats, checkAchievements]);

    const handleSuccessHit = (skillId, isWrong) => {
        if (isWrong === 'WRONG') {
            if (battlingSkillId) {
                setSkills((prev) => {
                    const current = prev[battlingSkillId];
                    if (getEncounterType(current.level) === 'boss') {
                        setBossHealing(battlingSkillId);
                        setTimeout(() => setBossHealing(null), BOSS_HEALING_ANIMATION_DURATION);
                        playFail();
                        return { ...prev, [battlingSkillId]: { ...current, mobHealth: current.mobMaxHealth } };
                    }
                    setPlayerHealth((h) => {
                        const newH = h - 1;
                        if (newH <= 0) {
                            playDeath();
                            setShowDeathOverlay(true);
                            setStats((prevStats) => {
                                const newStats = { ...prevStats, totalDeaths: (prevStats.totalDeaths || 0) + 1 };
                                pendingAchievementChecksRef.current.push({
                                    oldStats: prevStats,
                                    newStats,
                                    oldSkills: prev,
                                    newSkills: prev,
                                });
                                return newStats;
                            });
                            setTimeout(() => {
                                setBattlingSkillId(null);
                                setShowDeathOverlay(false);
                            }, 2000);
                            return 10;
                        }
                        playFail();
                        return newH;
                    });
                    if (playerHealth <= 1) {
                        const newLevel = Math.max(1, current.level - 1);
                        const currentDiff = current.difficulty || 1;
                        return {
                            ...prev,
                            [battlingSkillId]: {
                                ...current,
                                level: newLevel,
                                lostLevel: current.level > 1,
                                recoveryDifficulty: Math.max(1, currentDiff - 1),
                            },
                        };
                    }
                    return prev;
                });
            } else {
                setPlayerHealth((h) => Math.max(0, h - 1));
            }
            return;
        }

        if (!skillId) return;
        const skillConfig = SKILL_DATA.find((s) => s.id === skillId);
        let skillDifficulty = 1;

        setSkills((prev) => {
            const current = prev[skillId];
            skillDifficulty = current.difficulty || 1;
            const playerLevel = current.level;
            // The creature on screen, as the theme shows it. Sounds and stats use this name.
            const currentMobName = getMobForSkill(skillConfig, current, Math.random, theme);
            const damage = calculateDamage(playerLevel, skillDifficulty);
            const encounterType = getEncounterType(playerLevel);
            const isMiniboss = encounterType === 'miniboss' && skillConfig.id !== 'cleaning';
            const isInstantDefeat = skillConfig.id === 'cleaning' || skillConfig.id === 'memory' || isMiniboss;
            const actualDamage = isInstantDefeat ? current.mobHealth : damage;
            const willDefeatMob = current.mobHealth - actualDamage <= 0;

            if (skillConfig.id !== 'memory') {
                const id = ++damageIdRef.current;
                setDamageNumbers((prevNumbers) => [
                    ...prevNumbers,
                    { id, skillId, val: actualDamage, x: Math.random() * 100 - 50, y: Math.random() * 50 - 25 },
                ]);
                setTimeout(() => setDamageNumbers((prevNumbers) => prevNumbers.filter((n) => n.id !== id)), 800);
                if (willDefeatMob) {
                    playMobDeath(currentMobName);
                } else {
                    playMobHurt(currentMobName);
                }
                playSuccessfulHit();
            }

            let newMobHealth = current.mobHealth - actualDamage;
            let newLevel = current.level;
            let newXp = current.xp;
            let leveledUp = false;
            let newMob = current.currentMob;
            let newDifficulty = current.difficulty || 1;
            let newBadges = [...(current.earnedBadges || [])];
            let newMobMaxHealth = current.mobMaxHealth;
            let newLostLevel = current.lostLevel;
            let newRecoveryDifficulty = current.recoveryDifficulty;
            let newMemoryMob = current.memoryMob;
            let newPatternMob = current.patternMob;
            let newMiniboss = current.currentMiniboss;
            let newBoss = current.currentBoss;
            let newReadingMob = current.readingMob;
            let newMathMob = current.mathMob;
            let newWritingMob = current.writingMob;
            let newReadingMobAura = current.readingMobAura;
            let newMathMobAura = current.mathMobAura;
            let newWritingMobAura = current.writingMobAura;
            let newPatternMobAura = current.patternMobAura;
            let newMinibossAura = current.currentMinibossAura;
            let newBossAura = current.currentBossAura;

            const totalXPReward = calculateXPReward(skillDifficulty, playerLevel);
            const effectiveDamage = isInstantDefeat ? current.mobMaxHealth : damage;
            const hitsToKill = Math.ceil(current.mobMaxHealth / effectiveDamage);
            const xpPerHit = Math.floor(totalXPReward / hitsToKill);
            const willDefeatMobInUpdate = newMobHealth <= 0;
            if (!willDefeatMobInUpdate) newXp += xpPerHit;

            if (newMobHealth <= 0) {
                const hitsDealt = Math.ceil((current.mobMaxHealth - current.mobHealth) / effectiveDamage);
                const xpAlreadyAwarded = hitsDealt * xpPerHit;
                newXp += totalXPReward - xpAlreadyAwarded;

                setStats((prevStats) => {
                    const newStats = { ...prevStats };
                    newStats.battlesThisSession = (newStats.battlesThisSession || 0) + 1;
                    if (encounterType === 'boss') {
                        newStats.totalBossesDefeated = (newStats.totalBossesDefeated || 0) + 1;
                        newStats.uniqueBossesDefeated = addUniqueToArray(
                            newStats.uniqueBossesDefeated || [],
                            currentMobName,
                        );
                    } else if (encounterType === 'miniboss') {
                        newStats.totalMinibossesDefeated = (newStats.totalMinibossesDefeated || 0) + 1;
                        newStats.uniqueMinibossesDefeated = addUniqueToArray(
                            newStats.uniqueMinibossesDefeated || [],
                            currentMobName,
                        );
                    } else {
                        newStats.totalMobsDefeated = (newStats.totalMobsDefeated || 0) + 1;
                        newStats.uniqueMobsDefeated = addUniqueToArray(
                            newStats.uniqueMobsDefeated || [],
                            currentMobName,
                        );
                    }
                    pendingAchievementChecksRef.current.push({
                        oldStats: prevStats,
                        newStats,
                        oldSkills: prev,
                        newSkills: { ...prev, [skillId]: { ...current, level: newLevel } },
                    });
                    return newStats;
                });

                if (skillConfig.id === 'memory') newMemoryMob = getRandomFriendlyMob(Math.random, theme);
                if (skillConfig.id === 'patterns') {
                    newPatternMob = getRandomMob(current.currentMob, Math.random, theme);
                    newPatternMobAura = getRandomAura();
                }
                const combatUpdates = {
                    reading: () => {
                        newReadingMob = getRandomMob(current.readingMob, Math.random, theme);
                        newReadingMobAura = getRandomAura();
                    },
                    math: () => {
                        newMathMob = getRandomMob(current.mathMob, Math.random, theme);
                        newMathMobAura = getRandomAura();
                    },
                    writing: () => {
                        newWritingMob = getRandomMob(current.writingMob, Math.random, theme);
                        newWritingMobAura = getRandomAura();
                    },
                };
                if (combatUpdates[skillConfig.id]) combatUpdates[skillConfig.id]();
                if (getEncounterType(current.level) === 'miniboss') {
                    newMiniboss = getRandomMiniboss(Math.random, theme);
                    newMinibossAura = getRandomAura();
                }
                if (getEncounterType(current.level) === 'boss') {
                    newBoss = getRandomBoss(Math.random, theme);
                    newBossAura = getRandomAura();
                }

                if (newLostLevel) {
                    newLevel += 1;
                    newLostLevel = false;
                    newRecoveryDifficulty = null;
                    setShowLevelRestored(true);
                    setTimeout(() => setShowLevelRestored(false), 2000);
                    playNotification();
                }

                const xpToLevel = calculateXPToLevel(newDifficulty, newLevel);
                if (newXp >= xpToLevel) {
                    const levelsGained = Math.floor(newXp / xpToLevel);
                    const oldLevel = newLevel;
                    newLevel += levelsGained;
                    newXp = newXp % xpToLevel;
                    leveledUp = true;
                    if (skillConfig.id !== 'cleaning') {
                        for (let lvl = oldLevel; lvl < newLevel; lvl++) {
                            if (lvl % 20 === 0 && lvl > 0) {
                                const newTier = Math.floor(lvl / 20);
                                if (newDifficulty < 7) newDifficulty++;
                                if (!newBadges.includes(newTier) && newTier <= 7) {
                                    newBadges.push(newTier);
                                    setLootBox({
                                        level: lvl,
                                        skillName: theme.skills[skillId].fantasyName,
                                        item: 'New Rank!',
                                        img: BASE_ASSETS.badges.Wood,
                                    });
                                    playNotification();
                                }
                            }
                        }
                    }
                    if (newLevel % 20 !== 0 && (newLevel - 1) % 20 !== 0) {
                        newMob = getRandomMob(current.currentMob, Math.random, theme);
                    }
                    if (leveledUp) playLevelUp();
                }
                newMobMaxHealth = calculateMobHealth(newDifficulty);
                newMobHealth = newMobMaxHealth;
                if (newLevel % 20 !== 0) newMob = getRandomMob(current.currentMob, Math.random, theme);
            }

            return {
                ...prev,
                [skillId]: {
                    ...current,
                    level: newLevel,
                    xp: newXp,
                    currentMob: newMob,
                    difficulty: newDifficulty,
                    earnedBadges: newBadges,
                    mobHealth: newMobHealth,
                    mobMaxHealth: newMobMaxHealth,
                    lostLevel: newLostLevel,
                    recoveryDifficulty: newRecoveryDifficulty,
                    memoryMob: newMemoryMob,
                    patternMob: newPatternMob,
                    currentMiniboss: newMiniboss,
                    currentBoss: newBoss,
                    readingMob: newReadingMob,
                    mathMob: newMathMob,
                    writingMob: newWritingMob,
                    readingMobAura: newReadingMobAura,
                    mathMobAura: newMathMobAura,
                    writingMobAura: newWritingMobAura,
                    patternMobAura: newPatternMobAura,
                    currentMinibossAura: newMinibossAura,
                    currentBossAura: newBossAura,
                },
            };
        });

        if (skillConfig.hasChallenge && skillConfig.id !== 'memory') {
            const challengeDiff = battleDifficulty || skillDifficulty;
            setChallengeData(generateChallenge(skillConfig.challengeType, challengeDiff, theme));
            if (skillConfig.challengeType === 'reading' && spokenTextSetterRef.current) {
                spokenTextSetterRef.current('');
            }
        } else if (skillConfig.id === 'memory') {
            setBattlingSkillId(null);
            setBattleDifficulty(null);
        }
    };

    const spokenTextSetterRef = useRef(null);
    const setSpokenTextSetter = (fn) => {
        spokenTextSetterRef.current = fn;
    };

    const startBattle = (id, startVoiceListener, startBGM) => {
        const skill = SKILL_DATA.find((s) => s.id === id);
        setBattlingSkillId(id);
        const currentDiff = skills[id].difficulty || 1;
        const playerLevel = skills[id].level;
        const encounterType = getEncounterType(playerLevel);
        const challengeDiff = encounterType === 'miniboss' ? Math.min(7, currentDiff + 1) : currentDiff;
        setBattleDifficulty(challengeDiff);
        setChallengeData(generateChallenge(skill.challengeType, challengeDiff, theme));
        playClick();
        if (startBGM) startBGM();
        if (skill.challengeType === 'reading' && window.webkitSpeechRecognition && startVoiceListener) {
            startVoiceListener(id, id);
        }
    };

    const endBattle = (stopVoiceRecognition) => {
        setBattlingSkillId(null);
        setBattleDifficulty(null);
        setChallengeData(null);
        if (stopVoiceRecognition) stopVoiceRecognition();
        playClick();
    };

    const handlePhantomLevelAward = (skillId) => {
        if (!skillId) return;
        playLevelUp();
        setSkills((prev) => {
            const current = prev[skillId];
            return { ...prev, [skillId]: { ...current, level: current.level + 1 } };
        });
        const skillConfig = SKILL_DATA.find((s) => s.id === skillId);
        if (skillConfig) {
            setLootBox({
                level: skills[skillId].level + 1,
                skillName: theme.skills[skillId].fantasyName,
                item: 'Bonus Level!',
                img: theme.bonusCreature,
            });
            playNotification();
        }
    };

    return {
        battlingSkillId,
        battleDifficulty,
        challengeData,
        challengeDataRef,
        playerHealth,
        damageNumbers,
        showDeathOverlay,
        showLevelRestored,
        lootBox,
        bossHealing,
        achievementToast,
        setAchievementToast,
        handleSuccessHit,
        startBattle,
        endBattle,
        handlePhantomLevelAward,
        setSpokenTextSetter,
    };
};
