import { useState, useRef } from 'react';
import { HOMOPHONES } from '../constants/gameData';

const MIN_SPOKEN_TEXT_LENGTH = 2;
const MIC_OFF_TEXT = "Mic Off";

export const useVoiceRecognition = (challengeDataRef, onCorrect, onWrong) => {
    const [isListening, setIsListening] = useState(false);
    const [spokenText, setSpokenText] = useState("");
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
        setSpokenText(MIC_OFF_TEXT);
    };

    const startVoiceListener = (targetId, battlingSkillId) => {
        if (!window.webkitSpeechRecognition) return;
        if (recognitionRef.current) return;

        recognitionRef.current = new window.webkitSpeechRecognition();
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.continuous = true;

        recognitionRef.current.onstart = () => {
            setIsListening(true);
            setSpokenText("Listening...");
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
                setSpokenText(MIC_OFF_TEXT);
            }
        };

        recognitionRef.current.onerror = (event) => {
            if (event.error === 'not-allowed') {
                setSpokenText("Mic permission denied");
                setIsListening(false);
            }
        };

        recognitionRef.current.onresult = (e) => {
            const t = e.results[e.results.length - 1][0].transcript.toUpperCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
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
            setSpokenText("Mic not available");
            return;
        }
        if (recognitionRef.current && isListening) {
            stopVoiceRecognition();
        } else {
            startVoiceListener(targetId, battlingSkillId);
        }
    };

    return {
        isListening, spokenText, setSpokenText,
        startVoiceListener, stopVoiceRecognition, toggleMicListener
    };
};
