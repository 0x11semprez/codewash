import React, { lazy, Suspense } from 'react';
import { Menu, Sparkles, Gift, Maximize, Minimize, Settings, Bug } from 'lucide-react';

import SafeImage from './components/ui/SafeImage';
import PixelHeart from './components/ui/PixelHeart';
import SkillCard from './components/skills/SkillCard';
import PhantomEvent from './components/PhantomEvent';
import AchievementToast from './components/ui/AchievementToast';

import { getMobForSkill, getEncounterType } from './utils/gameUtils';
import { getTheme, SKILL_DATA } from './constants/gameData';
import { playClick, playAchievement, setSoundTheme } from './services/soundManager';

import { useGameState } from './hooks/useGameState';
import { useAudio } from './hooks/useAudio';
import { useFullscreen } from './hooks/useFullscreen';
import { useCarousel } from './hooks/useCarousel';
import { useBattle } from './hooks/useBattle';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { usePauseWhenPageHidden } from './hooks/useAnimationPause';
import { useTranslation } from './i18n/useTranslation';
import { themeSkillText } from './i18n/gameText';

const ResetModal = lazy(() => import('./components/modals/ResetModal'));
const BugReportModal = lazy(() => import('./components/modals/BugReportModal'));
const SettingsDrawer = lazy(() => import('./components/drawers/SettingsDrawer'));
const CosmeticsDrawer = lazy(() => import('./components/drawers/CosmeticsDrawer'));
const MenuDrawer = lazy(() => import('./components/drawers/MenuDrawer'));

