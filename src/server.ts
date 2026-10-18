import { app } from './app';
import { env } from './config/env';
import { runMigrations } from './database/migrate';
import { pool } from './database/pool';

async function bootstrap() {
  await runMigrations();

  const server = app.listen(env.port, () => {
    console.log(`[http] API rodando na porta ${env.port} (${env.nodeEnv})`);
  });

  // Graceful shutdown (docker stop envia SIGTERM)
  const shutdown = (signal: string) => {
    console.log(`[http] ${signal} recebido, encerrando...`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[fatal] falha ao iniciar', err);
  process.exit(1);
});
