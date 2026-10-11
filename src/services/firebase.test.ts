import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  initializeApp: vi.fn((config?: unknown) => ({ name: 'firebase-app', config })),
  getAuth: vi.fn((app?: unknown) => ({ name: 'firebase-auth', app })),
}));

vi.mock('firebase/app', () => ({ initializeApp: mocks.initializeApp }));
vi.mock('firebase/auth', () => ({ getAuth: mocks.getAuth }));

describe('firebase initialization', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.initializeApp.mockClear();
    mocks.getAuth.mockClear();
  });

  it('initializes the app and exposes the auth instance', async () => {
    const { app, auth } = await import('@/services/firebase');

    expect(mocks.initializeApp).toHaveBeenCalledTimes(1);
    expect(mocks.getAuth).toHaveBeenCalledTimes(1);
    expect(app).toMatchObject({ name: 'firebase-app' });
    expect(auth).toMatchObject({ name: 'firebase-auth' });
  });

  it('passes the Firebase project configuration to initializeApp', async () => {
    await import('@/services/firebase');

    const config = mocks.initializeApp.mock.calls[0][0] as unknown as Record<string, string>;
    expect(config.projectId).toBeTruthy();
    expect(config.apiKey).toBeTruthy();
    expect(config.authDomain).toBeTruthy();
    expect(config.appId).toBeTruthy();
  });
});