const App = ({ startupLoadSeconds = null }) => {
    const { t, language } = useTranslation();
    const gameState = useGameState();
    usePauseWhenPageHidden();
    const {
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
    } = gameState;

    const { bgmVol, setBgmVol, sfxVol, setSfxVol, startBGM } = useAudio();
    const { isFullscreen, toggleFullscreen } = useFullscreen();

    // The active theme drives every picture, text, sound and the music.
    const currentThemeData = getTheme(activeTheme);
    React.useEffect(() => setSoundTheme(currentThemeData), [currentThemeData]);

    const battle = useBattle(skills, setSkills, stats, setStats, currentThemeData);
    const {
        battlingSkillId,
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
    } = battle;

    const voice = useVoiceRecognition(
        challengeDataRef,
        (targetId) => handleSuccessHit(targetId),
        (targetId) => handleSuccessHit(targetId, 'WRONG'),
    );
    const { isListening, spokenText, setSpokenText, startVoiceListener, stopVoiceRecognition, toggleMicListener } =
        voice;

    React.useEffect(() => {
        setSpokenTextSetter(setSpokenText);
    }, [setSpokenText, setSpokenTextSetter]);

    const carousel = useCarousel(battlingSkillId);
    const {
        selectedIndex,
        isDragging,
        handleDragStart,
        handleDragMove,
        handleDragEnd,
        handleCardClick,
        navigateLeft,
        navigateRight,
    } = carousel;

    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isCosmeticsOpen, setIsCosmeticsOpen] = React.useState(false);
    const [hasOpenedMenu, setHasOpenedMenu] = React.useState(false);
    const [hasOpenedSettings, setHasOpenedSettings] = React.useState(false);
    const [hasOpenedCosmetics, setHasOpenedCosmetics] = React.useState(false);
    const startupAchievementShownRef = React.useRef(false);
    const [isResetOpen, setIsResetOpen] = React.useState(false);
    const [isBugReportOpen, setIsBugReportOpen] = React.useState(false);

    React.useEffect(() => {
        if (startupLoadSeconds === null || startupAchievementShownRef.current) return;
        startupAchievementShownRef.current = true;
        const description = t('achievements.game_loaded.loadedIn', { seconds: startupLoadSeconds.toFixed(2) });
        setStats((previous) => {
            const unlocked = Array.isArray(previous.achievementsUnlocked) ? previous.achievementsUnlocked : [];
            if (unlocked.includes('game_loaded')) return previous;
            return { ...previous, achievementsUnlocked: [...unlocked, 'game_loaded'] };
        });
        setAchievementToast({ achievementId: 'game_loaded', tierIndex: null, description });
        playAchievement();
    }, [startupLoadSeconds, setStats, setAchievementToast, t]);

    const handleThemeChange = React.useCallback(
        (newTheme) => {
            if (newTheme !== activeTheme) {
                setActiveTheme(newTheme);
                setStats((prevStats) => ({
                    ...prevStats,
                    themeChanges: (prevStats.themeChanges || 0) + 1,
                }));
            }
        },
        [activeTheme, setActiveTheme, setStats],
    );

    const handleBorderChange = React.useCallback(
        (newBorder) => {
            if (newBorder !== selectedBorder) {
                setSelectedBorder(newBorder);
                setStats((prevStats) => ({
                    ...prevStats,
                    borderChanges: (prevStats.borderChanges || 0) + 1,
                }));
            }
        },
        [selectedBorder, setSelectedBorder, setStats],
    );

    const getAuraForSkill = (skillConfig, userSkill) => {
        if (skillConfig.id === 'memory' || skillConfig.id === 'cleaning') return null;
        const encounterType = getEncounterType(userSkill.level);
        if (encounterType === 'boss') return userSkill.currentBossAura;
        if (encounterType === 'miniboss') return userSkill.currentMinibossAura;
        const combatSkillAuras = {
            reading: userSkill.readingMobAura,
            math: userSkill.mathMobAura,
            writing: userSkill.writingMobAura,
            patterns: userSkill.patternMobAura,
        };
        return combatSkillAuras[skillConfig.id];
    };

    const visibleItems = React.useMemo(() => {
        const items = [];
        for (let i = -3; i <= 3; i++) {
            let idx = selectedIndex + i;
            let dataIndex = idx % SKILL_DATA.length;
            if (dataIndex < 0) dataIndex += SKILL_DATA.length;
            items.push({ ...SKILL_DATA[dataIndex], offset: i, key: idx });
        }
        return items;
    }, [selectedIndex]);

    const containerStyle = { ...currentThemeData.style, fontFamily: '"VT323", monospace' };

    return (
        <div
            className="min-h-screen overflow-hidden relative flex flex-col bg-cover bg-center bg-no-repeat font-sans text-stone-100"
            style={containerStyle}
        >
            <div className="absolute inset-0 bg-black/30 pointer-events-none z-0"></div>

            <button
                onClick={() => {
                    setHasOpenedSettings(true);
                    setIsMenuOpen(false);
                    setIsCosmeticsOpen(false);
                    setIsSettingsOpen(true);
                    playClick();
                }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ top: '24px', left: '24px' }}
                aria-label={t('app.openSettings')}
            >
                <Settings size={48} className="text-slate-400" />
            </button>
            <button
                onClick={() => {
                    setHasOpenedCosmetics(true);
                    setIsMenuOpen(false);
                    setIsSettingsOpen(false);
                    setIsCosmeticsOpen(true);
                    playClick();
                }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ top: '24px', left: 'calc(24px + 76px + 12px)' }}
                aria-label={t('app.openCosmetics')}
            >
                <Sparkles size={48} className="text-purple-400" />
            </button>

            <div
                className="absolute z-40 flex gap-1.5"
                style={{ bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}
            >
                {Array(10)
                    .fill(0)
                    .map((_, i) => (
                        <PixelHeart key={i} size={48} filled={i < playerHealth} />
                    ))}
            </div>

            {isCosmeticsOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => {
                        setIsCosmeticsOpen(false);
                        playClick();
                    }}
                />
            )}
            <Suspense fallback={null}>
                {(hasOpenedCosmetics || isCosmeticsOpen) && (
                    <CosmeticsDrawer
                        isOpen={isCosmeticsOpen}
                        activeTheme={activeTheme}
                        setActiveTheme={handleThemeChange}
                        selectedBorder={selectedBorder}
                        setSelectedBorder={handleBorderChange}
                        borderColor={borderColor}
                        setBorderColor={setBorderColor}
                        unlockedBorders={unlockedBorders}
                        unlockedAchievements={unlockedAchievements}
                    />
                )}
            </Suspense>

            {isSettingsOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => {
                        setIsSettingsOpen(false);
                        playClick();
                    }}
                />
            )}
            <Suspense fallback={null}>
                {(hasOpenedSettings || isSettingsOpen) && (
                    <SettingsDrawer
                        isOpen={isSettingsOpen}
                        onReset={() => setIsResetOpen(true)}
                        bgmVol={bgmVol}
                        setBgmVol={setBgmVol}
                        sfxVol={sfxVol}
                        setSfxVol={setSfxVol}
                        currentProfile={currentProfile}
                        onSwitchProfile={handleSwitchProfile}
                        profileNames={profileNames}
                        onRenameProfile={handleRenameProfile}
                        getProfileStats={getProfileStats}
                        parentStatus={parentStatus}
                        onParentVerified={handleParentVerified}
                        currentSkills={skills}
                    />
                )}
            </Suspense>
            <Suspense fallback={null}>
                {isResetOpen && (
                    <ResetModal isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} onConfirm={handleReset} />
                )}
            </Suspense>
            <Suspense fallback={null}>
                {isBugReportOpen && (
                    <BugReportModal
                        isOpen={isBugReportOpen}
                        onClose={() => setIsBugReportOpen(false)}
                        context={{ profileId: currentProfile, theme: activeTheme }}
                    />
                )}
            </Suspense>

            <button
                onClick={toggleFullscreen}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ top: '24px', right: 'calc(24px + 76px + 12px)' }}
                aria-label={isFullscreen ? t('app.exitFullscreen') : t('app.enterFullscreen')}
                title={isFullscreen ? t('app.exitFullscreen') : t('app.enterFullscreen')}
            >
                {isFullscreen ? <Minimize size={48} /> : <Maximize size={48} />}
            </button>
            <button
                onClick={() => {
                    setHasOpenedMenu(true);
                    setIsSettingsOpen(false);
                    setIsCosmeticsOpen(false);
                    setIsMenuOpen(true);
                    playClick();
                }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ top: '24px', right: '24px' }}
                aria-label={t('app.openAchievements')}
            >
                <Menu size={48} />
            </button>

            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => {
                        setIsMenuOpen(false);
                        playClick();
                    }}
                />
            )}
            <Suspense fallback={null}>
                {(hasOpenedMenu || isMenuOpen) && (
                    <MenuDrawer isOpen={isMenuOpen} skills={skills} stats={stats} themeData={currentThemeData} />
                )}
            </Suspense>

            <button
                onClick={() => {
                    setIsMenuOpen(false);
                    setIsCosmeticsOpen(false);
                    setIsSettingsOpen(false);
                    setIsBugReportOpen(true);
                    playClick();
                }}
                className="absolute z-40 bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
                style={{ bottom: '24px', right: '24px' }}
                aria-label={t('app.reportBug')}
            >
                <Bug size={48} className="text-red-400" />
            </button>

            {battlingSkillId && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        minWidth: '100vw',
                        minHeight: '100vh',
                    }}
                    onClick={() => endBattle(stopVoiceRecognition)}
                />
            )}

            <main className="flex-1 relative flex flex-col items-center justify-center w-full">
                {/* Fixed 4:1 box: logos of any size fit inside without moving the cards below. */}
                <div className="z-10 relative mb-[-30px] md:mb-[-50px] pointer-events-none opacity-90 w-[480px] h-[120px] md:w-[720px] md:h-[180px] lg:w-[960px] lg:h-[240px]">
                    <SafeImage
                        src={currentThemeData.assets.logo}
                        alt={t('app.logoAlt')}
                        className="w-full h-full object-contain drop-shadow-2xl"
                    />
                </div>
                <h1
                    className="text-9xl text-yellow-400 tracking-widest uppercase mt-[-20px] mb-[95px] z-20 relative drop-shadow-[4px_4px_0_#000]"
                    style={{ textShadow: '6px 6px 0 #000' }}
                >
                    {t('app.title')}
                </h1>

                <button
                    onClick={navigateLeft}
                    aria-label={t('app.previousSkill')}
                    className="flex absolute left-0 z-30 items-center justify-center h-full"
                    style={{
                        background: 'linear-gradient(to right, rgba(100, 100, 100, 0.6), transparent)',
                        width: '80px',
                        padding: '0',
                    }}
                >
                    <svg
                        width="60"
                        height="450"
                        viewBox="0 0 60 450"
                        className="animate-chevron-left"
                        style={{ opacity: 0.8 }}
                    >
                        <path
                            d="M 50 25 Q 15 225 50 425"
                            stroke="rgba(150, 150, 150, 0.9)"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>

                <button
                    onClick={navigateRight}
                    aria-label={t('app.nextSkill')}
                    className="flex absolute right-0 z-30 items-center justify-center h-full"
                    style={{
                        background: 'linear-gradient(to left, rgba(100, 100, 100, 0.6), transparent)',
                        width: '80px',
                        padding: '0',
                    }}
                >
                    <svg
                        width="60"
                        height="450"
                        viewBox="0 0 60 450"
                        className="animate-chevron-right"
                        style={{ opacity: 0.8 }}
                    >
                        <path
                            d="M 10 25 Q 45 225 10 425"
                            stroke="rgba(150, 150, 150, 0.9)"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>

                <div
                    className={`relative w-full flex items-center justify-center perspective-1000 h-[650px] mb-12 ${battlingSkillId ? 'z-50' : ''}`}
                    style={{ cursor: battlingSkillId ? 'default' : isDragging ? 'grabbing' : 'grab' }}
                    onMouseDown={(e) => handleDragStart(e.clientX)}
                    onMouseMove={(e) => handleDragMove(e.clientX)}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                    onTouchMove={(e) => {
                        e.preventDefault();
                        handleDragMove(e.touches[0].clientX);
                    }}
                    onTouchEnd={handleDragEnd}
                >
                    {visibleItems.map((item) => {
                        const isItemBattling = item.offset === 0 && battlingSkillId === item.id;
                        const getVerticalOffset = (offset) => {
                            if (offset === 0) return -55;
                            if (Math.abs(offset) === 1) return -30;
                            if (Math.abs(offset) === 2) return 20;
                            return 75;
                        };
                        const translateY = getVerticalOffset(item.offset);
                        const rotateX =
                            Math.abs(item.offset) === 3
                                ? -12
                                : Math.abs(item.offset) === 2
                                  ? -8
                                  : Math.abs(item.offset) === 1
                                    ? -4
                                    : 0;

                        return (
                            <div
                                key={item.key}
                                className="absolute transition-all duration-500 ease-out"
                                data-offscreen={Math.abs(item.offset) === 3 ? '' : undefined}
                                style={{
                                    transform: `translateX(${item.offset * 320}px) translateY(${translateY}px) rotateX(${rotateX}deg) scale(${item.offset === 0 ? 1.1 : 0.85})`,
                                    opacity:
                                        item.offset === 0
                                            ? 1
                                            : Math.abs(item.offset) === 3
                                              ? 0
                                              : Math.abs(item.offset) === 2
                                                ? 0.3
                                                : 0.6,
                                    zIndex: isItemBattling ? 50 : item.offset === 0 ? 20 : 10 - Math.abs(item.offset),
                                    filter: item.offset === 0 ? 'none' : 'brightness(0.5) blur(1px)',
                                    cursor: item.offset !== 0 && !battlingSkillId ? 'pointer' : 'default',
                                    transitionTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
                                }}
                                onClick={() => handleCardClick(item.offset)}
                            >
                                <SkillCard
                                    config={item}
                                    data={skills[item.id]}
                                    themeData={currentThemeData}
                                    isCenter={item.offset === 0}
                                    isBattling={item.offset === 0 && battlingSkillId === item.id}
                                    mobName={getMobForSkill(item, skills[item.id], Math.random, currentThemeData)}
                                    mobAura={getAuraForSkill(item, skills[item.id])}
                                    challenge={challengeData}
                                    isListening={isListening}
                                    spokenText={spokenText}
                                    damageNumbers={damageNumbers.filter((d) => d.skillId === item.id)}
                                    onStartBattle={() => startBattle(item.id, startVoiceListener, startBGM)}
                                    onEndBattle={() => endBattle(stopVoiceRecognition)}
                                    onMathSubmit={(val, result) => handleSuccessHit(item.id, val, result)}
                                    onMicClick={() => toggleMicListener(item.id, battlingSkillId)}
                                    difficulty={skills[item.id].difficulty || 1}
                                    setDifficulty={(newDiff) => setSkillDifficulty(item.id, newDiff)}
                                    unlockedDifficulty={Math.min(7, Math.floor(skills[item.id].level / 20) + 1)}
                                    selectedBorder={selectedBorder}
                                    borderColor={borderColor}
                                    bossHealing={bossHealing === item.id}
                                />
                            </div>
                        );
                    })}
                </div>
            </main>

            {lootBox && (
                <div className="fixed bottom-8 left-1/2 z-50 animate-toast w-full max-w-2xl pointer-events-none transform -translate-x-1/2">
                    <div className="bg-black/80 border-4 border-yellow-500 rounded-full p-4 px-12 flex items-center justify-between shadow-[0_0_30px_rgba(255,215,0,0.6)] backdrop-blur-md mx-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-yellow-500/20 p-3 rounded-full border-2 border-yellow-400">
                                <Gift size={32} className="text-yellow-300 animate-bounce" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-2xl text-yellow-400 font-bold leading-none mb-1">
                                    {t('loot.levelReached', { level: lootBox.level })}
                                </h2>
                                <p className="text-stone-300 text-sm">
                                    {themeSkillText(t, language, currentThemeData, lootBox.skillId, 'fantasyName')}
                                </p>
                            </div>
                        </div>
                        <div className="text-right pl-8 border-l-2 border-stone-600 flex items-center gap-4">
                            <SafeImage
                                src={lootBox.img}
                                alt={t('loot.badgeAlt')}
                                className="w-12 h-12 object-contain"
                            />
                            <div>
                                <p className="text-stone-400 text-xs uppercase tracking-wider">{t('loot.unlocked')}</p>
                                <p className="text-2xl text-green-400 font-bold">{t(lootBox.itemKey)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {achievementToast && (
                <AchievementToast
                    achievementId={achievementToast.achievementId}
                    tierIndex={achievementToast.tierIndex}
                    descriptionOverride={achievementToast.description}
                />
            )}

            {showDeathOverlay && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-red-900/60 animate-pulse pointer-events-none">
                    <div className="text-center">
                        <h1
                            className="text-8xl font-bold text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]"
                            style={{ textShadow: '4px 4px 0 #000, -2px -2px 0 #000' }}
                        >
                            {t('death.title')}
                        </h1>
                        <p className="text-2xl text-red-300 mt-4">{t('death.levelLost')}</p>
                        <p className="text-lg text-stone-400 mt-2">{t('death.rest')}</p>
                    </div>
                </div>
            )}

            {showLevelRestored && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    <div className="text-center animate-bounce">
                        <h1
                            className="text-6xl font-bold text-green-400 drop-shadow-[0_0_20px_rgba(0,255,0,0.8)]"
                            style={{ textShadow: '4px 4px 0 #000' }}
                        >
                            {t('restored.title')}
                        </h1>
                        <p className="text-2xl text-yellow-400 mt-4">{t('restored.welcome')}</p>
                    </div>
                </div>
            )}

            <PhantomEvent
                battlingSkillId={battlingSkillId}
                imageSrc={currentThemeData.bonusCreature}
                onAwardLevel={handlePhantomLevelAward}
                onPhantomCaught={() => {
                    setStats((prevStats) => ({
                        ...prevStats,
                        phantomsCaught: (prevStats.phantomsCaught || 0) + 1,
                    }));
                }}
            />
        </div>
    );
};

export default App;
