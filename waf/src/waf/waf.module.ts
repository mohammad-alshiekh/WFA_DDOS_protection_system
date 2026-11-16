import { Module } from '@nestjs/common';
import { WafService } from './waf.service';
import { RateLimiterService } from './rate-limiter.service';
import { BehavioralAnalyzerService } from './behavioral-analyzer.service';
import { MetricsService } from './metrics.service';
import { WafController } from './waf.controller';
import { WafMiddleware } from './waf.middleware';

@Module({
  providers: [WafService, RateLimiterService, BehavioralAnalyzerService, MetricsService, WafMiddleware],
  controllers: [WafController],
  exports: [WafService, MetricsService],
})
export class WafModule {}
