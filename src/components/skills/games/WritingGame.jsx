import React, { useState, useEffect, useRef } from 'react';
import { BASE_ASSETS } from '../../../constants/gameData';
import { getSfxVolume } from '../../../utils/soundManager';

const WritingGame = ({ challenge, onMathSubmit }) => {
    const [mathInput, setMathInput] = useState('');
    const [isWrong, setIsWrong] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reset input on new challenge (pre-existing pattern)
        setMathInput('');
    }, [challenge]);

    const playMismatch = () => {
        const audio = new Audio(BASE_ASSETS.audio.mismatch);
        audio.volume = getSfxVolume();
        audio.play().catch(() => {});
    };

    const handleChange = (e) => {
        const val = e.target.value.toUpperCase().replace(/\s/g, '');
        setMathInput(val);
        const answerNoSpaces = challenge?.answer.replace(/\s/g, '');
        if (val === answerNoSpaces) {
            onMathSubmit(val);
            setMathInput('');
        } else if (val.length === answerNoSpaces.length) {
            setIsWrong(true);
            playMismatch();
            setTimeout(() => {
                setIsWrong(false);
                setMathInput('');
                setTimeout(() => inputRef.current?.focus(), 10);
            }, 500);
        }
    };

    const answerNoSpaces = challenge?.answer.replace(/\s/g, '');
    const answerLength = answerNoSpaces.length;

    return (
        <div className="relative w-full flex justify-center">
            <input
                ref={inputRef}
                type="text"
                value={mathInput}
                onChange={handleChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                autoFocus
                maxLength={answerNoSpaces.length}
                disabled={isWrong}
            />
            <div className={`flex gap-1 flex-wrap justify-center ${isWrong ? 'animate-shake' : ''}`}>
                {challenge?.answer.split('').map((char, i) => {
                    if (char === ' ') {
                        return <div key={i} className={`${answerLength > 6 ? 'w-7' : 'w-10'}`}></div>;
                    }
                    let inputIndex = 0;
                    for (let j = 0; j < i; j++) {
                        if (challenge?.answer[j] !== ' ') inputIndex++;
                    }
                    return (
                        <div
                            key={i}
                            className={`${answerLength > 6 ? 'w-7 h-9 text-lg' : 'w-10 h-12 text-2xl'} border-b-4 flex items-center justify-center font-mono font-bold text-white bg-black/20 rounded-t ${isWrong ? 'border-red-500 bg-red-900/30' : inputIndex < mathInput.length ? 'border-green-500' : 'border-gray-600'}`}
                        >
                            {mathInput[inputIndex] || ''}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WritingGame;
