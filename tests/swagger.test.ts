import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { swaggerSpec } from '../src/docs/swagger';

describe('Swagger Documentation', () => {
  it('especificação deve ser OpenAPI 3.0', () => {
    assert.match(swaggerSpec.openapi, /^3\.0\./);
    assert.equal(swaggerSpec.info.title, 'API de Agendamentos');
  });

  it('deve conter as rotas principais documentadas', () => {
    assert.ok(swaggerSpec.paths['/health']);
    assert.ok(swaggerSpec.paths['/appointments']);
    assert.ok(swaggerSpec.paths['/appointments/{id}']);
    assert.ok(swaggerSpec.paths['/appointments/{id}/cancel']);
    assert.ok(swaggerSpec.paths['/appointments/{id}/complete']);
  });

  it('deve conter os schemas nos components', () => {
    assert.ok(swaggerSpec.components.schemas.Appointment);
    assert.ok(swaggerSpec.components.schemas.CreateAppointmentInput);
    assert.ok(swaggerSpec.components.schemas.UpdateAppointmentInput);
  });
});
