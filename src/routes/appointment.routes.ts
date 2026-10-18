import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { pool } from '../database/pool';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { AppointmentService } from '../services/appointment.service';

// Composição das dependências (injeção manual): Repository -> Service -> Controller
const repository = new AppointmentRepository(pool);
const service = new AppointmentService(repository);
const controller = new AppointmentController(service);

export const appointmentRoutes = Router()
  .post('/', controller.create)
  .get('/', controller.list)
  .get('/:id', controller.getById)
  .put('/:id', controller.update)
  .patch('/:id/cancel', controller.cancel)
  .patch('/:id/complete', controller.complete)
  .delete('/:id', controller.delete);
