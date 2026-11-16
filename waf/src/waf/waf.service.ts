import { Injectable } from '@nestjs/common';
import { RateLimiterService } from './rate-limiter.service';
import { BehavioralAnalyzerService } from './behavioral-analyzer.service';
import { MetricsService } from './metrics.service';

@Injectable()
export class WafService {
  private blacklist: Set<string> = new Set();
  private whitelist: Set<string> = new Set();

  constructor(
    private rateLimiter: RateLimiterService,
    private behavioralAnalyzer: BehavioralAnalyzerService,
    private metrics: MetricsService,
  ) {}

  async checkRequest(ip: string, req: any): Promise<{ allowed: boolean; reason?: string; challenge?: boolean }> {
    const path = req.path || req.url || '/';
    const method = req.method || 'GET';

    // Whitelist check
    if (this.whitelist.has(ip)) {
      this.metrics.requestsTotal.inc({ status: 'allowed', method, path });
      return { allowed: true };
    }

    // Blacklist check
    if (this.blacklist.has(ip)) {
      this.metrics.blockedByReason.inc({ reason: 'blacklist', ip });
      this.metrics.requestsTotal.inc({ status: 'blocked', method, path });
      return { allowed: false, reason: 'blacklist' };
    }

    // Rate limiting
    const rateLimit = parseInt(process.env.RATE_LIMIT) || 100;
    const windowSeconds = parseInt(process.env.RATE_LIMIT_WINDOW) || 60;
    const rateCheck = await this.rateLimiter.isAllowed(ip, rateLimit, windowSeconds);

    if (!rateCheck.allowed) {
      this.metrics.blockedByReason.inc({ reason: 'rate_limit', ip });
      this.metrics.requestsTotal.inc({ status: 'blocked', method, path });
      return { allowed: false, reason: `rate_limit (limit: ${rateLimit}/${windowSeconds}s)` };
    }

    // Behavioral analysis
    if (process.env.ENABLE_BEHAVIORAL === 'true') {
      const behavior = await this.behavioralAnalyzer.analyze(ip, req);
      if (behavior.suspicious) {
        this.metrics.blockedByReason.inc({ reason: 'behavioral', ip });
        this.metrics.requestsTotal.inc({ status: 'blocked', method, path });
        return { allowed: false, reason: `behavioral: ${behavior.reasons.join(', ')} (score: ${behavior.score})` };
      }
    }

    this.metrics.requestsTotal.inc({ status: 'allowed', method, path });
    return { allowed: true };
  }

  blacklistIp(ip: string) {
    this.blacklist.add(ip);
  }

  whitelistIp(ip: string) {
    this.whitelist.add(ip);
  }

  isBlacklisted(ip: string): boolean {
    return this.blacklist.has(ip);
  }
}
