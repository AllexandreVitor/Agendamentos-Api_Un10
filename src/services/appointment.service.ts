import { AppError } from '../errors/app-error';
import type {
  Appointment,
  AppointmentFilters,
  CreateAppointmentData,
  UpdateAppointmentData,
} from '../models/appointment.model';
import type { AppointmentRepository } from '../repositories/appointment.repository';

/**
 * Camada de serviço: concentra TODAS as regras de negócio.
 * Não conhece HTTP (req/res) nem SQL — depende apenas do repositório.
 */
export class AppointmentService {
  constructor(private readonly repository: AppointmentRepository) {}

  async create(data: CreateAppointmentData): Promise<Appointment> {
    this.ensureValidRange(data.startsAt, data.endsAt);
    this.ensureFuture(data.startsAt);
    await this.ensureNoOverlap(data.startsAt, data.endsAt);

    return this.repository.create(data);
  }

  list(filters: AppointmentFilters): Promise<Appointment[]> {
    return this.repository.findAll(filters);
  }

  async getById(id: string): Promise<Appointment> {
    const appointment = await this.repository.findById(id);
    if (!appointment) throw AppError.notFound('Agendamento não encontrado');
    return appointment;
  }

  async update(id: string, data: UpdateAppointmentData): Promise<Appointment> {
    const current = await this.getById(id);

    if (current.status !== 'scheduled') {
      throw AppError.unprocessable(`Não é possível alterar um agendamento com status "${current.status}"`);
    }

    const startsAt = data.startsAt ?? current.startsAt;
    const endsAt = data.endsAt ?? current.endsAt;
    const timeChanged = data.startsAt !== undefined || data.endsAt !== undefined;

    if (timeChanged) {
      this.ensureValidRange(startsAt, endsAt);
      this.ensureFuture(startsAt);
    }

    // Reativar/alterar horário de um agendamento exige checar conflitos
    if (timeChanged && (data.status ?? current.status) === 'scheduled') {
      await this.ensureNoOverlap(startsAt, endsAt, id);
    }

    const updated = await this.repository.update(id, data);
    if (!updated) throw AppError.notFound('Agendamento não encontrado');
    return updated;
  }

  async cancel(id: string): Promise<Appointment> {
    const current = await this.getById(id);
    if (current.status === 'cancelled') {
      throw AppError.unprocessable('Agendamento já está cancelado');
    }
    if (current.status === 'completed') {
      throw AppError.unprocessable('Não é possível cancelar um agendamento concluído');
    }
    return (await this.repository.update(id, { status: 'cancelled' }))!;
  }

  async complete(id: string): Promise<Appointment> {
    const current = await this.getById(id);
    if (current.status !== 'scheduled') {
      throw AppError.unprocessable(`Não é possível concluir um agendamento com status "${current.status}"`);
    }
    return (await this.repository.update(id, { status: 'completed' }))!;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw AppError.notFound('Agendamento não encontrado');
  }

  // ----------------- regras de negócio -----------------

  private ensureValidRange(startsAt: Date, endsAt: Date) {
    if (endsAt <= startsAt) {
      throw AppError.unprocessable('O horário de término deve ser posterior ao de início');
    }
  }

  private ensureFuture(startsAt: Date) {
    if (startsAt.getTime() <= Date.now()) {
      throw AppError.unprocessable('Não é possível agendar em um horário passado');
    }
  }

  private async ensureNoOverlap(startsAt: Date, endsAt: Date, excludeId?: string) {
    const conflicts = await this.repository.findOverlapping(startsAt, endsAt, excludeId);
    if (conflicts.length) {
      throw AppError.conflict(
        'Já existe um agendamento neste horário',
        conflicts.map(({ id, startsAt, endsAt }) => ({ id, startsAt, endsAt })),
      );
    }
  }
}
