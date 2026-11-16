import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const path = req.path || req.url || '/';
    const method = req.method || 'GET';

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const status = res.statusCode.toString();

      this.metricsService.httpRequestsTotal.inc({ method, status, path });
      this.metricsService.httpRequestDuration.observe({ method, path }, duration);
    });

    next();
  }
}
