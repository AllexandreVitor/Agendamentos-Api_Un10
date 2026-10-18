import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../src/errors/app-error';
import { errorHandler } from '../src/middlewares/error-handler';

const makeResponse = () => {
  const res = {
    statusCode: 0,
    body: undefined as any,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
  };
  return res;
};

const handle = (err: unknown) => {
  const res = makeResponse();
  errorHandler(err, {} as Request, res as unknown as Response, () => {});
  return res;
};

describe('errorHandler', () => {
  it('usa o status do AppError', () => {
    const res = handle(AppError.notFound('Agendamento não encontrado'));

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.error, 'Agendamento não encontrado');
  });

  it('retorna 400 para erro de validação do Zod', () => {
    const result = z.object({ email: z.string().email() }).safeParse({ email: 'x' });
    const res = handle(result.error);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.details[0].field, 'email');
  });

  it('retorna 400 para JSON malformado', () => {
    assert.equal(handle({ type: 'entity.parse.failed' }).statusCode, 400);
  });

  it('retorna 409 para conflito detectado pelo Postgres', () => {
    assert.equal(handle({ code: '23P01' }).statusCode, 409);
  });

  it('retorna 500 para erros desconhecidos', () => {
    const consoleError = mock.method(console, 'error', () => {});
    const res = handle(new Error('boom'));

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'Erro interno do servidor');
    consoleError.mock.restore();
  });
});
