import type { RequestHandler } from 'express';
import { env } from '../config/env';

const allowed = env.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);

/**
 * CORS mínimo (sem dependências) para permitir o consumo pelo frontend.
 * Configure CORS_ORIGIN com as origens permitidas, ex.: "http://localhost:5173".
 */
export const cors: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;

  if (allowed.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
};
