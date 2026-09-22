import { Response } from 'express';

export interface IApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: any;
  timestamp: string;
}

export class ApiResponse {
  public static success<T>(
    res: Response,
    data: T,
    message: string = 'Operation completed successfully',
    statusCode: number = 200
  ): Response {
    const payload: IApiResponse<T> = {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }

  public static error(
    res: Response,
    message: string = 'Internal Server Error',
    statusCode: number = 500,
    details?: any
  ): Response {
    const payload: IApiResponse = {
      success: false,
      statusCode,
      message,
      error: details,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }
}
