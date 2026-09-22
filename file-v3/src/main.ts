import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { appConfig } from './configs/app.config';
import { FileDatabase } from './database';
import apiRouter from './routers/index.router';
import { HttpException } from './exceptions/http.exception';
import { ApiResponse } from './shared/response.shared';

const app = express();

// 1. Initialize DB / Storage
FileDatabase.initialize();

// 2. Global Middlewares
app.use(cors({ origin: appConfig.corsOrigin }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Static Files
app.use('/public', express.static(path.resolve(process.cwd(), 'public')));
app.use('/uploads', express.static(appConfig.uploadDir));

// 4. Test View / Dashboard
app.get('/', (req: Request, res: Response) => {
  const viewPath = path.resolve(__dirname, 'view/index.html');
  const srcViewPath = path.resolve(process.cwd(), 'src/view/index.html');
  if (fs.existsSync(viewPath)) {
    return res.sendFile(viewPath);
  } else if (fs.existsSync(srcViewPath)) {
    return res.sendFile(srcViewPath);
  }
  return res.json({ status: 'UP', service: appConfig.appName, message: 'File Service V3 Dashboard' });
});

// 5. API Routes
app.use('/api/v1', apiRouter);

// 6. 404 Route Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// 7. Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof HttpException) {
    return ApiResponse.error(res, err.message, err.statusCode, err.details);
  }

  // Multer Error Handling
  if (err.name === 'MulterError') {
    return ApiResponse.error(res, `Upload error: ${err.message}`, 400, err);
  }

  console.error('Unhandled Error:', err);
  return ApiResponse.error(
    res,
    err.message || 'Internal Server Error',
    err.statusCode || 500
  );
});

// 8. Start Server
app.listen(appConfig.port, () => {
  console.log(`=============================================`);
  console.log(`🚀 ${appConfig.appName} is running!`);
  console.log(`📡 URL: ${appConfig.appUrl}`);
  console.log(`📁 Upload Dir: ${appConfig.uploadDir}`);
  console.log(`🌍 Environment: ${appConfig.env}`);
  console.log(`=============================================`);
});

export default app;
