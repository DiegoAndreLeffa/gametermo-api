import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const authHeader = req.headers['authorization'];

    this.logger.log(`Incoming Request: ${method} ${originalUrl}`);
    this.logger.log(`Auth Header Present: ${!!authHeader}`);
    if (authHeader) {
      this.logger.log(`Auth Header Value (Start): ${authHeader.substring(0, 15)}...`);
    } else {
      this.logger.warn('❌ NO AUTH HEADER FOUND');
    }

    next();
  }
}
