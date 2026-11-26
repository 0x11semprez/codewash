#!/usr/bin/env node
// Convert animated GIFs under public/ to lossless animated WebP.
//
// Usage:
//   node scripts/convert-gifs.mjs            convert, replace GIFs, update references
//   node scripts/convert-gifs.mjs --dry-run  only print what would change
//
// Needs ffmpeg built with libwebp (encoder "libwebp_anim").
// See docs/adr/011-animated-webp-instead-of-gif.md for the reasons.
//
// Rules:
// - Every GIF is tried. There is no size threshold for conversion.
// - Encoding is lossless, so pixel art stays exact. Transparency and the
//   infinite loop are kept.
// - A GIF is replaced only when the WebP is smaller. Otherwise it stays.
// - References like 'assets/foo/bar.gif' in src/ and index.html are rewritten
//   to '.webp' for every replaced file.

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC_DIR = join(ROOT, 'public');
const REFERENCE_ROOTS = [join(ROOT, 'src'), join(ROOT, 'index.html')];
const REFERENCE_EXT = /\.(jsx?|tsx?|css|html)$/;
const DRY_RUN = process.argv.includes('--dry-run');

function walk(path, filter) {
    const stat = statSync(path);
    if (stat.isFile()) return filter(path) ? [path] : [];
    return readdirSync(path).flatMap((name) => (name === 'node_modules' ? [] : walk(join(path, name), filter)));
}

function kb(bytes) {
    return `${(bytes / 1024).toFixed(0)} KB`;
}

function encode(gifPath, webpPath) {
    execFileSync(
        'ffmpeg',
        [
            '-v', 'error', '-y',
            '-i', gifPath,
            '-c:v', 'libwebp_anim',
            '-lossless', '1',
            '-compression_level', '6',
            '-loop', '0',
            '-pix_fmt', 'bgra',
            webpPath,
        ],
        { stdio: 'inherit' }
    );
}

function main() {
    let encoders = '';
    try {
        encoders = execFileSync('ffmpeg', ['-hide_banner', '-encoders'], { stdio: 'pipe' }).toString();
    } catch {
        // ffmpeg is not installed; handled below.
    }
    if (!encoders.includes('libwebp_anim')) {
        console.error('ffmpeg with the libwebp_anim encoder is required.');
        process.exit(1);
    }

    const gifs = walk(PUBLIC_DIR, (p) => p.endsWith('.gif')).sort();
    const replaced = [];
    let before = 0;
    let after = 0;

    for (const gif of gifs) {
        const rel = relative(PUBLIC_DIR, gif).split(sep).join('/');
        const webp = gif.replace(/\.gif$/, '.webp');
        const tmp = `${webp}.tmp.webp`;
        const gifSize = statSync(gif).size;
        encode(gif, tmp);
        const webpSize = statSync(tmp).size;
        before += gifSize;

        if (webpSize < gifSize && !DRY_RUN) {
            renameSync(tmp, webp);
            rmSync(gif);
            replaced.push(rel);
            after += webpSize;
        } else {
            rmSync(tmp);
            after += webpSize < gifSize ? webpSize : gifSize;
            if (webpSize < gifSize) replaced.push(rel);
        }
        const verdict = webpSize < gifSize ? 'replace' : 'keep gif';
        console.log(`${rel.padEnd(48)} ${kb(gifSize).padStart(9)} -> ${kb(webpSize).padStart(9)}  ${verdict}`);
    }

    console.log(`\nTotal: ${kb(before)} -> ${kb(after)} (${replaced.length}/${gifs.length} replaced)`);

    const sources = REFERENCE_ROOTS.flatMap((p) => walk(p, (f) => REFERENCE_EXT.test(f)));
    for (const file of sources) {
        const text = readFileSync(file, 'utf8');
        let next = text;
        for (const rel of replaced) {
            next = next.split(rel).join(rel.replace(/\.gif$/, '.webp'));
        }
        if (next !== text) {
            console.log(`${DRY_RUN ? 'would update' : 'updated'} ${relative(ROOT, file)}`);
            if (!DRY_RUN) writeFileSync(file, next);
        }
    }
}

main();
