import React, { useState, useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';
import { HOMOPHONES } from '../../../constants/gameData';

const MIN_SPOKEN_TEXT_LENGTH = 2;

const ReadingGame = ({ challenge, isListening, spokenText, onMicClick, onMathSubmit }) => {
    const [isReadingWrong, setIsReadingWrong] = useState(false);
    const prevSpokenTextRef = useRef('');
    const readingWordRef = useRef(null);

    useEffect(() => {
        if (spokenText && spokenText !== 'Listening...' && spokenText !== 'Mic Off') {
            if (spokenText !== prevSpokenTextRef.current) {
                if (challenge?.answer) {
                    const homophones = HOMOPHONES[challenge.answer];
                    const isCorrect =
                        spokenText === challenge.answer || (homophones && homophones.includes(spokenText));
                    if (!isCorrect && spokenText.length >= MIN_SPOKEN_TEXT_LENGTH) {
                        // eslint-disable-next-line react-hooks/set-state-in-effect -- trigger wrong-answer animation on speech change (pre-existing pattern)
                        setIsReadingWrong(true);
                        setTimeout(() => setIsReadingWrong(false), 500);
                    }
                }
                prevSpokenTextRef.current = spokenText;
            }
        }
    }, [spokenText, challenge?.answer]);

    const word = challenge?.question.replace('Write: ', '') || '';

    return (
        <>
            <div
                className={`flex-1 bg-black/40 rounded border-2 flex items-center justify-center mb-3 p-2 relative overflow-hidden w-full ${isReadingWrong ? 'border-red-500 bg-red-900/30 animate-shake' : 'border-[#555]'}`}
            >
                <span
                    ref={readingWordRef}
                    className="text-white font-bold tracking-wider px-2"
                    style={{
                        fontSize: 'clamp(1rem, 8vw, 2.5rem)',
                        maxWidth: '100%',
                        wordBreak: 'break-word',
                        textAlign: 'center',
                        lineHeight: '1.2',
                    }}
                >
                    {word}
                </span>
                <div className={`absolute bottom-1 text-xs ${isReadingWrong ? 'text-red-400' : 'text-gray-400'}`}>
                    {spokenText || (isListening ? 'Listening...' : 'Mic Off')}
                </div>
            </div>
            <button
                onClick={onMicClick}
                className={`w-full text-center p-2 rounded border-2 transition-colors flex items-center justify-center gap-2 ${isListening ? 'border-red-500 bg-red-900/20' : 'border-gray-600 hover:bg-white/10'}`}
            >
                {isListening ? (
                    <Mic className="inline animate-pulse text-red-500" />
                ) : (
                    <>
                        <Mic className="inline text-gray-500" />
                        <span className="text-xs uppercase font-bold text-stone-400">Tap to Speak</span>
                    </>
                )}
            </button>
            <button
                onClick={() => onMathSubmit(challenge?.answer)}
                className="mt-auto text-xs text-gray-500 underline hover:text-white self-center"
            >
                Skip / Manual Success
            </button>
        </>
    );
};

export default ReadingGame;
