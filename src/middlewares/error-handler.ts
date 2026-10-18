import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Rota ${req.method} ${req.path} não encontrada` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, details: err.details });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Dados inválidos',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
    return;
  }

  // JSON malformado no body
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'JSON inválido' });
    return;
  }

  // Erros do PostgreSQL
  switch (err?.code) {
    case '23P01': // exclusion_violation (sobreposição detectada pelo banco — race condition)
      res.status(409).json({ error: 'Já existe um agendamento neste horário' });
      return;
    case '23514': // check_violation
      res.status(422).json({ error: 'Dados violam uma regra de integridade' });
      return;
  }

  console.error('[error]', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
};
