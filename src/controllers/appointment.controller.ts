import type { Request, Response } from 'express';
import type { AppointmentService } from '../services/appointment.service';
import {
  createAppointmentSchema,
  idParamSchema,
  listAppointmentsQuerySchema,
  updateAppointmentSchema,
} from '../validators/appointment.schema';

/**
 * Camada HTTP: valida entrada, delega ao service e formata a resposta.
 * Erros lançados são capturados pelo middleware global (Express 5 trata Promises).
 */
export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}

  create = async (req: Request, res: Response) => {
    const data = createAppointmentSchema.parse(req.body);
    const appointment = await this.service.create(data);
    res.status(201).location(`/appointments/${appointment.id}`).json(appointment);
  };

  list = async (req: Request, res: Response) => {
    const filters = listAppointmentsQuerySchema.parse(req.query);
    res.json(await this.service.list(filters));
  };

  getById = async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await this.service.getById(id));
  };

  update = async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateAppointmentSchema.parse(req.body);
    res.json(await this.service.update(id, data));
  };

  cancel = async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await this.service.cancel(id));
  };

  complete = async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await this.service.complete(id));
  };

  delete = async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    await this.service.delete(id);
    res.status(204).send();
  };
}
