import React, { useState, useCallback } from 'react';
import ParentalVerificationModal from '../../ui/ParentalVerificationModal';
import { useTranslation } from '../../../i18n/useTranslation';

const CleaningGame = ({ challenge, onMathSubmit }) => {
    const [showParentalModal, setShowParentalModal] = useState(false);
    const { t } = useTranslation();

    const handleParentalVerified = useCallback(() => {
        setShowParentalModal(false);
        onMathSubmit(challenge?.answer);
    }, [onMathSubmit, challenge]);

    const word = challenge?.question.replace('Write: ', '') || '';

    return (
        <>
            <div className="flex-1 bg-black/40 rounded border-2 border-[#555] flex items-center justify-center mb-3 p-2 relative overflow-hidden w-full">
                <span
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
            </div>
            <button
                onClick={() => setShowParentalModal(true)}
                className="w-full bg-green-600 hover:bg-green-500 text-white text-3xl font-bold py-4 rounded shadow-[0_4px_0_#166534] active:shadow-none active:translate-y-[4px] transition-all"
            >
                {t('games.complete')}
            </button>
            <ParentalVerificationModal
                isOpen={showParentalModal}
                onClose={() => setShowParentalModal(false)}
                onVerified={handleParentalVerified}
            />
        </>
    );
};

export default CleaningGame;
