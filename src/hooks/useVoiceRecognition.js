import { useState, useRef } from 'react';
import { HOMOPHONES } from '../constants/gameData';

const MIN_SPOKEN_TEXT_LENGTH = 2;

// The reading words and their homophones are English game data (ADR-012), and
// the spoken text must match them exactly. A French recognizer writes what it
// hears as French words, so its text would rarely match and a French player
// could not pass. Recognition stays in English whatever the interface language
// is, until the reading words are translated.
export const READING_SPEECH_LANGUAGE = 'en-US';

// Status messages are dictionary keys, so the reading game shows them in the
// current language. A transcript never contains a dot, so it cannot match a key.
export const MIC_STATUS = {
    listening: 'games.listening',
    off: 'games.micOff',
    denied: 'games.micDenied',
    unavailable: 'games.micUnavailable',
};

const MIC_STATUS_KEYS = new Set(Object.values(MIC_STATUS));

export const isMicStatus = (text) => MIC_STATUS_KEYS.has(text);

export const useVoiceRecognition = (challengeDataRef, onCorrect, onWrong) => {
    const [isListening, setIsListening] = useState(false);
    const [spokenText, setSpokenText] = useState('');
    const recognitionRef = useRef(null);

    const stopVoiceRecognition = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (error) {
                console.warn('[Speech Recognition] Error stopping:', error);
            }
            recognitionRef.current = null;
        }
        setIsListening(false);
        setSpokenText(MIC_STATUS.off);
    };

    const startVoiceListener = (targetId, battlingSkillId) => {
        if (!window.webkitSpeechRecognition) return;
        if (recognitionRef.current) return;

        recognitionRef.current = new window.webkitSpeechRecognition();
        recognitionRef.current.lang = READING_SPEECH_LANGUAGE;
        recognitionRef.current.continuous = true;

        recognitionRef.current.onstart = () => {
            setIsListening(true);
            setSpokenText(MIC_STATUS.listening);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
            if (battlingSkillId === 'reading' || targetId === 'reading') {
                setTimeout(() => {
                    if (battlingSkillId === 'reading') {
                        recognitionRef.current = null;
                        startVoiceListener(targetId, battlingSkillId);
                    }
                }, 100);
            } else {
                setSpokenText(MIC_STATUS.off);
            }
        };

        recognitionRef.current.onerror = (event) => {
            if (event.error === 'not-allowed') {
                setSpokenText(MIC_STATUS.denied);
                setIsListening(false);
            }
        };

        recognitionRef.current.onresult = (e) => {
            const t = e.results[e.results.length - 1][0].transcript
                .toUpperCase()
                .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
            setSpokenText(t);
            const currentChallenge = challengeDataRef.current;
            if (currentChallenge && currentChallenge.type === 'reading') {
                if (t === currentChallenge.answer || HOMOPHONES[currentChallenge.answer]?.includes(t)) {
                    onCorrect(targetId || battlingSkillId);
                } else if (t && t.length >= MIN_SPOKEN_TEXT_LENGTH) {
                    onWrong(targetId || battlingSkillId);
                }
            }
        };

        try {
            recognitionRef.current.start();
        } catch (error) {
            console.error('[Speech Recognition] Failed to start:', error);
        }
    };

    const toggleMicListener = (targetId, battlingSkillId) => {
        if (!window.webkitSpeechRecognition) {
            setSpokenText(MIC_STATUS.unavailable);
            return;
        }
        if (recognitionRef.current && isListening) {
            stopVoiceRecognition();
        } else {
            startVoiceListener(targetId, battlingSkillId);
        }
    };

    return {
        isListening,
        spokenText,
        setSpokenText,
        startVoiceListener,
        stopVoiceRecognition,
        toggleMicListener,
    };
};
