import React, { useState, useEffect, useRef } from 'react';
import { BASE_ASSETS } from '../../../constants/gameData';
import { getSfxVolume } from '../../../utils/soundManager';

const MathGame = ({ challenge, onMathSubmit }) => {
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
        const val = e.target.value.replace(/[^0-9-]/g, '');
        setMathInput(val);
        if (val === String(challenge?.answer)) {
            onMathSubmit(val);
            setMathInput('');
        } else if (val.length === String(challenge?.answer).length) {
            setIsWrong(true);
            playMismatch();
            onMathSubmit('WRONG');
            setTimeout(() => {
                setIsWrong(false);
                setMathInput('');
                setTimeout(() => inputRef.current?.focus(), 10);
            }, 500);
        }
    };

    return (
        <div className="relative w-full flex justify-center">
            <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={mathInput}
                onChange={handleChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                autoFocus
                maxLength={String(challenge?.answer).length}
                disabled={isWrong}
            />
            <div className={`flex gap-2 ${isWrong ? 'animate-shake' : ''}`}>
                {String(challenge?.answer)
                    .split('')
                    .map((char, i) => (
                        <div
                            key={i}
                            className={`w-10 h-12 border-b-4 flex items-center justify-center text-2xl font-mono font-bold text-white bg-black/20 rounded-t ${isWrong ? 'border-red-500 bg-red-900/30' : i < mathInput.length ? 'border-green-500' : 'border-gray-600'}`}
                        >
                            {mathInput[i] || ''}
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default MathGame;
