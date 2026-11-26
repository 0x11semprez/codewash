// Default music and sound effects. A theme that lists no music or no sound uses these files.
export const DEFAULT_MUSIC = [
    'assets/sounds/bgm/calm1.mp3',
    'assets/sounds/bgm/calm2.mp3',
    'assets/sounds/bgm/calm3.mp3',
    'assets/sounds/bgm/piano1.mp3',
    'assets/sounds/bgm/piano2.mp3',
    'assets/sounds/bgm/piano3.mp3',
];

// Keys a theme can set in its "sounds" list. enemyHurt and enemyDefeat have no default:
// without them, the default enemies play their own sounds (see services/soundManager.js).
export const SOUND_KEYS = [
    'click',
    'cardLeft',
    'cardRight',
    'hit',
    'fail',
    'death',
    'levelUp',
    'notification',
    'match',
    'mismatch',
    'enemyHurt',
    'enemyDefeat',
];

export const DEFAULT_SOUNDS = {
    click: 'assets/sounds/ui/ui/click.wav',
    cardLeft: 'assets/sounds/ui/ui/actioncard_left.wav',
    cardRight: 'assets/sounds/ui/ui/actioncard_right.wav',
    hit: 'assets/sounds/ui/ui/successful_hit.wav',
    fail: 'assets/sounds/ui/ui/fail.wav',
    death: 'assets/sounds/ui/ui/death.wav',
    levelUp: 'assets/sounds/ui/ui/levelup.wav',
    notification: 'assets/sounds/ui/ui/notification.wav',
    match: 'assets/sounds/ui/ui/successful_hit.wav',
    mismatch: 'assets/sounds/ui/ui/fail.wav',
};

// One note per pattern piece, in piece order. Shared by every theme.
export const NOTE_SOUNDS = ['c4', 'd4', 'e4', 'f4', 'g4', 'a4', 'b4', 'g5'].map(
    (note) => `assets/sounds/notes/${note}.wav`,
);
