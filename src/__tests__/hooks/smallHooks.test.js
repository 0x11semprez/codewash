import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCarousel } from '../../hooks/useCarousel';
import { useAudio } from '../../hooks/useAudio';
import { useFullscreen } from '../../hooks/useFullscreen';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import * as sound from '../../services/soundManager';

vi.mock('../../services/soundManager', () => {
    const bgm = { isPlaying: false, play: vi.fn(), setVolume: vi.fn() };
    return {
        getBGMManager: () => bgm,
        setSfxVolume: vi.fn(),
        playClick: vi.fn(),
        playActionCardLeft: vi.fn(),
        playActionCardRight: vi.fn(),
    };
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useCarousel', () => {
    it('moves with the arrows and plays the card sounds', () => {
        const { result } = renderHook(() => useCarousel(null));
        act(() => result.current.navigateRight());
        act(() => result.current.navigateRight());
        act(() => result.current.navigateLeft());
        expect(result.current.selectedIndex).toBe(1);
        expect(sound.playActionCardRight).toHaveBeenCalledTimes(2);
        expect(sound.playActionCardLeft).toHaveBeenCalledOnce();
    });

    it('jumps to a clicked side card, but not to the center one', () => {
        const { result } = renderHook(() => useCarousel(null));
        act(() => result.current.handleCardClick(2));
        expect(result.current.selectedIndex).toBe(2);
        act(() => result.current.handleCardClick(-3));
        expect(result.current.selectedIndex).toBe(-1);
        act(() => result.current.handleCardClick(0));
        expect(result.current.selectedIndex).toBe(-1);
        expect(sound.playActionCardRight).toHaveBeenCalledOnce();
        expect(sound.playActionCardLeft).toHaveBeenCalledOnce();
    });

    it('turns after a drag of at least 100 pixels in either direction', () => {
        const { result } = renderHook(() => useCarousel(null));
        act(() => result.current.handleDragStart(500));
        expect(result.current.isDragging).toBe(true);
        act(() => result.current.handleDragMove(450));
        expect(result.current.selectedIndex).toBe(0);
        act(() => result.current.handleDragMove(400));
        expect(result.current.selectedIndex).toBe(1);
        expect(result.current.isDragging).toBe(false);

        act(() => result.current.handleDragStart(100));
        act(() => result.current.handleDragMove(250));
        expect(result.current.selectedIndex).toBe(0);

        act(() => result.current.handleDragStart(100));
        act(() => result.current.handleDragEnd());
        act(() => result.current.handleDragMove(500));
        expect(result.current.selectedIndex).toBe(0);
    });

    it('stays still during a battle', () => {
        const { result } = renderHook(() => useCarousel('math'));
        act(() => result.current.handleDragStart(500));
        act(() => result.current.handleDragMove(0));
        act(() => result.current.handleCardClick(1));
        expect(result.current.isDragging).toBe(false);
        expect(result.current.selectedIndex).toBe(0);
    });

    it('stops a drag that is in progress when a battle starts', () => {
        const { result, rerender } = renderHook(({ battling }) => useCarousel(battling), {
            initialProps: { battling: null },
        });
        act(() => result.current.handleDragStart(500));
        rerender({ battling: 'math' });
        act(() => result.current.handleDragMove(0));
        expect(result.current.selectedIndex).toBe(0);
    });
});

describe('useAudio', () => {
    it('sends the volumes to the sound manager', () => {
        const bgm = sound.getBGMManager();
        const { result } = renderHook(() => useAudio());
        expect(bgm.setVolume).toHaveBeenCalledWith(0.3);
        expect(sound.setSfxVolume).toHaveBeenCalledWith(0.5);
        act(() => result.current.setBgmVol(0.7));
        act(() => result.current.setSfxVol(0.2));
        expect(bgm.setVolume).toHaveBeenLastCalledWith(0.7);
        expect(sound.setSfxVolume).toHaveBeenLastCalledWith(0.2);
    });

    it('starts the music only when it is not playing yet', () => {
        const bgm = sound.getBGMManager();
        const { result } = renderHook(() => useAudio());
        bgm.isPlaying = false;
        result.current.startBGM();
        bgm.isPlaying = true;
        result.current.startBGM();
        bgm.isPlaying = false;
        expect(bgm.play).toHaveBeenCalledOnce();
    });
});

