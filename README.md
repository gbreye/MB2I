# MB2I

MB2I é um dispositivo de integração para o cuidado de plantas via monitoramento digital.

## Backend

O backend usa **Express + SQLite** com **better-sqlite3** (sem MongoDB).

### Instalação

```bash
npm install
```

Copie `.env.example` para `.env` e ajuste os valores:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Variáveis principais:

- `JWT_SECRET` — segredo dos tokens de sessão.
- `CLIENT_ORIGIN` — origens do frontend liberadas para CORS e Socket.IO.
- `COOKIE_SAME_SITE` — `lax` por padrão; use `none` com HTTPS se frontend e API ficarem em sites diferentes.
- `DATABASE_PATH` — caminho do banco, relativo à raiz do projeto.
- `ESP_API_KEY` — opcional; quando definido, `/esp/data` exige `x-api-key`.

### CORS e cookies

`CLIENT_ORIGIN` aceita uma lista separada por vírgula e também curingas, por exemplo `https://*.vercel.app`. As origens precisam incluir o protocolo e não devem ter barra no final.

Em produção, quando a requisição vem de outro domínio por HTTPS, o backend define o cookie de sessão como `SameSite=None; Secure` automaticamente. O cookie continua sendo `httpOnly`; o frontend não precisa enviar o ID do usuário, apenas usar `credentials: 'include'` nas requisições.

### Rodar

```bash
npm run dev
```

O servidor inicia em `http://localhost:3000`.

O banco é criado automaticamente em `backend/data/mb2i.sqlite` na primeira execução.

### Endpoints

- `POST /auth/signup` — `{ username, email, password }`; cria a conta e a sessão.
- `POST /auth/login` — `{ email, password, remember }`; retorna o perfil.
- `POST /auth/logout` — encerra a sessão e limpa o cookie.
- `GET /auth/find` — requer cookie/JWT e retorna o perfil atualizado.
- `POST /esp/associate` — requer cookie/JWT e `{ espId }`.
- `POST /esp/data` — recebe leituras do ESP32. Se `ESP_API_KEY` estiver definido, envie `x-api-key`.
- `GET /` — health check simples.

### Tempo real

Os eventos de atualização usam um emissor interno do Node (`EventEmitter`) após cada escrita no SQLite. O Socket.IO entrega o evento `new data` para as conexões autenticadas do usuário.

## Frontend

```bash
cd client
npm install
npm run dev
```

O cliente usa por padrão a API definida em `client/.env.example`:

```env
VITE_API_URL=https://mb2i-backend.vercel.app/
```

Para apontar para outro backend, defina `VITE_API_URL` em `client/.env` e reinicie o Vite.

O frontend já utiliza:

- login, cadastro, restauração de sessão e logout reais;
- cookie `httpOnly` enviado com `credentials: include`;
- associação de ESP por ID;
- Socket.IO com cookie de sessão para atualizar métricas, dispositivo, gráfico e diário em tempo real.
