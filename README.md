# API de Agendamentos

API REST simples de agendamentos em **Node.js + TypeScript + Express 5**, usando **PostgreSQL**, organizada no **Service Pattern** (Controller → Service → Repository) e empacotada em uma imagem Docker **multi-stage** mínima.

## Arquitetura

```
src/
├── config/        # variáveis de ambiente
├── database/      # pool de conexões + migração automática
├── models/        # tipos de domínio
├── repositories/  # acesso a dados (somente SQL)
├── services/      # regras de negócio (sem HTTP, sem SQL)
├── controllers/   # camada HTTP (valida entrada, chama service)
├── validators/    # schemas Zod
├── routes/        # rotas + injeção de dependências
├── middlewares/   # tratamento global de erros
├── errors/        # AppError
├── app.ts         # configuração do Express
└── server.ts      # bootstrap + graceful shutdown
```

| Camada | Responsabilidade |
|---|---|
| **Controller** | Recebe `req`, valida com Zod, devolve `res` |
| **Service** | Regras: horário futuro, término > início, sem conflito, transições de status |
| **Repository** | Queries SQL parametrizadas e mapeamento `snake_case` ↔ `camelCase` |

Conflitos de horário são checados no service **e** garantidos no banco por uma constraint `EXCLUDE USING gist` (protege contra race conditions).

## Executando com Docker

```bash
docker compose up -d --build
curl http://localhost:3000/health
```

## Executando localmente

```bash
cp .env.example .env
docker compose up -d db
npm install
npm run dev
```

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api-docs` (ou `/docs`) | Documentação interativa Swagger UI |
| GET | `/api-docs/json` | Especificação OpenAPI 3.0 em JSON |
| GET | `/health` | Status da API e do banco |
| POST | `/appointments` | Cria agendamento |
| GET | `/appointments?status=&from=&to=` | Lista (filtros opcionais) |
| GET | `/appointments/:id` | Detalha |
| PUT | `/appointments/:id` | Atualiza (parcial) |
| PATCH | `/appointments/:id/cancel` | Cancela |
| PATCH | `/appointments/:id/complete` | Conclui |
| DELETE | `/appointments/:id` | Remove |

### Exemplo

```bash
curl -X POST http://localhost:3000/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Maria Silva",
    "clientEmail": "maria@email.com",
    "service": "Corte de cabelo",
    "startsAt": "2030-01-10T14:00:00-03:00",
    "endsAt":   "2030-01-10T15:00:00-03:00",
    "notes": "Primeira visita"
  }'
```

### Códigos de resposta

| Código | Quando |
|---|---|
| 400 | Body/params inválidos |
| 404 | Agendamento não encontrado |
| 409 | Conflito de horário |
| 422 | Regra de negócio violada (horário passado, status inválido...) |

## Imagem Docker

O `Dockerfile` usa 2 estágios:

1. **build** – instala as dependências e gera, com **esbuild**, um único `server.js` minificado (express, pg e zod embutidos).
2. **final** – `node:22-alpine` com apenas o `server.js`. Sem `node_modules` nem código-fonte; roda com o usuário não-root `node`.

```bash
docker images api-agendamentos
```
