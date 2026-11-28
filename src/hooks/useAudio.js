import { useState, useRef, useEffect, useCallback } from 'react';
import { getBGMManager, setSfxVolume } from '../services/soundManager';

export const useAudio = () => {
    const [bgmVol, setBgmVol] = useState(0.3);
    const [sfxVol, setSfxVolState] = useState(0.5);
    const bgmManager = useRef(getBGMManager());

    useEffect(() => {
        bgmManager.current.setVolume(bgmVol);
    }, [bgmVol]);

    useEffect(() => {
        setSfxVolume(sfxVol);
    }, [sfxVol]);

    const startBGM = useCallback(() => {
        if (!bgmManager.current.isPlaying) {
            bgmManager.current.play();
        }
    }, []);

    // Browsers only allow audio after a user gesture, so the music starts on the first click,
    // touch or key press anywhere on the page. Starting a battle still starts it too.
    useEffect(() => {
        const events = ['pointerdown', 'keydown'];
        const startOnce = () => {
            events.forEach((name) => window.removeEventListener(name, startOnce));
            startBGM();
        };
        events.forEach((name) => window.addEventListener(name, startOnce));
        return () => events.forEach((name) => window.removeEventListener(name, startOnce));
    }, [startBGM]);

    return { bgmVol, setBgmVol, sfxVol, setSfxVol: setSfxVolState, startBGM };
};
