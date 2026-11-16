import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class BehavioralAnalyzerService {
  private redis: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
  }

  async analyze(ip: string, req: any): Promise<{ suspicious: boolean; score: number; reasons: string[] }> {
    const reasons: string[] = [];
    let score = 0;

    // Check 1: Missing or suspicious User-Agent
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    if (!userAgent || userAgent.length < 10) {
      score += 30;
      reasons.push('suspicious_user_agent');
    }
    if (userAgent.includes('curl') || userAgent.includes('wget') || userAgent.includes('python') || userAgent.includes('bot')) {
      score += 15;
      reasons.push('automation_tool');
    }

    // Check 2: Inter-request timing (too fast = bot)
    const lastRequestKey = `behavior:last_request:${ip}`;
    const lastRequest = await this.redis.get(lastRequestKey);
    const now = Date.now();

    if (lastRequest) {
      const lastTime = parseInt(lastRequest);
      const diff = now - lastTime;
      if (diff < 50) {
        score += 25;
        reasons.push('too_fast_requests');
      }
    }
    await this.redis.setex(lastRequestKey, 300, now.toString());

    // Check 3: Missing standard headers
    const requiredHeaders = ['accept', 'accept-language'];
    for (const header of requiredHeaders) {
      if (!req.headers[header]) {
        score += 10;
        reasons.push(`missing_${header}_header`);
      }
    }

    // Check 4: Path randomization / enumeration
    const pathKey = `behavior:paths:${ip}`;
    const recentPaths = await this.redis.lrange(pathKey, 0, 20);
    const uniquePaths = new Set(recentPaths).size;
    if (recentPaths.length > 10 && uniquePaths / recentPaths.length > 0.9) {
      score += 20;
      reasons.push('path_enumeration');
    }
    await this.redis.lpush(pathKey, req.path || '/');
    await this.redis.ltrim(pathKey, 0, 50);
    await this.redis.expire(pathKey, 300);

    // Check 5: Connection count
    const connKey = `behavior:connections:${ip}`;
    const connCount = await this.redis.incr(connKey);
    await this.redis.expire(connKey, 60);
    if (connCount > 50) {
      score += 20;
      reasons.push('too_many_connections');
    }

    // Check 6: No referrer for POST/PUT
    if ((req.method === 'POST' || req.method === 'PUT') && !req.headers['referer'] && !req.headers['origin']) {
      score += 10;
      reasons.push('missing_referrer');
    }

    const suspicious = score >= 50;
    return { suspicious, score, reasons };
  }

  async recordConnectionClosed(ip: string) {
    const connKey = `behavior:connections:${ip}`;
    await this.redis.decr(connKey);
  }
}
