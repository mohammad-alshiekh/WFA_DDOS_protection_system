import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { WafService } from './waf.service';
import { MetricsService } from './metrics.service';

@Injectable()
export class WafMiddleware implements NestMiddleware {
  private proxy: any;

  constructor(
    private wafService: WafService,
    private metricsService: MetricsService,
  ) {
    const targetUrl = process.env.TARGET_URL || 'http://localhost:3001';
    this.proxy = createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      onError: (err: any, req: any, res: any) => {
        console.error('Proxy error:', err.message);
        res.status(502).json({ error: 'Bad Gateway', message: 'Target server unavailable' });
      },
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip WAF's own endpoints
    if (req.path.startsWith('/metrics') || req.path.startsWith('/admin')) {
      return next();
    }

    const start = Date.now();
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    this.metricsService.activeConnections.inc();

    try {
      const result = await this.wafService.checkRequest(ip, req);

      if (!result.allowed) {
        const duration = (Date.now() - start) / 1000;
        this.metricsService.processingDuration.observe({ status: 'blocked' }, duration);
        this.metricsService.activeConnections.dec();

        res.status(429).json({
          error: 'Request blocked by WAF',
          reason: result.reason,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Proxy to target
      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        this.metricsService.processingDuration.observe({ status: 'allowed' }, duration);
        this.metricsService.activeConnections.dec();
      });

      res.on('close', () => {
        this.metricsService.activeConnections.dec();
      });

      this.proxy(req, res, next);
    } catch (error) {
      this.metricsService.activeConnections.dec();
      console.error('WAF error:', error);
      res.status(500).json({ error: 'WAF internal error', timestamp: new Date().toISOString() });
    }
  }
}
