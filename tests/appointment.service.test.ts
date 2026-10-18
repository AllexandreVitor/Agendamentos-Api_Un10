import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { AppError } from '../src/errors/app-error';
import type { Appointment } from '../src/models/appointment.model';
import type { AppointmentRepository } from '../src/repositories/appointment.repository';
import { AppointmentService } from '../src/services/appointment.service';

const HOUR = 60 * 60 * 1000;
const future = (hours: number) => new Date(Date.now() + hours * HOUR);

const makeAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: '3213fc45-30e6-4c1b-86ec-8548216e2fd6',
  clientName: 'Maria Silva',
  clientEmail: 'maria@email.com',
  service: 'Corte',
  startsAt: future(24),
  endsAt: future(25),
  status: 'scheduled',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeRepository = () => ({
  create: mock.fn(async (data: any) => makeAppointment(data)),
  findAll: mock.fn(async () => [makeAppointment()]),
  findById: mock.fn(async (): Promise<Appointment | null> => makeAppointment()),
  findOverlapping: mock.fn(
    async (_startsAt: Date, _endsAt: Date, _excludeId?: string): Promise<Appointment[]> => [],
  ),
  update: mock.fn(async (_id: string, data: any) => makeAppointment(data)),
  delete: mock.fn(async () => true),
});

const expectAppError = (statusCode: number) => (err: unknown) => {
  assert.ok(err instanceof AppError);
  assert.equal(err.statusCode, statusCode);
  return true;
};

describe('AppointmentService', () => {
  let repo: ReturnType<typeof makeRepository>;
  let service: AppointmentService;

  beforeEach(() => {
    repo = makeRepository();
    service = new AppointmentService(repo as unknown as AppointmentRepository);
  });

  describe('create', () => {
    const input = {
      clientName: 'Maria Silva',
      clientEmail: 'maria@email.com',
      service: 'Corte',
      startsAt: future(24),
      endsAt: future(25),
    };

    it('cria um agendamento válido', async () => {
      const result = await service.create(input);

      assert.equal(result.clientName, 'Maria Silva');
      assert.equal(repo.create.mock.callCount(), 1);
    });

    it('rejeita término antes do início', async () => {
      await assert.rejects(
        service.create({ ...input, startsAt: future(25), endsAt: future(24) }),
        expectAppError(422),
      );
      assert.equal(repo.create.mock.callCount(), 0);
    });

    it('rejeita horário no passado', async () => {
      await assert.rejects(
        service.create({ ...input, startsAt: future(-2), endsAt: future(-1) }),
        expectAppError(422),
      );
    });

    it('rejeita horário em conflito', async () => {
      repo.findOverlapping.mock.mockImplementation(async () => [makeAppointment()]);

      await assert.rejects(service.create(input), expectAppError(409));
      assert.equal(repo.create.mock.callCount(), 0);
    });
  });

  describe('getById', () => {
    it('retorna o agendamento encontrado', async () => {
      const result = await service.getById('id');
      assert.equal(result.id, makeAppointment().id);
    });

    it('lança 404 quando não existe', async () => {
      repo.findById.mock.mockImplementation(async () => null);
      await assert.rejects(service.getById('id'), expectAppError(404));
    });
  });

  describe('update', () => {
    it('ignora checagem de conflito quando o horário não muda', async () => {
      await service.update('id', { notes: 'nova observação' });

      assert.equal(repo.findOverlapping.mock.callCount(), 0);
      assert.equal(repo.update.mock.callCount(), 1);
    });

    it('checa conflito excluindo o próprio agendamento', async () => {
      await service.update('id', { startsAt: future(30), endsAt: future(31) });

      assert.equal(repo.findOverlapping.mock.callCount(), 1);
      assert.equal(repo.findOverlapping.mock.calls[0].arguments[2], 'id');
    });

    it('não permite alterar agendamento cancelado', async () => {
      repo.findById.mock.mockImplementation(async () => makeAppointment({ status: 'cancelled' }));
      await assert.rejects(service.update('id', { notes: 'x' }), expectAppError(422));
    });
  });

  describe('cancel', () => {
    it('cancela um agendamento ativo', async () => {
      const result = await service.cancel('id');

      assert.equal(result.status, 'cancelled');
      assert.deepEqual(repo.update.mock.calls[0].arguments, ['id', { status: 'cancelled' }]);
    });

    it('não cancela um agendamento já cancelado', async () => {
      repo.findById.mock.mockImplementation(async () => makeAppointment({ status: 'cancelled' }));
      await assert.rejects(service.cancel('id'), expectAppError(422));
    });

    it('não cancela um agendamento concluído', async () => {
      repo.findById.mock.mockImplementation(async () => makeAppointment({ status: 'completed' }));
      await assert.rejects(service.cancel('id'), expectAppError(422));
    });
  });

  describe('complete', () => {
    it('conclui um agendamento ativo', async () => {
      const result = await service.complete('id');
      assert.equal(result.status, 'completed');
    });

    it('não conclui um agendamento cancelado', async () => {
      repo.findById.mock.mockImplementation(async () => makeAppointment({ status: 'cancelled' }));
      await assert.rejects(service.complete('id'), expectAppError(422));
    });
  });

  describe('delete', () => {
    it('remove um agendamento existente', async () => {
      await service.delete('id');
      assert.equal(repo.delete.mock.callCount(), 1);
    });

    it('lança 404 quando não existe', async () => {
      repo.delete.mock.mockImplementation(async () => false);
      await assert.rejects(service.delete('id'), expectAppError(404));
    });
  });
});
