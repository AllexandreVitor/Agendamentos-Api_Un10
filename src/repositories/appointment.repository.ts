import type { Pool } from 'pg';
import type {
  Appointment,
  AppointmentFilters,
  CreateAppointmentData,
  UpdateAppointmentData,
} from '../models/appointment.model';

interface AppointmentRow {
  id: string;
  client_name: string;
  client_email: string;
  service: string;
  starts_at: Date;
  ends_at: Date;
  status: Appointment['status'];
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

const toEntity = (row: AppointmentRow): Appointment => ({
  id: row.id,
  clientName: row.client_name,
  clientEmail: row.client_email,
  service: row.service,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** Mapeia campos do domínio (camelCase) para colunas do banco (snake_case). */
const COLUMN_MAP: Record<keyof UpdateAppointmentData, string> = {
  clientName: 'client_name',
  clientEmail: 'client_email',
  service: 'service',
  startsAt: 'starts_at',
  endsAt: 'ends_at',
  notes: 'notes',
  status: 'status',
};

/**
 * Camada de acesso a dados: apenas SQL, sem regras de negócio.
 */
export class AppointmentRepository {
  constructor(private readonly db: Pool) {}

  async create(data: CreateAppointmentData): Promise<Appointment> {
    const { rows } = await this.db.query<AppointmentRow>(
      `INSERT INTO appointments (client_name, client_email, service, starts_at, ends_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.clientName, data.clientEmail, data.service, data.startsAt, data.endsAt, data.notes ?? null],
    );
    return toEntity(rows[0]);
  }

  async findAll(filters: AppointmentFilters = {}): Promise<Appointment[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.status) {
      values.push(filters.status);
      conditions.push(`status = $${values.length}`);
    }
    if (filters.from) {
      values.push(filters.from);
      conditions.push(`starts_at >= $${values.length}`);
    }
    if (filters.to) {
      values.push(filters.to);
      conditions.push(`starts_at <= $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await this.db.query<AppointmentRow>(
      `SELECT * FROM appointments ${where} ORDER BY starts_at ASC`,
      values,
    );
    return rows.map(toEntity);
  }

  async findById(id: string): Promise<Appointment | null> {
    const { rows } = await this.db.query<AppointmentRow>(
      'SELECT * FROM appointments WHERE id = $1',
      [id],
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async findOverlapping(startsAt: Date, endsAt: Date, excludeId?: string): Promise<Appointment[]> {
    const { rows } = await this.db.query<AppointmentRow>(
      `SELECT * FROM appointments
        WHERE status = 'scheduled'
          AND starts_at < $2
          AND ends_at   > $1
          AND ($3::uuid IS NULL OR id <> $3::uuid)`,
      [startsAt, endsAt, excludeId ?? null],
    );
    return rows.map(toEntity);
  }

  async update(id: string, data: UpdateAppointmentData): Promise<Appointment | null> {
    const sets: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      values.push(value);
      sets.push(`${COLUMN_MAP[key as keyof UpdateAppointmentData]} = $${values.length}`);
    }

    if (!sets.length) return this.findById(id);

    values.push(id);
    const { rows } = await this.db.query<AppointmentRow>(
      `UPDATE appointments
          SET ${sets.join(', ')}, updated_at = now()
        WHERE id = $${values.length}
        RETURNING *`,
      values,
    );
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.db.query('DELETE FROM appointments WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }
}
