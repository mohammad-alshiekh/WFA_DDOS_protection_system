import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RateLimiterService {
  private redis: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
  }

  async isAllowed(
    ip: string, 
    limit: number = 100, 
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${ip}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    const pipeline = this.redis.pipeline();
    pipeline.zremrangebyscore(key, 0, now - windowMs);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}-${Math.random().toString(36).substr(2, 9)}`);
    pipeline.pexpire(key, windowMs);

    const results = await pipeline.exec();
    if (!results) return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };

    const currentCount = results[1][1] as number;

    if (currentCount >= limit) {
      await this.redis.zremrangebyscore(key, now, now);
      const oldest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = oldest.length > 1 ? parseInt(oldest[1]) + windowMs : now + windowMs;
      return { allowed: false, remaining: 0, resetTime };
    }

    const ttl = await this.redis.pttl(key);
    const resetTime = now + (ttl > 0 ? ttl : windowMs);
    return { allowed: true, remaining: limit - currentCount - 1, resetTime };
  }

  async getCurrentRate(ip: string, windowSeconds: number = 60): Promise<number> {
    const key = `rate_limit:${ip}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    await this.redis.zremrangebyscore(key, 0, now - windowMs);
    return await this.redis.zcard(key);
  }
}
