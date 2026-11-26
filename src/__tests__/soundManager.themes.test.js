import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import {
    setSoundTheme,
    getBGMManager,
    playClick,
    playMatch,
    playMismatch,
    playSuccessfulHit,
    playLevelUp,
    playDeath,
    playFail,
    playNotification,
    playAchievement,
    playActionCardLeft,
    playActionCardRight,
    playMobHurt,
    playMobDeath,
    playNote,
    playUISound,
} from '../services/soundManager';
import { THEME_CONFIG, DEFAULT_MUSIC, DEFAULT_SOUNDS, NOTE_SOUNDS } from '../constants/gameData';

const played = [];

class FakeAudio {
    constructor(src = '') {
        this.src = src;
        this.volume = 1;
        this.paused = true;
    }
    play() {
        played.push(this.src);
        this.paused = false;
        return Promise.resolve();
    }
    pause() {
        this.paused = true;
    }
    addEventListener() {}
}

vi.stubGlobal('Audio', FakeAudio);

const space = THEME_CONFIG.space;
// A theme with no sounds and no music uses the default files.
const plain = {};
const blocks = THEME_CONFIG.blocks;

beforeEach(() => {
    played.length = 0;
    setSoundTheme(plain);
    const bgm = getBGMManager();
    bgm.pause();
    bgm.audio = null;
    played.length = 0;
});

afterAll(() => setSoundTheme(blocks));

describe('UI sounds follow the theme', () => {
    it('plays the default files for a theme without sounds', () => {
        playClick();
        playMatch();
        playMismatch();
        expect(played).toEqual([DEFAULT_SOUNDS.click, DEFAULT_SOUNDS.match, DEFAULT_SOUNDS.mismatch]);
    });

    it('plays the theme files after a theme change', () => {
        setSoundTheme(space);
        [
            playClick,
            playSuccessfulHit,
            playLevelUp,
            playDeath,
            playFail,
            playNotification,
            playAchievement,
            playActionCardLeft,
            playActionCardRight,
            playMatch,
            playMismatch,
        ].forEach((play) => play());
        expect(played).toHaveLength(11);
        played.forEach((src) => expect(src).toMatch(/^assets\/themes\/space\/sounds\//));
    });

    it('keeps the default file for a sound the theme does not set', () => {
        setSoundTheme({ sounds: { click: 'x.ogg' } });
        playClick();
        playFail();
        expect(played).toEqual(['x.ogg', DEFAULT_SOUNDS.fail]);
        setSoundTheme(undefined);
        playClick();
        expect(played[2]).toBe(DEFAULT_SOUNDS.click);
    });
});

describe('enemy sounds', () => {
    it('uses the folder of a default enemy when the theme has no enemy sounds', () => {
        playMobHurt('Zombie');
        playMobDeath('Zombie');
        playMobHurt('Unknown Thing');
        expect(played).toEqual(['assets/sounds/mob/mob/zombie/hurt.wav', 'assets/sounds/mob/mob/zombie/death.wav']);
    });

    it('uses the theme enemy sounds for every enemy', () => {
        setSoundTheme(space);
        playMobHurt('Drone');
        playMobDeath('Zombie');
        expect(played).toEqual([space.sounds.enemyHurt, space.sounds.enemyDefeat]);
    });
});

describe('pattern notes', () => {
    it('plays one note per piece and a click when there is no note', () => {
        playNote(0);
        playNote(7);
        playNote(42);
        expect(played).toEqual([NOTE_SOUNDS[0], NOTE_SOUNDS[7], DEFAULT_SOUNDS.click]);
    });
});

describe('music follows the theme', () => {
    it('switches the playlist and the playing track at once', () => {
        const bgm = getBGMManager();
        bgm.play();
        expect(DEFAULT_MUSIC).toContain(bgm.audio.src);
        setSoundTheme(space);
        expect(bgm.tracks).toEqual(space.music);
        expect(space.music).toContain(bgm.audio.src);
        expect(bgm.isPlaying).toBe(true);
    });

    it('drops the paused track so the next play uses the new playlist', () => {
        const bgm = getBGMManager();
        bgm.play();
        bgm.pause();
        setSoundTheme(space);
        expect(bgm.audio).toBeNull();
        bgm.play();
        expect(space.music).toContain(bgm.audio.src);
    });

    it('does nothing when the playlist is the same', () => {
        const bgm = getBGMManager();
        bgm.play();
        const audio = bgm.audio;
        setSoundTheme(plain);
        expect(bgm.audio).toBe(audio);
    });

    it('goes back to the default music for a theme without music', () => {
        setSoundTheme(space);
        setSoundTheme({});
        expect(getBGMManager().tracks).toEqual(DEFAULT_MUSIC);
    });
});

describe('audio that cannot play', () => {
    it('does not throw when play() returns nothing or throws', () => {
        class Silent {
            play() {
                return undefined;
            }
        }
        class Broken {
            play() {
                throw new Error('not supported');
            }
        }
        vi.stubGlobal('Audio', Silent);
        expect(() => playClick()).not.toThrow();
        vi.stubGlobal('Audio', Broken);
        expect(() => playNote(0)).not.toThrow();
        vi.stubGlobal('Audio', FakeAudio);
    });
});

describe('sounds without a file', () => {
    it('plays nothing for a sound name the theme does not know', () => {
        playUISound('doesNotExist');
        expect(played).toEqual([]);
    });
});

describe('music playlist', () => {
    it('starts another track when the current one ends', () => {
        const listeners = {};
        class ListeningAudio extends FakeAudio {
            addEventListener(name, callback) {
                listeners[name] = callback;
            }
        }
        vi.stubGlobal('Audio', ListeningAudio);
        try {
            const bgm = getBGMManager();
            bgm.play();
            expect(played).toHaveLength(1);
            listeners.ended();
            expect(played).toHaveLength(2);
            expect(DEFAULT_MUSIC).toContain(played[1]);
        } finally {
            vi.stubGlobal('Audio', FakeAudio);
        }
    });
});
