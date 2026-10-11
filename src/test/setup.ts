import { vi } from 'vitest';

const createMatchMedia = (query: string): MediaQueryList =>
  ({
    matches: false,
    media: query,
    onchange: undefined,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }) as unknown as MediaQueryList;

if (typeof globalThis.matchMedia !== 'function') {
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    writable: true,
    value: createMatchMedia,
  });
}

if (typeof globalThis.requestAnimationFrame !== 'function') {
  Object.defineProperties(globalThis, {
    requestAnimationFrame: {
      configurable: true,
      writable: true,
      value: (callback: FrameRequestCallback): number =>
        globalThis.setTimeout(() => callback(performance.now()), 0) as unknown as number,
    },
    cancelAnimationFrame: {
      configurable: true,
      writable: true,
      value: (handle: number): void => globalThis.clearTimeout(handle),
    },
  });
}
