const BASE_URL = 'https://inai-col3.fishrungames.com';
const ACCESS_KEY = 'band_chat_access_token';

const readJson = async (response) => {
  try { return await response.json(); } catch { return {}; }
};

const getError = (body, fallback) => {
  if (typeof body?.detail === 'string') return body.detail;
  const message = Object.values(body ?? {}).flat().find((value) => typeof value === 'string');
  return message ?? fallback;
};

export class ApiClient {
  constructor({ baseUrl = BASE_URL, fetchImpl = globalThis.fetch, storage = globalThis.sessionStorage } = {}) {
    this.baseUrl = baseUrl;
    this.fetch = fetchImpl;
    this.storage = storage;
  }

  get accessToken() {
    return this.storage.getItem(ACCESS_KEY) ?? this.storage.getItem('access');
  }

  set accessToken(value) {
    if (value) this.storage.setItem(ACCESS_KEY, value);
    else {
      this.storage.removeItem(ACCESS_KEY);
      this.storage.removeItem('access');
    }
  }

  async request(path, options = {}) {
    const response = await this.fetch(`${this.baseUrl}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    return { response, body: await readJson(response) };
  }

  async authenticate(path, username, password) {
    const { response, body } = await this.request(path, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) throw new Error(getError(body, 'Не удалось войти.'));
    this.accessToken = body.access;
    return body.user ?? { username };
  }

  register(username, password) {
    return this.authenticate('/api/register/', username, password);
  }

  login(username, password) {
    return this.authenticate('/api/login/', username, password);
  }

  async refresh() {
    const { response, body } = await this.request('/api/token/refresh/', { method: 'POST' });
    if (!response.ok || !body.access) {
      this.accessToken = null;
      throw new Error(getError(body, 'Сессия закончилась. Войдите снова.'));
    }
    this.accessToken = body.access;
    return body.access;
  }

  async logout() {
    try {
      await this.request('/api/logout/', { method: 'POST' });
    } finally {
      this.accessToken = null;
    }
  }
}

export { ACCESS_KEY, BASE_URL };
