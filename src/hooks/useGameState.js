import { useState, useEffect, useRef } from 'react';
import React from 'react';
import {
    getRandomMob,
    getRandomFriendlyMob,
    getRandomMiniboss,
    getRandomBoss,
    calculateMobHealth,
} from '../utils/gameUtils';
import { getRandomAura } from '../utils/mobDisplayUtils';
import { SKILL_DATA } from '../constants/gameData';
import { getDefaultStats, isAchievementUnlocked } from '../utils/achievementUtils';
import { now as systemNow, today as getToday } from '../utils/clock';

const getStorageKey = (profileId) => `heroSkills_v23_p${profileId}`;

const loadSkills = (profileId) => {
    const initial = {};
    SKILL_DATA.forEach((skill) => {
        const initialDifficulty = 1;
        initial[skill.id] = {
            level: 1,
            xp: 0,
            currentMob: getRandomMob(null),
            difficulty: initialDifficulty,
            earnedBadges: [],
            mobHealth: calculateMobHealth(initialDifficulty),
            mobMaxHealth: calculateMobHealth(initialDifficulty),
            lostLevel: false,
            recoveryDifficulty: null,
            memoryMob: skill.id === 'memory' ? getRandomFriendlyMob() : null,
            patternMob: skill.id === 'patterns' ? getRandomMob(null) : null,
            currentMiniboss: getRandomMiniboss(),
            currentBoss: getRandomBoss(),
            readingMob: skill.id === 'reading' ? getRandomMob(null) : null,
            mathMob: skill.id === 'math' ? getRandomMob(null) : null,
            writingMob: skill.id === 'writing' ? getRandomMob(null) : null,
            readingMobAura: skill.id === 'reading' ? getRandomAura() : null,
            mathMobAura: skill.id === 'math' ? getRandomAura() : null,
            writingMobAura: skill.id === 'writing' ? getRandomAura() : null,
            patternMobAura: skill.id === 'patterns' ? getRandomAura() : null,
            currentMinibossAura: getRandomAura(),
            currentBossAura: getRandomAura(),
        };
    });
    let saved = localStorage.getItem(getStorageKey(profileId));
    if (!saved && profileId === 1) saved = localStorage.getItem('heroSkills_v23');
    try {
        if (saved) {
            const parsed = JSON.parse(saved);
            const data = parsed.skills || parsed;
            Object.keys(data).forEach((key) => {
                initial[key] = { ...initial[key], ...data[key] };
                if (typeof initial[key].difficulty !== 'number') initial[key].difficulty = 1;
                if (!Array.isArray(initial[key].earnedBadges)) initial[key].earnedBadges = [];
                if (typeof initial[key].mobHealth !== 'number') {
                    const diff = initial[key].difficulty || 1;
                    initial[key].mobHealth = calculateMobHealth(diff);
                    initial[key].mobMaxHealth = calculateMobHealth(diff);
                }
                if (typeof initial[key].lostLevel !== 'boolean') initial[key].lostLevel = false;
                if (initial[key].recoveryDifficulty === undefined) initial[key].recoveryDifficulty = null;
                if (key === 'memory' && !initial[key].memoryMob) initial[key].memoryMob = getRandomFriendlyMob();
                if (key === 'patterns' && !initial[key].patternMob) initial[key].patternMob = getRandomMob(null);
                if (key === 'reading' && !initial[key].readingMob) initial[key].readingMob = getRandomMob(null);
                if (key === 'math' && !initial[key].mathMob) initial[key].mathMob = getRandomMob(null);
                if (key === 'writing' && !initial[key].writingMob) initial[key].writingMob = getRandomMob(null);
                if (key === 'reading' && !initial[key].readingMobAura) initial[key].readingMobAura = getRandomAura();
                if (key === 'math' && !initial[key].mathMobAura) initial[key].mathMobAura = getRandomAura();
                if (key === 'writing' && !initial[key].writingMobAura) initial[key].writingMobAura = getRandomAura();
                if (key === 'patterns' && !initial[key].patternMobAura) initial[key].patternMobAura = getRandomAura();
                if (key !== 'cleaning' && key !== 'memory') {
                    if (!initial[key].currentMiniboss) initial[key].currentMiniboss = getRandomMiniboss();
                    if (!initial[key].currentBoss) initial[key].currentBoss = getRandomBoss();
                    if (!initial[key].currentMinibossAura) initial[key].currentMinibossAura = getRandomAura();
                    if (!initial[key].currentBossAura) initial[key].currentBossAura = getRandomAura();
                }
            });
            return initial;
        }
    } catch (e) {
        console.warn('Failed to parse saved skills:', e);
    }
    return initial;
};

