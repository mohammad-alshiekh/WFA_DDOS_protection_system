import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WafService } from './waf.service';
import { MetricsService } from './metrics.service';

@Injectable()
export class WafMiddleware implements NestMiddleware {
  constructor(
    private wafService: WafService,
    private metricsService: MetricsService,
  ) {}

  private getTargetUrl(req: Request): string {
    return (process.env.TARGET_URL || 'http://localhost:3001') + req.originalUrl;
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

      // Proxy to target using fetch
      const targetUrl = this.getTargetUrl(req);
      const method = req.method;
      const headers: Record<string, string> = {};
      
      // Copy headers
      for (const [key, value] of Object.entries(req.headers)) {
        if (key !== 'host' && key !== 'content-length') {
          headers[key] = Array.isArray(value) ? value[0] : value;
        }
      }

      const options: RequestInit = {
        method,
        headers,
        body: ['GET', 'HEAD'].includes(method) ? undefined : JSON.stringify(req.body || {}),
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const proxyRes = await fetch(targetUrl, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Copy response headers
        for (const [key, value] of proxyRes.headers.entries()) {
          if (key !== 'content-encoding') {
            res.setHeader(key, value);
          }
        }

        res.status(proxyRes.status);
        const data = await proxyRes.arrayBuffer();
        res.send(Buffer.from(data));
        
        const duration = (Date.now() - start) / 1000;
        this.metricsService.processingDuration.observe({ status: 'allowed' }, duration);
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error('Proxy timeout');
        }
        throw err;
      }
    } catch (error: any) {
      this.metricsService.activeConnections.dec();
      console.error('WAF error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'WAF internal error', timestamp: new Date().toISOString() });
      }
    } finally {
      this.metricsService.activeConnections.dec();
    }
  }
}