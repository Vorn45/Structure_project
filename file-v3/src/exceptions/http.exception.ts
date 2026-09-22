export class HttpException extends Error {
  public statusCode: number;
  public details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string = 'Bad Request', details?: any) {
    super(400, message, details);
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string = 'Resource Not Found', details?: any) {
    super(404, message, details);
  }
}

export class PayloadTooLargeException extends HttpException {
  constructor(message: string = 'File size exceeds allowed limit', details?: any) {
    super(413, message, details);
  }
}
