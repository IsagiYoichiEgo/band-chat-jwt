import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../js/api.js';

const response = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const memoryStorage = () => {
  let value = null;
  return {
    getItem: () => value,
    setItem: (_key, next) => { value = next; },
    removeItem: () => { value = null; },
  };
};

test('registration stores access and includes the refresh cookie credentials', async () => {
  const calls = [];
  const store = memoryStorage();
  const api = new ApiClient({
    storage: store,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return response(201, { access: 'chat-access', user: { username: 'nika' } });
    },
  });

  await api.register('nika', 'secret12');

  assert.equal(api.accessToken, 'chat-access');
  assert.equal(calls[0].options.credentials, 'include');
});

test('refresh replaces the access token from the HttpOnly-cookie flow', async () => {
  const store = memoryStorage();
  const api = new ApiClient({ storage: store, fetchImpl: async () => response(200, { access: 'fresh' }) });

  const token = await api.refresh();

  assert.equal(token, 'fresh');
  assert.equal(api.accessToken, 'fresh');
});

test('logout always clears the access token', async () => {
  const store = memoryStorage();
  store.setItem('access', 'old');
  const api = new ApiClient({ storage: store, fetchImpl: async () => response(500, { detail: 'error' }) });

  await api.logout();

  assert.equal(api.accessToken, null);
});
