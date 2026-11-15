import { ApiClient } from './api.js';
import { ChatClient } from './chat-client.js';

const api = new ApiClient();
const authView = document.querySelector('#auth-view');
const chatView = document.querySelector('#chat-view');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const loginTab = document.querySelector('#login-tab');
const registerTab = document.querySelector('#register-tab');
const authStatus = document.querySelector('#auth-status');
const messageForm = document.querySelector('#message-form');
const messageInput = document.querySelector('#message-input');
const messageButton = messageForm.querySelector('button');
const messageList = document.querySelector('#message-list');
const socketBadge = document.querySelector('#socket-badge');
const chatStatus = document.querySelector('#chat-status');

let username = '';

const setAuthStatus = (message = '', error = false) => {
  authStatus.textContent = message;
  authStatus.className = `status${error ? ' is-error' : ''}`;
};

const setFormsBusy = (busy) => {
  document.querySelectorAll('.auth-form input, .auth-form button').forEach((control) => { control.disabled = busy; });
};

const chooseTab = (mode) => {
  const login = mode === 'login';
  loginForm.hidden = !login;
  registerForm.hidden = login;
  loginTab.classList.toggle('is-active', login);
  registerTab.classList.toggle('is-active', !login);
  loginTab.setAttribute('aria-selected', String(login));
  registerTab.setAttribute('aria-selected', String(!login));
  setAuthStatus();
};

const setSocketState = (live, label) => {
  socketBadge.classList.toggle('is-live', live);
  socketBadge.querySelector('b').textContent = label;
  messageInput.disabled = !live;
  messageButton.disabled = !live;
};

const addMessage = ({ sender = 'Участник', text = '', timestamp }) => {
  document.querySelector('#empty-message')?.remove();
  const item = document.createElement('li');
  item.className = 'message';
  const avatar = document.createElement('span');
  avatar.className = 'message-avatar';
  avatar.textContent = sender.slice(0, 1).toUpperCase();
  const body = document.createElement('div');
  const head = document.createElement('div');
  head.className = 'message-head';
  const author = document.createElement('strong');
  author.textContent = sender;
  const time = document.createElement('time');
  const date = new Date(Number(timestamp));
  time.textContent = Number.isNaN(date.getTime()) ? 'сейчас' : date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const copy = document.createElement('p');
  copy.textContent = text;
  head.append(author, time);
  body.append(head, copy);
  item.append(avatar, body);
  messageList.append(item);
  messageList.scrollTop = messageList.scrollHeight;
};

const chat = new ChatClient({
  onEvent(event) {
    if (event.type === 'AUTH_SUCCESS') {
      username = event.payload?.username ?? username;
      document.querySelector('#current-username').textContent = username;
      document.querySelector('#avatar').textContent = username.slice(0, 1).toUpperCase();
      setSocketState(true, 'В эфире');
      chatStatus.textContent = 'Соединение защищено';
      messageInput.focus();
    } else if (event.type === 'NEW_MESSAGE') {
      addMessage(event.payload ?? {});
    } else if (event.type === 'SOCKET_CLOSED') {
      setSocketState(false, 'Отключено');
      chatStatus.textContent = 'Соединение закрыто';
    } else if (event.type === 'SOCKET_ERROR' || event.type === 'PROTOCOL_ERROR') {
      chatStatus.textContent = event.payload?.message ?? 'Ошибка соединения';
    }
  },
});

const openChat = (user) => {
  username = user?.username ?? username;
  authView.hidden = true;
  chatView.hidden = false;
  document.querySelector('#current-username').textContent = username || 'участник';
  document.querySelector('#avatar').textContent = (username || 'U').slice(0, 1).toUpperCase();
  setSocketState(false, 'Подключение…');
  chatStatus.textContent = 'Авторизация WebSocket…';
  chat.connect(api.accessToken);
};

const submitAuth = (mode) => async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  setFormsBusy(true);
  setAuthStatus(mode === 'login' ? 'Входим…' : 'Создаём аккаунт…');
  try {
    const user = await api[mode](data.get('username').trim(), data.get('password'));
    form.reset();
    openChat(user);
  } catch (error) {
    setAuthStatus(error.message, true);
  } finally {
    setFormsBusy(false);
  }
};

loginTab.addEventListener('click', () => chooseTab('login'));
registerTab.addEventListener('click', () => chooseTab('register'));
loginForm.addEventListener('submit', submitAuth('login'));
registerForm.addEventListener('submit', submitAuth('register'));

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    chat.sendMessage(messageInput.value);
    messageInput.value = '';
    messageInput.focus();
  } catch (error) {
    chatStatus.textContent = error.message;
  }
});

document.querySelector('#logout-button').addEventListener('click', async () => {
  chat.disconnect();
  try { await api.logout(); } finally {
    chatView.hidden = true;
    authView.hidden = false;
    username = '';
    messageList.replaceChildren();
    const empty = document.createElement('li');
    empty.id = 'empty-message';
    empty.className = 'empty-message';
    empty.innerHTML = '<span>♪</span><strong>Канал пока тихий</strong><p>Первое сообщение задаст ритм разговору.</p>';
    messageList.append(empty);
    chooseTab('login');
    setAuthStatus('Вы вышли из чата.');
  }
});

const restoreSession = async () => {
  setAuthStatus('Проверяем сессию…');
  try {
    if (!api.accessToken) await api.refresh();
    const payload = JSON.parse(atob(api.accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    openChat({ username: payload.username ?? 'участник' });
  } catch {
    api.accessToken = null;
    setAuthStatus();
  }
};

restoreSession();
