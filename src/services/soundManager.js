/**
 * Sound Manager Utility
 * Centralized sound management for the game: theme music, UI sounds, enemy sounds and notes.
 * The active theme decides which files play (see setSoundTheme).
 */
import { DEFAULT_MUSIC, DEFAULT_SOUNDS, NOTE_SOUNDS } from '../constants/game/audio';

// Sounds of the active theme. setSoundTheme replaces them when the player picks a theme.
let themeSounds = { ...DEFAULT_SOUNDS };

// Mob name to folder name mapping (handles differences between display names and folder names)
const MOB_FOLDER_MAP = {
    // Hostile mobs
    Zombie: 'zombie',
    Boomer: 'creeper',
    Skeleton: 'skeleton',
    Spider: 'spider',
    'Shadow Walker': 'endermen',
    Blaze: 'blaze',
    'Sky Ghost': 'ghast',
    Slime: 'slime',
    Phantom: 'phantom',
    'Pig Warrior': 'piglin',
    'Tusk Beast': 'hoglin',
    Drowned: 'drowned',
    Pillager: 'pillager',
    Sorcerer: 'evoker',
    Guardian: 'guardian',
    'Lava Cube': 'magmacube',
    Witch: 'witch',
    // Boss mobs
    'Void Dragon': 'enderdragon',
    'Skull King': 'wither',
    Warden: 'warden',
    // Miniboss mobs
    'Elder Guardian': 'elderguardian',
    Ravager: 'ravager',
    'Dark Skeleton': 'wither_skeleton',
    'Tree Spirit': 'creaking',
    // Friendly mobs
    Cat: 'cat',
    Chicken: 'chicken',
    Cow: 'cow',
    Pig: 'pig',
    Sheep: 'sheep',
    Wolf: 'wolf',
    Dolphin: 'dolphin',
    Fox: 'fox',
    Panda: 'panda',
    Parrot: 'parrot',
    Horse: 'horse',
    Turtle: 'turtle',
    Rabbit: 'rabbit',
    Bunny: 'rabbit',
    'Mushroom Cow': 'mooshroom',
    'Polar Bear': 'polarbear',
    Llama: 'llama',
    Bat: 'bat',
    Bee: 'bee',
    Villager: 'villager',
    'Iron Golem': 'irongolem',
    'Wandering Trader': 'wandering_trader',
    Strider: 'strider',
};

// Class for managing BGM playback with shuffle
class BGMManager {
    constructor() {
        this.audio = null;
        this.volume = 0.3;
        this.isPlaying = false;
        this.currentTrackIndex = -1;
        this.tracks = [...DEFAULT_MUSIC];
    }

    // Switches to the playlist of another theme. Music that is playing moves to the new
    // playlist at once. Paused music starts from the new playlist next time.
    setTracks(tracks) {
        const next = tracks && tracks.length > 0 ? [...tracks] : [...DEFAULT_MUSIC];
        if (next.join('|') === this.tracks.join('|')) return;
        this.tracks = next;
        this.currentTrackIndex = -1;
        if (!this.audio) return;
        if (this.isPlaying) {
            this.playNextTrack();
        } else {
            this.audio.pause();
            this.audio = null;
        }
    }

    setVolume(vol) {
        this.volume = vol;
        if (this.audio) {
            this.audio.volume = vol;
        }
    }

    getRandomTrack() {
        // Get a random track that's different from the current one
        const availableIndices = this.tracks.map((_, i) => i).filter((i) => i !== this.currentTrackIndex);

        // If only one track or no other tracks available, return current
        if (availableIndices.length === 0) {
            return this.currentTrackIndex >= 0 ? this.currentTrackIndex : 0;
        }

        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        return availableIndices[randomIndex];
    }

    play() {
        if (!this.audio) {
            this.currentTrackIndex = this.getRandomTrack();
            this.audio = new Audio(this.tracks[this.currentTrackIndex]);
            this.audio.volume = this.volume;

            // When a track ends, play a new random track
            this.audio.addEventListener('ended', () => {
                this.playNextTrack();
            });
        }

        this.audio.play().catch(() => {});
        this.isPlaying = true;
    }

