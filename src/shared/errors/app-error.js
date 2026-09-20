// Error controlado: permite responder con un código HTTP y mensaje claros.
export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

