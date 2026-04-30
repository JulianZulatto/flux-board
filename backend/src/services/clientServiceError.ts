export class ClientServiceError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ClientServiceError";
    this.statusCode = statusCode;
  }
}
