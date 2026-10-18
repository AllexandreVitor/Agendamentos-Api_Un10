import { z } from 'zod';
import { APPOINTMENT_STATUSES } from '../models/appointment.model';

const isoDate = z.coerce.date({ invalid_type_error: 'Data inválida (use ISO 8601)' });

export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const createAppointmentSchema = z.object({
  clientName: z.string().trim().min(2).max(120),
  clientEmail: z.string().trim().email().max(160),
  service: z.string().trim().min(2).max(120),
  startsAt: isoDate,
  endsAt: isoDate,
  notes: z.string().trim().max(1000).nullish(),
});

export const updateAppointmentSchema = createAppointmentSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export const listAppointmentsQuerySchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});