const loadTheme = (profileId) => {
    let saved = localStorage.getItem(getStorageKey(profileId));
    if (!saved && profileId === 1) saved = localStorage.getItem('heroSkills_v23');
    try {
        return JSON.parse(saved).theme || 'minecraft';
    } catch {
        return 'minecraft';
    }
};

const loadStats = (profileId) => {
    let saved = localStorage.getItem(getStorageKey(profileId));
    if (!saved && profileId === 1) saved = localStorage.getItem('heroSkills_v23');
    try {
        const data = JSON.parse(saved);
        if (data.stats) {
            return { ...getDefaultStats(), ...data.stats, battlesThisSession: 0 };
        }
    } catch (e) {
        console.warn('Failed to parse stats:', e);
    }
    return getDefaultStats();
};

// `now` is injectable so tests can fix the date. The app calls useGameState() with no argument.
export const useGameState = ({ now = systemNow } = {}) => {
    const [currentProfile, setCurrentProfile] = useState(() =>
        localStorage.getItem('currentProfile_v1') ? parseInt(localStorage.getItem('currentProfile_v1')) : 1,
    );
    const [profileNames, setProfileNames] = useState(() =>
        localStorage.getItem('heroProfileNames_v1')
            ? JSON.parse(localStorage.getItem('heroProfileNames_v1'))
            : { 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' },
    );
    const [parentStatus, setParentStatus] = useState(() =>
        localStorage.getItem('heroParentStatus_v1')
            ? JSON.parse(localStorage.getItem('heroParentStatus_v1'))
            : { 1: false, 2: false, 3: false },
    );

    const [skills, setSkills] = useState(() => loadSkills(currentProfile));
    const [activeTheme, setActiveTheme] = useState(() => loadTheme(currentProfile));
    const [stats, setStats] = useState(() => loadStats(currentProfile));
    const loginTrackedRef = useRef(false);

    const [selectedBorder, setSelectedBorder] = useState(() => {
        const saved = localStorage.getItem(`borderEffect_p${currentProfile}`);
        return saved || 'solid';
    });
    const [borderColor, setBorderColor] = useState(() => {
        const saved = localStorage.getItem(`borderColor_p${currentProfile}`);
        return saved || '#FFD700';
    });

    useEffect(() => {
        const dataToSave = { skills, theme: activeTheme, stats };
        localStorage.setItem(getStorageKey(currentProfile), JSON.stringify(dataToSave));
        localStorage.setItem('currentProfile_v1', currentProfile);
        localStorage.setItem('heroProfileNames_v1', JSON.stringify(profileNames));
        localStorage.setItem('heroParentStatus_v1', JSON.stringify(parentStatus));
    }, [skills, currentProfile, activeTheme, profileNames, parentStatus, stats]);

    useEffect(() => {
        localStorage.setItem(`borderEffect_p${currentProfile}`, selectedBorder);
        localStorage.setItem(`borderColor_p${currentProfile}`, borderColor);
    }, [selectedBorder, borderColor, currentProfile]);

    useEffect(() => {
        if (loginTrackedRef.current) return;
        loginTrackedRef.current = true;
        const today = getToday(now);
        const currentDates = stats.loginDates || [];
        if (!currentDates.includes(today)) {
            setStats((prev) => ({ ...prev, loginDates: [...(prev.loginDates || []), today] }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const unlockedBorders = React.useMemo(() => {
        const unlockedBadges = new Set();
        const tierToBadge = ['Wood', 'Stone', 'Gold', 'Iron', 'Emerald', 'Diamond', 'Netherite', 'Obsidian'];
        Object.values(skills).forEach((skill) => {
            if (skill.earnedBadges && Array.isArray(skill.earnedBadges)) {
                skill.earnedBadges.forEach((tier) => {
                    if (tier >= 1 && tier <= 8) unlockedBadges.add(tierToBadge[tier - 1]);
                });
            }
            if (skill.level >= 180) unlockedBadges.add('Star');
        });
        return Array.from(unlockedBadges);
    }, [skills]);

    const unlockedAchievements = React.useMemo(() => {
        const unlocked = [];
        ['speed_demon', 'world_ender', 'monster_manual', 'perfectionist', 'full_set'].forEach((id) => {
            if (isAchievementUnlocked(id, stats, skills)) unlocked.push(id);
        });
        return unlocked;
    }, [stats, skills]);

    const getProfileStats = (id, liveSkills = null) => {
        if (liveSkills) {
            let totalLevel = 0,
                highestLevel = 0;
            Object.values(liveSkills).forEach((s) => {
                if (s && typeof s.level === 'number') {
                    totalLevel += s.level;
                    if (s.level > highestLevel) highestLevel = s.level;
                }
            });
            return { totalLevel, highestLevel, skills: liveSkills, theme: activeTheme };
        }
        const key = getStorageKey(id);
        let saved = localStorage.getItem(key);
        if (!saved && id === 1) saved = localStorage.getItem('heroSkills_v23');
        if (!saved) return null;
        try {
            const data = JSON.parse(saved);
            const skillsData = data.skills || data;
            const theme = data.theme || 'minecraft';
            let totalLevel = 0,
                highestLevel = 0;
            Object.values(skillsData).forEach((s) => {
                if (s && typeof s.level === 'number') {
                    totalLevel += s.level;
                    if (s.level > highestLevel) highestLevel = s.level;
                }
            });
            return { totalLevel, highestLevel, skills: skillsData, theme };
        } catch {
            return null;
        }
    };

    const handleSwitchProfile = (newId) => {
        if (newId === currentProfile) return;
        setSkills(loadSkills(newId));
        setActiveTheme(loadTheme(newId));
        setCurrentProfile(newId);
    };

    const handleRenameProfile = (id, newName) => {
        setProfileNames((prev) => ({ ...prev, [id]: newName }));
    };

    const handleParentVerified = (profileId, verified) => {
        setParentStatus((prev) => ({ ...prev, [profileId]: verified }));
        if (verified && profileId === currentProfile) {
            setSkills((prev) => {
                const updated = {};
                Object.keys(prev).forEach((skillId) => {
                    updated[skillId] = {
                        ...prev[skillId],
                        level: 200,
                        difficulty: 7,
                        earnedBadges: [1, 2, 3, 4, 5, 6, 7, 8],
                        mobHealth: calculateMobHealth(7),
                        mobMaxHealth: calculateMobHealth(7),
                    };
                });
                return updated;
            });
            setTimeout(() => setSkills((current) => ({ ...current })), 0);
        }
    };

    const handleReset = () => {
        localStorage.removeItem(getStorageKey(currentProfile));
        if (currentProfile === 1) localStorage.removeItem('heroSkills_v23');
        const currentParentStatus = localStorage.getItem('heroParentStatus_v1');
        const parentStatusObj = currentParentStatus
            ? JSON.parse(currentParentStatus)
            : { 1: false, 2: false, 3: false };
        parentStatusObj[currentProfile] = false;
        localStorage.setItem('heroParentStatus_v1', JSON.stringify(parentStatusObj));
        const currentProfileNames = localStorage.getItem('heroProfileNames_v1');
        const profileNamesObj = currentProfileNames
            ? JSON.parse(currentProfileNames)
            : { 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' };
        profileNamesObj[currentProfile] = `Player ${currentProfile}`;
        localStorage.setItem('heroProfileNames_v1', JSON.stringify(profileNamesObj));
        window.location.reload();
    };

    const setSkillDifficulty = (skillId, newDiff) => {
        setSkills((prev) => {
            const current = prev[skillId];
            const newMobMaxHealth = calculateMobHealth(newDiff);
            return {
                ...prev,
                [skillId]: {
                    ...current,
                    difficulty: newDiff,
                    mobHealth: newMobMaxHealth,
                    mobMaxHealth: newMobMaxHealth,
                },
            };
        });
    };

    return {
        currentProfile,
        profileNames,
        parentStatus,
        skills,
        setSkills,
        activeTheme,
        setActiveTheme,
        stats,
        setStats,
        selectedBorder,
        setSelectedBorder,
        borderColor,
        setBorderColor,
        unlockedBorders,
        unlockedAchievements,
        getProfileStats,
        handleSwitchProfile,
        handleRenameProfile,
        handleParentVerified,
        handleReset,
        setSkillDifficulty,
    };
};
