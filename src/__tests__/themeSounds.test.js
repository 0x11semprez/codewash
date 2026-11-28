// The memory game plays the match or mismatch sound after every pair, sometimes several times in a row.
// These sounds must stay short in every theme, or they pile up.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const MAX_PAIR_SOUND_SECONDS = 1;

// Duration of an Ogg Vorbis or Opus file: the granule position of the last page divided by the sample rate.
const oggDuration = (buffer) => {
    let lastGranule = 0;
    for (let i = buffer.indexOf('OggS'); i !== -1; i = buffer.indexOf('OggS', i + 4)) {
        lastGranule = Number(buffer.readBigUInt64LE(i + 6));
    }
    const vorbis = buffer.indexOf('vorbis');
    const sampleRate = vorbis !== -1 ? buffer.readUInt32LE(vorbis + 11) : 48000;
    return lastGranule / sampleRate;
};

const themes = readdirSync(join(root, 'src/themes'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => [file.replace('.json', ''), JSON.parse(readFileSync(join(root, 'src/themes', file), 'utf8'))]);

describe('theme pair sounds', () => {
    it.each(themes.flatMap(([id, theme]) => ['match', 'mismatch'].map((name) => [id, name, theme.sounds?.[name]])))(
        '%s %s sound lasts at most one second',
        (id, name, file) => {
            expect(file).toBeTruthy();
            const seconds = oggDuration(readFileSync(join(root, 'public/assets/themes', id, file)));
            expect(seconds).toBeGreaterThan(0);
            expect(seconds).toBeLessThanOrEqual(MAX_PAIR_SOUND_SECONDS);
        },
    );
});
