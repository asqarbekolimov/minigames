# Mini Games

**Demo:** [link](https://rs-school.github.io/minigames/)

### Tech Stack

- **TypeScript**
- **SCSS**
- **Vite**

### Firebase setup

1. **Create a project** in the [Firebase Console](https://console.firebase.google.com/).
2. **Add a Web app** and copy its SDK config (Project settings → Your apps → Web app → SDK setup and configuration).
3. **Enable sign-in providers:** Authentication → Sign-in method → enable **Email/Password** and **Google**.
4. **Authorize your domains:** Authentication → Settings → Authorized domains — add every domain that serves the app (localhost is allowed by default; add your deployment domain, e.g. `rs-school.github.io`).
5. **Configure the environment:** add your project's values to a local `.env` file — `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.

The SDK is initialized in `src/services/firebase.ts`, which exports the `app` and `auth`
instances used by the authentication flow. `src/services/auth.ts` handles provider
sign-in (Google) and the app-session lifecycle, while `src/services/session.ts`
persists the session and enforces its expiration.

> App-session lifetime and recovery are defined once in the Story 4 Architecture Note.
> Do not configure them as Firebase settings — use the SDK defaults.
