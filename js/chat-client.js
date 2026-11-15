export const CHAT_URL = 'wss://inai-col3.fishrungames.com/chat/';

export class ChatClient {
  constructor({
    url = CHAT_URL,
    socketFactory = (socketUrl) => new WebSocket(socketUrl),
    onEvent = () => {},
  } = {}) {
    this.url = url;
    this.socketFactory = socketFactory;
    this.onEvent = onEvent;
    this.socket = null;
    this.isAuthorized = false;
  }

  connect(token) {
    this.disconnect();
    this.socket = this.socketFactory(this.url);
    this.socket.onopen = () => {
      this.socket.send(JSON.stringify({ type: 'AUTH', payload: { token } }));
      this.onEvent({ type: 'SOCKET_OPEN' });
    };
    this.socket.onmessage = ({ data }) => {
      let event;
      try {
        event = JSON.parse(data);
      } catch {
        this.onEvent({ type: 'PROTOCOL_ERROR', payload: { message: 'Сервер прислал неверный ответ.' } });
        return;
      }
      if (event.type === 'AUTH_SUCCESS') this.isAuthorized = true;
      this.onEvent(event);
    };
    this.socket.onerror = () => this.onEvent({ type: 'SOCKET_ERROR' });
    this.socket.onclose = () => {
      this.isAuthorized = false;
      this.onEvent({ type: 'SOCKET_CLOSED' });
    };
    return this.socket;
  }

  sendMessage(text) {
    if (!this.isAuthorized || !this.socket || this.socket.readyState !== 1) {
      throw new Error('Сначала дождитесь авторизации в чате.');
    }
    const cleanText = text.trim();
    if (!cleanText) throw new Error('Введите сообщение.');
    this.socket.send(JSON.stringify({
      type: 'CHAT_MESSAGE',
      payload: { text: cleanText },
    }));
  }

  disconnect() {
    this.isAuthorized = false;
    if (this.socket && this.socket.readyState < 2) this.socket.close();
    this.socket = null;
  }
}
