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

    return { bgmVol, setBgmVol, sfxVol, setSfxVol: setSfxVolState, startBGM };
};
