import test from 'node:test';
import assert from 'node:assert/strict';
import { ChatClient } from '../js/chat-client.js';

class FakeSocket {
  constructor(url) {
    this.url = url;
    this.sent = [];
    this.readyState = 1;
  }
  send(value) { this.sent.push(JSON.parse(value)); }
  close() { this.readyState = 3; this.onclose?.(); }
  open() { this.onopen?.(); }
  message(value) { this.onmessage?.({ data: JSON.stringify(value) }); }
}

test('sends AUTH as the first frame after opening', () => {
  let socket;
  const client = new ChatClient({
    socketFactory: (url) => (socket = new FakeSocket(url)),
  });

  client.connect('access-1');
  socket.open();

  assert.deepEqual(socket.sent, [{ type: 'AUTH', payload: { token: 'access-1' } }]);
});

test('blocks messages until AUTH_SUCCESS and then sends trimmed text', () => {
  let socket;
  const client = new ChatClient({ socketFactory: (url) => (socket = new FakeSocket(url)) });
  client.connect('access-1');
  socket.open();

  assert.throws(() => client.sendMessage('hello'), /авторизац/i);
  socket.message({ type: 'AUTH_SUCCESS', payload: { username: 'mira' } });
  client.sendMessage('  hello band  ');

  assert.deepEqual(socket.sent[1], { type: 'CHAT_MESSAGE', payload: { text: 'hello band' } });
});

test('emits incoming messages and becomes unauthorized after close', () => {
  let socket;
  const events = [];
  const client = new ChatClient({
    socketFactory: (url) => (socket = new FakeSocket(url)),
    onEvent: (event) => events.push(event),
  });
  client.connect('access-1');
  socket.open();
  socket.message({ type: 'AUTH_SUCCESS', payload: { username: 'mira' } });
  socket.message({ type: 'NEW_MESSAGE', payload: { sender: 'leo', text: 'ready?', timestamp: 123 } });
  socket.close();

  assert.equal(events.some((event) => event.type === 'NEW_MESSAGE'), true);
  assert.equal(client.isAuthorized, false);
});
