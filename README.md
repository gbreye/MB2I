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
- `GEMINI_API_KEY` — chave gratuita do Google AI Studio para o relatório de IA.
- `GEMINI_MODEL` — modelo usado no relatório (padrão: `gemini-1.5-flash`).
- `GEMINI_FALLBACK_MODEL` — modelo alternativo caso o principal não esteja disponível (padrão: `gemini-2.0-flash`).

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
- `POST /ai/report` — requer cookie/JWT; gera um relatório da planta com Gemini usando os dados atuais do painel.
- `GET /` — health check simples.

### Relatório de IA (Gemini)

O card de relatório usa a API gratuita do Gemini no backend — a chave nunca é enviada ao navegador.

1. Crie uma chave em [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Adicione ao `.env`:

```env
GEMINI_API_KEY=sua-chave
GEMINI_MODEL=gemini-1.5-flash
GEMINI_FALLBACK_MODEL=gemini-2.0-flash
```

O backend tenta primeiro o `GEMINI_MODEL`. Se ele não estiver disponível para a sua chave/modelo, tenta automaticamente o `GEMINI_FALLBACK_MODEL`. Reinicie o backend depois de alterar o `.env`.

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

Em desenvolvimento, use o mesmo host no frontend e na API. Se o Vite abre em
`http://localhost:5173`, configure `VITE_API_URL=http://localhost:3000/` — não
use `127.0.0.1` na API. O navegador considera `localhost` e `127.0.0.1` hosts
diferentes, e o cookie `httpOnly` não será enviado ao Socket.IO nem às chamadas
seguintes, deixando o tempo real e os eventos sem atualização.

Depois de alterar `VITE_API_URL`, reinicie o Vite e faça login novamente para
criar o cookie no host correto.

O frontend já utiliza:

- login, cadastro, restauração de sessão e logout reais;
- cookie `httpOnly` enviado com `credentials: include`;
- associação de ESP por ID;
- Socket.IO com cookie de sessão para atualizar métricas, dispositivo, gráfico e diário em tempo real.
