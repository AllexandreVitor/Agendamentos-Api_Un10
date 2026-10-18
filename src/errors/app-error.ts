export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static notFound(message = 'Recurso não encontrado no momento, tente mais tarde!') {
    return new AppError(message, 404);
  }

  static conflict(message: string, details?: unknown) {
    return new AppError(message, 409, details);
  }

  static unprocessable(message: string) {
    return new AppError(message, 422);
  }
}