describe('useFullscreen', () => {
    let fullscreenElement;
    beforeEach(() => {
        fullscreenElement = null;
        Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreenElement });
    });
    afterEach(() => {
        delete document.fullscreenElement;
        delete document.documentElement.requestFullscreen;
        delete document.exitFullscreen;
    });

    it('enters and leaves fullscreen and follows the browser state', async () => {
        document.documentElement.requestFullscreen = vi.fn().mockResolvedValue();
        document.exitFullscreen = vi.fn().mockResolvedValue();
        const { result } = renderHook(() => useFullscreen());

        act(() => result.current.toggleFullscreen());
        expect(document.documentElement.requestFullscreen).toHaveBeenCalledOnce();
        fullscreenElement = document.documentElement;
        act(() => document.dispatchEvent(new Event('fullscreenchange')));
        expect(result.current.isFullscreen).toBe(true);

        act(() => result.current.toggleFullscreen());
        expect(document.exitFullscreen).toHaveBeenCalledOnce();
        expect(sound.playClick).toHaveBeenCalledTimes(2);
    });

    it('warns when the browser refuses', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        document.documentElement.requestFullscreen = vi.fn().mockRejectedValue(new Error('denied'));
        document.exitFullscreen = vi.fn().mockRejectedValue(new Error('denied'));
        const { result } = renderHook(() => useFullscreen());
        await act(async () => result.current.toggleFullscreen());
        fullscreenElement = document.documentElement;
        await act(async () => result.current.toggleFullscreen());
        expect(warn).toHaveBeenCalledWith('Failed to enter fullscreen:', expect.any(Error));
        expect(warn).toHaveBeenCalledWith('Failed to exit fullscreen:', expect.any(Error));
        warn.mockRestore();
    });
});

