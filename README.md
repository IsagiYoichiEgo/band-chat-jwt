# BACKSTAGE — JWT WebSocket chat

Отдельное задание: групповой WebSocket-чат с регистрацией, входом и logout через JWT.

## Протокол

1. REST-регистрация или вход возвращает access-токен.
2. Клиент подключается к `wss://inai-col3.fishrungames.com/chat/`.
3. Первым сообщением отправляет `AUTH` с access-токеном.
4. Поле сообщения включается только после `AUTH_SUCCESS`.
5. Сообщения отправляются как `CHAT_MESSAGE` и отображаются из `NEW_MESSAGE`.

Откройте `index.html` через локальный HTTP-сервер или GitHub Pages. Тесты: `npm test`.
