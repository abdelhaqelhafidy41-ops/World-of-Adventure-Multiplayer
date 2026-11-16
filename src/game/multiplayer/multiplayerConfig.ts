export type AppEnvironment = 'development' | 'staging' | 'production';

export interface MultiplayerEnvironmentConfig {
  environment: AppEnvironment;
  multiplayerUrl: string | null;
  publicAppUrl: string | null;
}

function normalizeHttpUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.origin + parsed.pathname.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function resolveAppEnvironment(): AppEnvironment {
  const raw =
    typeof import.meta !== 'undefined'
      ? String(import.meta.env?.VITE_APP_ENV ?? '').trim().toLowerCase()
      : '';
  if (raw === 'production' || raw === 'prod') return 'production';
  if (raw === 'staging' || raw === 'stage') return 'staging';
  if (raw === 'development' || raw === 'dev') return 'development';

  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
    return 'production';
  }
  return 'development';
}

/**
 * Resolves the public Cloudflare Worker / Durable Objects multiplayer endpoint.
 * Never reads or returns secret keys; only public HTTP(S) endpoints are accepted.
 */
export function resolveMultiplayerServerUrl(): string | null {
  if (typeof import.meta === 'undefined') return null;
  const primary = normalizeHttpUrl(import.meta.env?.VITE_MULTIPLAYER_URL);
  if (primary) return primary;
  return normalizeHttpUrl(import.meta.env?.VITE_MULTIPLAYER_WORKER_URL);
}

/**
 * Resolves the public web application URL used to build shareable room invite links.
 */
export function resolvePublicAppUrl(): string | null {
  if (typeof import.meta !== 'undefined') {
    const configured =
      normalizeHttpUrl(import.meta.env?.VITE_PUBLIC_APP_URL) ??
      normalizeHttpUrl(import.meta.env?.VITE_APP_URL);
    if (configured) return configured;
  }

  if (
    typeof window !== 'undefined' &&
    typeof window.location?.origin === 'string' &&
    /^https?:\/\//i.test(window.location.origin)
  ) {
    return window.location.origin.replace(/\/+$/, '');
  }

  return null;
}

export function getMultiplayerEnvironmentConfig(): MultiplayerEnvironmentConfig {
  return {
    environment: resolveAppEnvironment(),
    multiplayerUrl: resolveMultiplayerServerUrl(),
    publicAppUrl: resolvePublicAppUrl(),
  };
}
