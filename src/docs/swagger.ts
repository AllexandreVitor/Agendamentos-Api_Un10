import { Router } from 'express';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'API de Agendamentos',
    version: '1.0.0',
    description: 'Documentação Swagger da API de Agendamentos (Service Pattern + PostgreSQL).',
  },
  servers: [
    {
      url: '/',
      description: 'Servidor atual',
    },
  ],
  tags: [
    { name: 'Health', description: 'Monitoramento de integridade da API e banco' },
    { name: 'Appointments', description: 'Gerenciamento de agendamentos' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verifica saúde da API e conexão com o banco',
        responses: {
          '200': {
            description: 'API e banco operacionais',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    database: { type: 'string', example: 'up' },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Banco de dados inacessível',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    database: { type: 'string', example: 'down' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/appointments': {
      post: {
        tags: ['Appointments'],
        summary: 'Cria um novo agendamento',
        description: 'Valida se a data é futura, término > início e verifica se não há conflito de horário.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateAppointmentInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Agendamento criado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Appointment' },
              },
            },
          },
          '400': {
            description: 'Dados inválidos (validação Zod)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
              },
            },
          },
          '409': {
            description: 'Conflito de horário com outro agendamento ativo',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '422': {
            description: 'Regra de negócio violada (ex: data no passado)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      get: {
        tags: ['Appointments'],
        summary: 'Lista todos os agendamentos',
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['scheduled', 'cancelled', 'completed'],
            },
            description: 'Filtrar por status',
          },
          {
            name: 'from',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date-time' },
            description: 'Data de início mínima (ISO 8601)',
          },
          {
            name: 'to',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'date-time' },
            description: 'Data de início máxima (ISO 8601)',
          },
        ],
        responses: {
          '200': {
            description: 'Lista de agendamentos ordenada por data',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Appointment' },
                },
              },
            },
          },
          '400': {
            description: 'Parâmetros de busca inválidos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/appointments/{id}': {
      get: {
        tags: ['Appointments'],
        summary: 'Obtém detalhes de um agendamento',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'ID UUID do agendamento',
          },
        ],
        responses: {
          '200': {
            description: 'Agendamento encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Appointment' },
              },
            },
          },
          '400': { description: 'ID inválido (não é UUID)' },
          '404': { description: 'Agendamento não encontrado' },
        },
      },
      put: {
        tags: ['Appointments'],
        summary: 'Atualiza um agendamento existente',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateAppointmentInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Agendamento atualizado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Appointment' },
              },
            },
          },
          '400': { description: 'Dados inválidos ou corpo vazio' },
          '404': { description: 'Agendamento não encontrado' },
          '409': { description: 'Novo horário em conflito com outro agendamento' },
          '422': { description: 'Não é possível alterar agendamento cancelado/concluído' },
        },
      },
      delete: {
        tags: ['Appointments'],
        summary: 'Remove um agendamento',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '204': { description: 'Agendamento removido com sucesso' },
          '404': { description: 'Agendamento não encontrado' },
        },
      },
    },
    '/appointments/{id}/cancel': {
      patch: {
        tags: ['Appointments'],
        summary: 'Cancela um agendamento',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Agendamento cancelado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Appointment' },
              },
            },
          },
          '404': { description: 'Agendamento não encontrado' },
          '422': { description: 'Agendamento já cancelado ou concluído' },
        },
      },
    },
    '/appointments/{id}/complete': {
      patch: {
        tags: ['Appointments'],
        summary: 'Marca um agendamento como concluído',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Agendamento concluído com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Appointment' },
              },
            },
          },
          '404': { description: 'Agendamento não encontrado' },
          '422': { description: 'Apenas agendamentos em status scheduled podem ser concluídos' },
        },
      },
    },
  },
  components: {
    schemas: {
      Appointment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '3213fc45-30e6-4c1b-86ec-8548216e2fd6' },
          clientName: { type: 'string', example: 'Carlos Eduardo' },
          clientEmail: { type: 'string', format: 'email', example: 'carlos@email.com' },
          service: { type: 'string', example: 'Consultoria Técnica' },
          startsAt: { type: 'string', format: 'date-time', example: '2030-05-15T10:00:00.000Z' },
          endsAt: { type: 'string', format: 'date-time', example: '2030-05-15T11:00:00.000Z' },
          status: {
            type: 'string',
            enum: ['scheduled', 'cancelled', 'completed'],
            example: 'scheduled',
          },
          notes: { type: 'string', nullable: true, example: 'Primeira reunião de alinhamento' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-13T20:00:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-10-13T20:00:00.000Z' },
        },
      },
      CreateAppointmentInput: {
        type: 'object',
        required: ['clientName', 'clientEmail', 'service', 'startsAt', 'endsAt'],
        properties: {
          clientName: { type: 'string', minLength: 2, maxLength: 120, example: 'Carlos Eduardo' },
          clientEmail: { type: 'string', format: 'email', example: 'carlos@email.com' },
          service: { type: 'string', minLength: 2, maxLength: 120, example: 'Consultoria Técnica' },
          startsAt: { type: 'string', format: 'date-time', example: '2030-05-15T10:00:00Z' },
          endsAt: { type: 'string', format: 'date-time', example: '2030-05-15T11:00:00Z' },
          notes: { type: 'string', nullable: true, example: 'Primeira reunião de alinhamento' },
        },
      },
      UpdateAppointmentInput: {
        type: 'object',
        properties: {
          clientName: { type: 'string', minLength: 2, maxLength: 120 },
          clientEmail: { type: 'string', format: 'email' },
          service: { type: 'string', minLength: 2, maxLength: 120 },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: 'string', format: 'date-time' },
          notes: { type: 'string', nullable: true },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Já existe um agendamento neste horário' },
          details: { type: 'object', nullable: true },
        },
      },
      ValidationErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Dados inválidos' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'clientEmail' },
                message: { type: 'string', example: 'Invalid email' },
              },
            },
          },
        },
      },
    },
  },
};

const swaggerHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>API de Agendamentos - Documentação Swagger</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api-docs/json',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        deepLinking: true
      });
    };
  </script>
</body>
</html>`;

export const swaggerRoutes = Router();

swaggerRoutes.get('/json', (_req, res) => {
  res.json(swaggerSpec);
});

swaggerRoutes.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(swaggerHtml);
});
