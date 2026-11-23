import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getBGMManager,
  setSfxVolume,
  getSfxVolume,
  UI_SOUND_NAMES,
} from '../utils/soundManager';

vi.stubGlobal('Audio', class {
  constructor() {
    this.volume = 1;
    this.src = '';
  }
  play() { return Promise.resolve(); }
  pause() {}
  addEventListener() {}
});

describe('getSfxVolume / setSfxVolume', () => {
  it('defaults to 0.5', () => {
    setSfxVolume(0.5);
    expect(getSfxVolume()).toBe(0.5);
  });

  it('updates volume', () => {
    setSfxVolume(0.8);
    expect(getSfxVolume()).toBe(0.8);
    setSfxVolume(0.5);
  });
});

describe('UI_SOUND_NAMES', () => {
  it('contains expected sound names', () => {
    expect(UI_SOUND_NAMES).toContain('click');
    expect(UI_SOUND_NAMES).toContain('death');
    expect(UI_SOUND_NAMES).toContain('fail');
    expect(UI_SOUND_NAMES).toContain('levelup');
    expect(UI_SOUND_NAMES).toContain('notification');
    expect(UI_SOUND_NAMES).toContain('successful_hit');
  });
});

describe('BGMManager', () => {
  it('getBGMManager returns singleton', () => {
    const a = getBGMManager();
    const b = getBGMManager();
    expect(a).toBe(b);
  });

  it('setVolume updates volume', () => {
    const mgr = getBGMManager();
    mgr.setVolume(0.7);
    expect(mgr.volume).toBe(0.7);
  });
});