describe('useVoiceRecognition', () => {
    let instances;
    class FakeRecognition {
        constructor() {
            instances.push(this);
            this.start = vi.fn(() => this.onstart?.());
            this.stop = vi.fn();
        }
    }
    const say = (recognition, transcript) =>
        act(() => recognition.onresult({ results: [[{ transcript: 'ignored' }], [{ transcript }]] }));

    beforeEach(() => {
        instances = [];
        vi.useFakeTimers();
        vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    const setup = (challenge = { type: 'reading', answer: 'SEE' }) => {
        const challengeRef = { current: challenge };
        const onCorrect = vi.fn();
        const onWrong = vi.fn();
        const hook = renderHook(() => useVoiceRecognition(challengeRef, onCorrect, onWrong));
        return { ...hook, challengeRef, onCorrect, onWrong };
    };

    it('listens in English and reports a right word, a homophone and a wrong word', () => {
        const { result, onCorrect, onWrong } = setup();
        act(() => result.current.startVoiceListener('reading', 'reading'));
        const [recognition] = instances;
        expect(recognition.lang).toBe('en-US');
        expect(recognition.continuous).toBe(true);
        expect(result.current.isListening).toBe(true);
        expect(result.current.spokenText).toBe('Listening...');

        say(recognition, 'see.');
        expect(result.current.spokenText).toBe('SEE');
        say(recognition, 'sea');
        expect(onCorrect).toHaveBeenCalledTimes(2);
        say(recognition, 'tree');
        expect(onWrong).toHaveBeenCalledWith('reading');
        say(recognition, 'a');
        expect(onWrong).toHaveBeenCalledOnce();
    });

    it('uses the battling skill when no target is given, and ignores other challenges', () => {
        const { result, onCorrect, onWrong, challengeRef } = setup({ type: 'reading', answer: 'CAT' });
        act(() => result.current.startVoiceListener(null, 'reading'));
        say(instances[0], 'cat');
        expect(onCorrect).toHaveBeenCalledWith('reading');
        say(instances[0], 'dog');
        expect(onWrong).toHaveBeenCalledWith('reading');

        challengeRef.current = { type: 'math', answer: '2' };
        say(instances[0], 'two');
        challengeRef.current = null;
        say(instances[0], 'two');
        expect(onCorrect).toHaveBeenCalledOnce();
    });

    it('starts only once, and not at all without speech recognition', () => {
        const { result } = setup();
        act(() => result.current.startVoiceListener('reading', 'reading'));
        act(() => result.current.startVoiceListener('reading', 'reading'));
        expect(instances).toHaveLength(1);

        vi.stubGlobal('webkitSpeechRecognition', undefined);
        const other = setup();
        act(() => other.result.current.startVoiceListener('reading', 'reading'));
        expect(instances).toHaveLength(1);
    });

    it('restarts by itself while a reading battle runs', () => {
        const { result } = setup();
        act(() => result.current.startVoiceListener('reading', 'reading'));
        act(() => instances[0].onend());
        expect(result.current.isListening).toBe(false);
        act(() => vi.advanceTimersByTime(100));
        expect(instances).toHaveLength(2);
        expect(result.current.isListening).toBe(true);
    });

    it('does not restart for a reading target outside its battle', () => {
        const { result } = setup();
        act(() => result.current.startVoiceListener('reading', null));
        act(() => instances[0].onend());
        act(() => vi.advanceTimersByTime(100));
        expect(instances).toHaveLength(1);
    });

    it('shows "Mic Off" when the mic stops for another skill', () => {
        const { result } = setup();
        act(() => result.current.startVoiceListener('math', 'math'));
        act(() => instances[0].onend());
        expect(result.current.spokenText).toBe('Mic Off');
    });

    it('reports a refused mic and ignores other errors', () => {
        const { result } = setup();
        act(() => result.current.startVoiceListener('reading', 'reading'));
        act(() => instances[0].onerror({ error: 'network' }));
        expect(result.current.isListening).toBe(true);
        act(() => instances[0].onerror({ error: 'not-allowed' }));
        expect(result.current.spokenText).toBe('Mic permission denied');
        expect(result.current.isListening).toBe(false);
    });

    it('logs a recognition that cannot start', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        class Broken extends FakeRecognition {
            constructor() {
                super();
                this.start = () => {
                    throw new Error('busy');
                };
            }
        }
        vi.stubGlobal('webkitSpeechRecognition', Broken);
        const { result } = setup();
        act(() => result.current.startVoiceListener('reading', 'reading'));
        expect(error).toHaveBeenCalledWith('[Speech Recognition] Failed to start:', expect.any(Error));
        error.mockRestore();
    });

    it('stops the mic, even when the browser throws while stopping', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { result } = setup();
        act(() => result.current.stopVoiceRecognition());
        expect(result.current.spokenText).toBe('Mic Off');

        act(() => result.current.startVoiceListener('reading', 'reading'));
        instances[0].stop.mockImplementation(() => {
            throw new Error('already stopped');
        });
        act(() => result.current.stopVoiceRecognition());
        expect(warn).toHaveBeenCalledWith('[Speech Recognition] Error stopping:', expect.any(Error));
        expect(result.current.isListening).toBe(false);
        warn.mockRestore();
    });

    it('toggles the mic on and off, and says when there is no mic', () => {
        const { result } = setup();
        act(() => result.current.toggleMicListener('reading', 'reading'));
        expect(result.current.isListening).toBe(true);
        act(() => result.current.toggleMicListener('reading', 'reading'));
        expect(result.current.isListening).toBe(false);
        expect(instances[0].stop).toHaveBeenCalledOnce();

        vi.stubGlobal('webkitSpeechRecognition', undefined);
        act(() => result.current.toggleMicListener('reading', 'reading'));
        expect(result.current.spokenText).toBe('Mic not available');
    });
});
