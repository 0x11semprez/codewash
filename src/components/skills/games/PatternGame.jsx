import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import SafeImage from '../../ui/SafeImage';
import { DIFFICULTY_CONTENT } from '../../../constants/gameData';
import { playMatch, playMismatch, playNote } from '../../../services/soundManager';
import { useTranslation } from '../../../i18n/useTranslation';
import { pieceLabel } from '../../../i18n/gameText';

const MAX_TEMPO_DELAY = 800;
const MIN_TEMPO_DELAY = 200;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (start, end, t) => start + (end - start) * clamp(t, 0, 1);

const getTempoDelays = (completedRounds, currentDifficulty) => {
    const round = completedRounds + 1;
    const startingDelay = lerp(MAX_TEMPO_DELAY, MIN_TEMPO_DELAY, (currentDifficulty - 1) / 6);
    const maxRunwayRounds = lerp(10, 1, (currentDifficulty - 1) / 6);
    const runwayProgress = maxRunwayRounds > 1 ? (round - 1) / (maxRunwayRounds - 1) : 1;
    const rawOnDelay = lerp(startingDelay, MIN_TEMPO_DELAY, runwayProgress);
    const onDelay = clamp(rawOnDelay, MIN_TEMPO_DELAY, MAX_TEMPO_DELAY);
    const offDelay = Math.max(100, Math.round(onDelay * 0.35));
    return { onDelay, offDelay };
};

// Simon Says with the pattern pieces of the active theme. Each piece plays its own note.
const PatternGame = ({ isBattling, difficulty, onMathSubmit, themeData }) => {
    const { t, language } = useTranslation();
    const [simonSequence, setSimonSequence] = useState([]);
    const [playerIndex, setPlayerIndex] = useState(0);
    const [isShowingSequence, setIsShowingSequence] = useState(false);
    const [completedRounds, setCompletedRounds] = useState(0);
    const [litPiece, setLitPiece] = useState(null);
    const [simonGameActive, setSimonGameActive] = useState(false);
    const simonSessionStartedRef = useRef(false);

    const patternConfig = DIFFICULTY_CONTENT.patterns[difficulty] || DIFFICULTY_CONTENT.patterns[1];
    const pieceCount = patternConfig.pieceCount || 2;
    const pieces = themeData.patternPieces;
    const shouldResetSequence = patternConfig.resetSequence || false;

    const allPieceNames = useMemo(() => Object.keys(pieces), [pieces]);
    const pieceColors = useMemo(
        () => allPieceNames.slice(0, Math.min(pieceCount, allPieceNames.length)),
        [allPieceNames, pieceCount],
    );

    const playPieceNote = useCallback((color) => playNote(allPieceNames.indexOf(color)), [allPieceNames]);

    const playSequence = useCallback(
        (sequence) => {
            setIsShowingSequence(true);
            setPlayerIndex(0);
            let i = 0;
            const { onDelay, offDelay } = getTempoDelays(completedRounds, difficulty);

            const playNext = () => {
                if (i < sequence.length) {
                    setLitPiece(sequence[i]);
                    playPieceNote(sequence[i]);
                    setTimeout(() => {
                        setLitPiece(null);
                        i++;
                        setTimeout(playNext, offDelay);
                    }, onDelay);
                } else {
                    setIsShowingSequence(false);
                }
            };
            setTimeout(playNext, 500);
        },
        [completedRounds, difficulty, playPieceNote],
    );

    const startSimonGame = useCallback(() => {
        const firstColor = pieceColors[Math.floor(Math.random() * pieceColors.length)];
        const newSequence = [firstColor];
        setSimonSequence(newSequence);
        setPlayerIndex(0);
        setCompletedRounds(0);
        setSimonGameActive(true);
        playSequence(newSequence);
    }, [pieceColors, playSequence]);

    const handlePieceClick = (color) => {
        if (isShowingSequence || !simonGameActive) return;

        playPieceNote(color);

        if (color === simonSequence[playerIndex]) {
            if (playerIndex === simonSequence.length - 1) {
                playMatch();
                const newRounds = completedRounds + 1;
                setCompletedRounds(newRounds);

                const damage = Math.round(newRounds * 1.5);
                setTimeout(() => onMathSubmit('WIN', damage), 300);

                let newSequence;
                if (shouldResetSequence) {
                    newSequence = [];
                    for (let i = 0; i < simonSequence.length + 1; i++) {
                        newSequence.push(pieceColors[Math.floor(Math.random() * pieceColors.length)]);
                    }
                } else {
                    const nextColor = pieceColors[Math.floor(Math.random() * pieceColors.length)];
                    newSequence = [...simonSequence, nextColor];
                }

                setSimonSequence(newSequence);
                setPlayerIndex(0);
                setTimeout(() => playSequence(newSequence), 800);
            } else {
                setPlayerIndex(playerIndex + 1);
            }
        } else {
            playMismatch();
            setSimonGameActive(false);
        }
    };

    useEffect(() => {
        if (isBattling && !simonSessionStartedRef.current) {
            simonSessionStartedRef.current = true;
            startSimonGame();
        } else if (!isBattling) {
            simonSessionStartedRef.current = false;
            setSimonSequence([]);
            setPlayerIndex(0);
            setIsShowingSequence(false);
            setCompletedRounds(0);
            setLitPiece(null);
            setSimonGameActive(false);
        }
    }, [isBattling, startSimonGame]);

    return (
        <div className="w-full flex flex-col items-center gap-1">
            <div className="text-white text-lg font-bold py-1">
                {t('games.round', { count: completedRounds })}{' '}
                {isShowingSequence && <span className="text-yellow-400 animate-pulse">{t('games.watch')}</span>}
                {!isShowingSequence && simonGameActive && <span className="text-green-400">{t('games.yourTurn')}</span>}
            </div>
            <div className="relative w-[240px] h-[240px]">
                {pieceColors.map((color, index) => {
                    const anglePerPiece = 360 / pieceColors.length;
                    const angle = (index * anglePerPiece - 90) * (Math.PI / 180);
                    const radius = 85;
                    const x = 120 + radius * Math.cos(angle) - 40;
                    const y = 120 + radius * Math.sin(angle) - 40;
                    const isLit = litPiece === color;
                    return (
                        <div
                            key={color}
                            onClick={() => handlePieceClick(color)}
                            className={`absolute w-[80px] h-[80px] cursor-pointer transition-all duration-200 rounded-full p-1 ${isLit ? 'scale-125 ring-4 ring-yellow-400 brightness-150 z-10' : 'hover:scale-110'} ${isShowingSequence ? 'pointer-events-none' : ''}`}
                            style={{ left: x, top: y }}
                        >
                            <SafeImage
                                src={pieces[color]}
                                alt={pieceLabel(t, language, themeData, color)}
                                className="w-full h-full object-contain drop-shadow-lg"
                            />
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-white bg-black/60 px-1 rounded">
                                {pieceLabel(t, language, themeData, color)}
                            </span>
                        </div>
                    );
                })}
            </div>
            {!simonGameActive && completedRounds > 0 && (
                <div className="flex flex-col items-center gap-3">
                    <div className="text-red-400 text-lg font-bold animate-pulse">
                        {t('games.gameOver', { count: completedRounds })}
                    </div>
                    <button
                        onClick={startSimonGame}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold py-3 px-6 rounded shadow-[0_4px_0_#1e40af] active:shadow-none active:translate-y-[4px] transition-all"
                    >
                        {t('games.retry')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PatternGame;
