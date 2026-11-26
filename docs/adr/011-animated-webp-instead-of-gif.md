# ADR-011: Use lossless animated WebP instead of GIF

## Status

Accepted

## Date

2026-11-25

## Context

The game shows animated sprites for mobs, items, chests and two skill icons. They were 32 GIF files under `public/assets/`, 36.9 MB in total. `items/` and `mobs/` held about 18 MB each. One file, `items/book.gif`, weighed 12.2 MB. It has 1,650 frames of 160x160 pixels.

GIF compresses badly. It stores at most 256 colors per frame and uses LZW, which is weak on these frames. Large GIFs also cost time and memory to decode, and the Electron build ships every one of them.

The sprites are pixel art. A lossy encoder would blur the hard pixel edges and shift colors. Any new format must keep each pixel, the transparency and the endless loop.

Chromium supports animated WebP. The browser and the Electron app both use Chromium, so no fallback is needed.

## Decision

Convert every animated GIF to lossless animated WebP with `scripts/convert-gifs.mjs`.

- The script uses `ffmpeg` with the `libwebp_anim` encoder: `-lossless 1 -compression_level 6 -loop 0 -pix_fmt bgra`. Lossless mode keeps each pixel. `bgra` keeps the alpha channel. `-loop 0` loops forever.
- The script tries every GIF, with no size threshold. It replaces a GIF only when the WebP is smaller, then deletes the GIF. All 32 files got smaller.
- The script rewrites each `assets/....gif` path in `src/` and `index.html` to `.webp`.
- `ffmpeg` was already installed, so no npm package was added. ImageMagick gave close sizes but took about twice as long.

We checked the output. For `frog`, `warden` and `enderdragon`, every decoded frame matches the GIF pixel for pixel, and the frame count and delays are the same. We tried near-lossless (ImageMagick, `near-lossless=60`) on `axe.gif`. The file was the same size as lossless, so we kept plain lossless.

A test in `src/__tests__/assetPaths.test.js` checks two things. Every image path in `gameData` and in `src/` must exist under `public/`. No referenced GIF may be larger than 200 KB.

## Consequences

### Positive

- Animated sprites went from 36.9 MB to 21.5 MB (-42 %). Mobs went from 16.8 MB to 8.3 MB.
- The pixel art looks the same, since the encoding is lossless.
- The asset path test also catches broken image paths, like the missing theme images of DEBT-021.

### Negative

- `items/book.webp` is still 8.3 MB, and `axe`, `hoe` and `ender_chest` are still above 0.8 MB. Their size comes from long loops: `book` has 1,650 frames, `axe` and `hoe` have 825, and `ender_chest` has 202. A shorter loop, or a 16x16 source scaled up in CSS, would cut them further. That changes the art or the CSS, so it is left for later.
- Rerunning the script needs `ffmpeg` built with `libwebp`. It is not an npm dependency.
- WebP needs a recent browser. Old Safari (before 14) cannot show it. The game targets Chromium, so this is accepted.