    playNextTrack() {
        this.currentTrackIndex = this.getRandomTrack();
        if (this.audio) {
            this.audio.src = this.tracks[this.currentTrackIndex];
            this.audio.volume = this.volume; // Ensure volume is set for new track
            this.audio.play().catch(() => {});
        }
    }

    pause() {
        if (this.audio) {
            this.audio.pause();
            this.isPlaying = false;
        }
    }

    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
}

// Singleton BGM manager instance
let bgmManagerInstance = null;

export const getBGMManager = () => {
    if (!bgmManagerInstance) {
        bgmManagerInstance = new BGMManager();
    }
    return bgmManagerInstance;
};

// SFX volume (separate from BGM)
let sfxVolume = 0.5;

export const setSfxVolume = (vol) => {
    sfxVolume = vol;
};

export const getSfxVolume = () => sfxVolume;

// Starts a sound. Some environments return nothing from play() or throw, so both cases call onFail.
const startAudio = (audio, onFail = () => {}) => {
    try {
        const result = audio.play();
        if (result && typeof result.catch === 'function') result.catch(onFail);
    } catch {
        onFail();
    }
};

const playFile = (path) => {
    if (!path) return;
    const audio = new Audio(path);
    audio.volume = sfxVolume;
    startAudio(audio);
};

/**
 * Use the music and sounds of a theme. Keys the theme does not set keep the default file.
 * @param {{ music?: string[], sounds?: Object<string, string> }} theme
 */
export const setSoundTheme = (theme) => {
    themeSounds = { ...DEFAULT_SOUNDS, ...(theme?.sounds || {}) };
    getBGMManager().setTracks(theme?.music);
};

/**
 * Play a UI sound of the active theme
 * @param {string} soundName - Key of the sound (click, death, fail, levelUp, ...)
 */
export const playUISound = (soundName) => playFile(themeSounds[soundName]);

export const playActionCardLeft = () => playUISound('cardLeft');
export const playActionCardRight = () => playUISound('cardRight');
export const playClick = () => playUISound('click');
// Player death
export const playDeath = () => playUISound('death');
// Player takes damage but does not die
export const playFail = () => playUISound('fail');
export const playLevelUp = () => playUISound('levelUp');
export const playNotification = () => playUISound('notification');
export const playSuccessfulHit = () => playUISound('hit');
// Achievement unlocks use the notification sound
export const playAchievement = () => playUISound('notification');
// Memory and pattern games: a found pair or a wrong answer
export const playMatch = () => playUISound('match');
export const playMismatch = () => playUISound('mismatch');

/**
 * Play the note of a pattern piece. Falls back to a click when the piece has no note.
 * @param {number} index - Position of the piece in the theme's pattern pieces
 */
export const playNote = (index) => {
    const path = NOTE_SOUNDS[index];
    if (!path) {
        playClick();
        return;
    }
    const audio = new Audio(path);
    audio.volume = sfxVolume;
    startAudio(audio, playClick);
};

/**
 * Get the folder name for a mob
 * @param {string} mobName - Display name of the mob
 * @returns {string|null} - Folder name or null if not found/mapped
 */
const getMobFolder = (mobName) => {
    // Only use explicit mappings to avoid loading non-existent files
    return MOB_FOLDER_MAP[mobName] || null;
};

/**
 * Play an enemy hurt sound. A theme with its own enemyHurt sound uses it for every enemy.
 * Otherwise the default enemies play their own file.
 * @param {string} mobName - Display name of the enemy
 */
export const playMobHurt = (mobName) => {
    if (themeSounds.enemyHurt) {
        playFile(themeSounds.enemyHurt);
        return;
    }
    const folder = getMobFolder(mobName);
    if (folder) playFile(`assets/sounds/mob/mob/${folder}/hurt.wav`);
};

/**
 * Play an enemy defeat sound, with the same rules as playMobHurt.
 * @param {string} mobName - Display name of the enemy
 */
export const playMobDeath = (mobName) => {
    if (themeSounds.enemyDefeat) {
        playFile(themeSounds.enemyDefeat);
        return;
    }
    const folder = getMobFolder(mobName);
    if (folder) playFile(`assets/sounds/mob/mob/${folder}/death.wav`);
};

// Keys accepted by playUISound
export const UI_SOUND_NAMES = Object.keys(DEFAULT_SOUNDS);
