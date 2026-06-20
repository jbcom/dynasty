/**
 * Key-value storage abstraction. Backed by Capacitor Preferences on device and
 * localStorage in the browser; an in-memory fallback keeps tests and SSR safe.
 */
export interface Storage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/** In-memory storage — default for tests and any environment without persistence. */
export function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    async get(key) {
      return map.has(key) ? (map.get(key) as string) : null;
    },
    async set(key, value) {
      map.set(key, value);
    },
    async remove(key) {
      map.delete(key);
    },
  };
}

/** localStorage-backed storage (browser without Capacitor). */
export function localStorageBacked(): Storage {
  return {
    async get(key) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null; // disabled in private mode / access denied
      }
    },
    async set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch {
        // QuotaExceededError or storage disabled — autosave is best-effort.
      }
    },
    async remove(key) {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}

/**
 * Capacitor Preferences storage. Imported lazily so the sim/test bundles never
 * pull in the native plugin. Falls back to localStorage if Preferences is absent.
 */
export async function capacitorStorage(): Promise<Storage> {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    return {
      async get(key) {
        const { value } = await Preferences.get({ key });
        return value ?? null;
      },
      async set(key, value) {
        await Preferences.set({ key, value });
      },
      async remove(key) {
        await Preferences.remove({ key });
      },
    };
  } catch {
    return typeof localStorage !== "undefined" ? localStorageBacked() : memoryStorage();
  }
}
