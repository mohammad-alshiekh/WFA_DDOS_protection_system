import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { WafService } from './waf.service';
import { MetricsService } from './metrics.service';

@Controller()
export class WafController {
  constructor(
    private wafService: WafService,
    private metricsService: MetricsService,
  ) {}

  @Get('metrics')
  async metrics(@Res() res: Response) {
    res.set('Content-Type', this.metricsService.getContentType());
    res.end(await this.metricsService.getMetrics());
  }

  @Post('admin/blacklist')
  async blacklist(@Body('ip') ip: string) {
    this.wafService.blacklistIp(ip);
    return { success: true, ip, action: 'blacklisted' };
  }

  @Post('admin/whitelist')
  async whitelist(@Body('ip') ip: string) {
    this.wafService.whitelistIp(ip);
    return { success: true, ip, action: 'whitelisted' };
  }

  @Get('admin/status')
  async status() {
    return {
      rateLimit: parseInt(process.env.RATE_LIMIT) || 100,
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 60,
      behavioralEnabled: process.env.ENABLE_BEHAVIORAL === 'true',
      timestamp: new Date().toISOString(),
    };
  }
}
