import React, { useState, useEffect, useRef } from 'react';
import SafeImage from '../../ui/SafeImage';
import { BASE_ASSETS, FRIENDLY_MOBS, DIFFICULTY_CONTENT } from '../../../constants/gameData';
import { playClick, getSfxVolume } from '../../../utils/soundManager';

const MemoryGame = ({ isBattling, difficulty, onMathSubmit, themeData }) => {
    const [memoryCards, setMemoryCards] = useState([]);
    const [flippedIndices, setFlippedIndices] = useState([]);
    const [matchedPairs, setMatchedPairs] = useState([]);
    const [isProcessingMatch, setIsProcessingMatch] = useState(false);
    const [mismatchShake, setMismatchShake] = useState(false);
    const memorySessionStartedRef = useRef(false);

    const memoryConfig = DIFFICULTY_CONTENT.memory[difficulty] || DIFFICULTY_CONTENT.memory[1];
    const memoryPairs = memoryConfig.pairs || 3;
    const memoryGridCols = memoryConfig.gridCols || 4;

    useEffect(() => {
        if (isBattling && !memorySessionStartedRef.current) {
            memorySessionStartedRef.current = true;
            const allMobKeys = Object.keys(FRIENDLY_MOBS);
            const shuffledMobs = [...allMobKeys].sort(() => Math.random() - 0.5);
            const selectedMobs = shuffledMobs.slice(0, memoryPairs);
            let deck = [...selectedMobs, ...selectedMobs].sort(() => Math.random() - 0.5);
            // eslint-disable-next-line react-hooks/set-state-in-effect -- initialize game deck on battle start (pre-existing pattern)
            setMemoryCards(deck.map((mobKey, i) => ({ id: i, color: mobKey, img: FRIENDLY_MOBS[mobKey] })));
            setFlippedIndices([]);
            setMatchedPairs([]);
            setIsProcessingMatch(false);
            setMismatchShake(false);
        } else if (!isBattling) {
            memorySessionStartedRef.current = false;
            setMemoryCards([]);
            setFlippedIndices([]);
            setMatchedPairs([]);
            setIsProcessingMatch(false);
            setMismatchShake(false);
        }
    }, [isBattling, memoryPairs]);

    const handleCardClick = (index) => {
        if (isProcessingMatch || flippedIndices.includes(index) || matchedPairs.includes(memoryCards[index].color)) return;
        const newFlipped = [...flippedIndices, index];
        setFlippedIndices(newFlipped);
        playClick();

        if (newFlipped.length === 2) {
            setIsProcessingMatch(true);
            setTimeout(() => {
                if (memoryCards[newFlipped[0]].color === memoryCards[newFlipped[1]].color) {
                    const matchAudio = new Audio(BASE_ASSETS.audio.match);
                    matchAudio.volume = getSfxVolume();
                    matchAudio.play().catch(() => {});
                    const newMatched = [...matchedPairs, memoryCards[newFlipped[0]].color];
                    setMatchedPairs(newMatched);
                    setFlippedIndices([]);
                    setIsProcessingMatch(false);
                    if (newMatched.length === memoryPairs) setTimeout(() => onMathSubmit("WIN"), 500);
                } else {
                    const mismatchAudio = new Audio(BASE_ASSETS.audio.mismatch);
                    mismatchAudio.volume = getSfxVolume();
                    mismatchAudio.play().catch(() => {});
                    setMismatchShake(true);
                    setTimeout(() => {
                        setMismatchShake(false);
                        setFlippedIndices([]);
                        setIsProcessingMatch(false);
                    }, 500);
                }
            }, 300);
        }
    };

    return (
        <div
            className="flex-1 grid gap-2 bg-black/20 p-2 rounded items-center"
            style={{ gridTemplateColumns: `repeat(${memoryGridCols}, 1fr)` }}
        >
            {memoryCards.map((card, index) => {
                const isFlipped = flippedIndices.includes(index);
                const isMatched = matchedPairs.includes(card.color);
                if (isMatched) return <div key={card.id} className="w-full aspect-[2/3]"></div>;
                return (
                    <div
                        key={card.id}
                        onClick={() => handleCardClick(index)}
                        className={`w-full aspect-[2/3] cursor-pointer transition-all duration-300 perspective-1000 relative transform-style-3d ${isFlipped ? 'rotate-y-180' : ''} ${mismatchShake && isFlipped ? 'animate-shake-flipped border-red-500' : ''}`}
                    >
                        <div className="absolute inset-0 backface-hidden w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
                            <SafeImage src={themeData.assets.cardBack} className="w-full h-full object-cover rounded border border-stone-600" />
                        </div>
                        <div
                            className="absolute inset-0 backface-hidden w-full h-full rotate-y-180 bg-slate-800 rounded border border-white/20 flex items-center justify-center"
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                            <SafeImage src={card.img} className="w-full h-full object-contain p-1" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default MemoryGame;
