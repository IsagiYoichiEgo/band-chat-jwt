import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { freshAccess, getAccessToken } from './api';

interface Message { sender: string; text: string; timestamp: number; }
export default function Chat() {
  const socket = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Подключение…');
  const [attempt, setAttempt] = useState(0);
  const [username, setUsername] = useState('');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout>;
    setReady(false); setStatus('Подключение…');
    async function connect() {
      try {
        const token = attempt === 0 ? getAccessToken() ?? await freshAccess() : await freshAccess();
        if (!active) return;
        ws = new WebSocket('wss://inai-col3.fishrungames.com/chat/');
        socket.current = ws;
        timer = setTimeout(() => { if (active) { setStatus('Сервер не подтвердил вход. Повторите подключение.'); ws?.close(); } }, 15000);
        ws.onopen = () => { if (active) ws?.send(JSON.stringify({ type: 'AUTH', payload: { token } })); };
        ws.onmessage = ({ data }) => {
          if (!active) return;
          try {
            const event = JSON.parse(String(data));
            if (event.type === 'AUTH_SUCCESS' && typeof event.payload?.username === 'string') {
              clearTimeout(timer); setUsername(event.payload.username); setReady(true); setStatus('Подключено');
            } else if (event.type === 'NEW_MESSAGE') {
              const value = event.payload;
              if (typeof value?.sender === 'string' && typeof value.text === 'string' && typeof value.timestamp === 'number') {
                setMessages((list) => [...list, value]);
              }
            }
          } catch { setStatus('Неверный ответ сервера.'); }
        };
        ws.onerror = () => { if (active) setStatus('Ошибка соединения. Повторите подключение.'); };
        ws.onclose = () => { clearTimeout(timer); if (active) { setReady(false); setStatus('Соединение закрыто. Подключитесь снова.'); } };
      } catch (error) { if (active) setStatus(error instanceof Error ? error.message : 'Не удалось подключиться.'); }
    }
    void connect();
    return () => { active = false; clearTimeout(timer); if (socket.current === ws) socket.current = null; if (ws) { ws.onopen = null; ws.onclose = null; ws.onmessage = null; ws.onerror = null; ws.close(); } };
  }, [attempt]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [messages]);
  function send(event: FormEvent) {
    event.preventDefault();
    if (!ready || socket.current?.readyState !== WebSocket.OPEN || !text.trim()) return;
    socket.current.send(JSON.stringify({ type: 'CHAT_MESSAGE', payload: { text: text.trim() } }));
    setText('');
  }
  return <main className="page-width profile-page">
    <h1>Чат группы Thunder bend</h1>
    <p role="status">{status}{ready && ` · ${username}`}</p>
    {!ready && <button className="button button-outline" onClick={() => setAttempt((value) => value + 1)}>Подключиться снова</button>}
    <section className="profile-card" aria-label="Сообщения чата" style={{ maxHeight: '50vh', overflowY: 'auto', marginBlock: 20 }}>
      {messages.length === 0 && <p>Пока нет сообщений.</p>}
      <div role="log" aria-live="polite">{messages.map((message, index) => <article key={index} style={{ borderBottom: '1px solid #555', paddingBlock: 12 }}>
        <strong>{message.sender}</strong>{' '}<time dateTime={new Date(message.timestamp).toISOString()}>{new Date(message.timestamp).toLocaleTimeString('ru-RU')}</time>
        <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.text}</p>
      </article>)}</div><div ref={end} />
    </section>
    <form onSubmit={send}><label htmlFor="message">Сообщение</label>
      <input id="message" value={text} disabled={!ready} onChange={(event) => setText(event.target.value)} autoComplete="off" />
      <button className="button button-accent" disabled={!ready || !text.trim()}>Отправить</button>
    </form>
  </main>;
}
