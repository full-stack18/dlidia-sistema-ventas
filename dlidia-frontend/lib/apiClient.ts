import { API_URL } from './api';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('dlidia_token')
      : null;

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const ruta = path.startsWith('/') ? path : `/${path}`;

  const response = await fetch(`${API_URL}${ruta}`, {
    ...options,
    headers,
    cache: options.cache ?? 'no-store'
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const mensaje =
      typeof data?.error === 'string'
        ? data.error
        : `La solicitud falló (HTTP ${response.status})`;

    throw new Error(mensaje);
  }

  return data as T;
}