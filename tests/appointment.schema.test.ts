import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createAppointmentSchema,
  idParamSchema,
  listAppointmentsQuerySchema,
  updateAppointmentSchema,
} from '../src/validators/appointment.schema';

const validBody = {
  clientName: 'Maria Silva',
  clientEmail: 'maria@email.com',
  service: 'Corte',
  startsAt: '2030-01-10T14:00:00-03:00',
  endsAt: '2030-01-10T15:00:00-03:00',
};

describe('createAppointmentSchema', () => {
  it('aceita um body válido e converte as datas', () => {
    const result = createAppointmentSchema.parse(validBody);

    assert.ok(result.startsAt instanceof Date);
    assert.equal(result.startsAt.toISOString(), '2030-01-10T17:00:00.000Z');
  });

  it('rejeita e-mail inválido', () => {
    const result = createAppointmentSchema.safeParse({ ...validBody, clientEmail: 'invalido' });
    assert.equal(result.success, false);
  });

  it('rejeita data inválida', () => {
    const result = createAppointmentSchema.safeParse({ ...validBody, startsAt: 'amanhã' });
    assert.equal(result.success, false);
  });

  it('rejeita campos obrigatórios ausentes', () => {
    const result = createAppointmentSchema.safeParse({});
    assert.equal(result.success, false);
  });
});

describe('updateAppointmentSchema', () => {
  it('aceita atualização parcial', () => {
    assert.equal(updateAppointmentSchema.safeParse({ notes: 'obs' }).success, true);
  });

  it('rejeita body vazio', () => {
    assert.equal(updateAppointmentSchema.safeParse({}).success, false);
  });
});

describe('idParamSchema', () => {
  it('aceita UUID válido', () => {
    const result = idParamSchema.safeParse({ id: '3213fc45-30e6-4c1b-86ec-8548216e2fd6' });
    assert.equal(result.success, true);
  });

  it('rejeita ID que não é UUID', () => {
    assert.equal(idParamSchema.safeParse({ id: 'abc' }).success, false);
  });
});

describe('listAppointmentsQuerySchema', () => {
  it('aceita status válido', () => {
    assert.equal(listAppointmentsQuerySchema.safeParse({ status: 'scheduled' }).success, true);
  });

  it('rejeita status desconhecido', () => {
    assert.equal(listAppointmentsQuerySchema.safeParse({ status: 'pendente' }).success, false);
  });
});
